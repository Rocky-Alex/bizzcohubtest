import { NextResponse } from 'next/server';
import { invoiceSql, quotationSql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { bills } = body;

        if (!bills || !Array.isArray(bills)) {
            return NextResponse.json({ success: false, error: 'Bills array is required' }, { status: 400 });
        }

        // Group bills by "Bill #" to handle multi-item invoices
        const groups: Record<string, any[]> = {};
        bills.forEach(row => {
            const billNo = row['Bill #']?.toString() || 'unknown';
            if (!groups[billNo]) groups[billNo] = [];
            groups[billNo].push(row);
        });

        let importedInvoices = 0;
        let importedQuotations = 0;
        let errors = [];

        // Helper to find value by normalized key
        const getVal = (row: any, ...keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
                // Exact match first
                if (row[key] !== undefined) return row[key];
                
                // Then try normalized match (lowercase, no spaces)
                const normalizedSearch = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                const match = rowKeys.find(rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSearch);
                if (match) return row[match];
            }
            return undefined;
        };

        for (const billNo in groups) {
            if (billNo === 'unknown') {
                errors.push("Skipping rows with missing Bill #");
                continue;
            }

            const rows = groups[billNo];
            const firstRow = rows[0];
            
            try {
                const typeVal = getVal(firstRow, 'Type', 'Document Type', 'Doc Type') || '';
                const type = typeVal.toString().toLowerCase();
                
                const customerName = (getVal(firstRow, 'Customer Name', 'Customer', 'Client', 'Name') || '').toString().trim();
                
                if (!customerName) {
                    errors.push(`Skipping ${billNo}: Missing Customer Name`);
                    continue;
                }

                // Parse numeric fields safely
                const totalAmount = parseFloat(getVal(firstRow, 'Total Amount', 'Total', 'Amount')?.toString().replace(/[^0-9.]/g, '') || '0');
                const subTotal = parseFloat(getVal(firstRow, 'Sub Total', 'Subtotal')?.toString().replace(/[^0-9.]/g, '') || totalAmount.toString());
                const taxAmount = parseFloat(getVal(firstRow, 'Tax Amount', 'VAT', 'Tax')?.toString().replace(/[^0-9.]/g, '') || '0');
                const discountTotal = parseFloat(getVal(firstRow, 'Discount Total', 'Discount')?.toString().replace(/[^0-9.]/g, '') || '0');
                const advanceReceived = parseFloat(getVal(firstRow, 'Advance Received', 'Advance', 'Paid')?.toString().replace(/[^0-9.]/g, '') || '0');
                
                // Parse dates
                const dateVal = getVal(firstRow, 'Date', 'Bill Date', 'Invoice Date');
                const createdDate = dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                
                const dueDateVal = getVal(firstRow, 'Due Date', 'Due');
                const dueDate = dueDateVal ? new Date(dueDateVal).toISOString().split('T')[0] : createdDate;
                
                const status = getVal(firstRow, 'Status') || 'Pending';
                const paymentType = getVal(firstRow, 'Payment Type', 'Payment Method', 'Method') || 'Cash';
                const customerEmail = getVal(firstRow, 'Customer Email', 'Email') || '';
                const customerPhone = getVal(firstRow, 'Customer Phone', 'Phone', 'Contact') || '';
                const customerAddress = getVal(firstRow, 'Customer Address', 'Address') || '';
                const notes = getVal(firstRow, 'Notes', 'Remark') || '';

                if (type === 'invoice' || type === 'invoices') {
                    // Check if invoice_no exists
                    const existing = await invoiceSql`SELECT id FROM invoices WHERE invoice_no = ${billNo}` as any[];
                    if (existing.length > 0) {
                        errors.push(`Invoice #${billNo} already exists`);
                        continue;
                    }

                    const result = await invoiceSql`
                        INSERT INTO invoices (
                            invoice_no, customer_name, customer_email, customer_phone, customer_address,
                            created_date, due_date, sub_total, discount_total, tax_amount, total_amount,
                            advance_received, status, payment_type, notes
                        ) VALUES (
                            ${billNo}, ${customerName}, ${customerEmail}, ${customerPhone}, ${customerAddress},
                            ${createdDate}, ${dueDate}, ${subTotal}, ${discountTotal}, ${taxAmount}, ${totalAmount},
                            ${advanceReceived}, ${status}, ${paymentType}, ${notes}
                        ) RETURNING id
                    ` as any[];

                    const invoiceId = result[0].id;

                    // Add items
                    const itemsToInsert = rows.filter(r => getVal(r, 'Item Description', 'Description', 'Item'));
                    if (itemsToInsert.length > 0) {
                        for (const item of itemsToInsert) {
                            const iSubTotal = parseFloat(getVal(item, 'Item Total', 'Total', 'Subtotal')?.toString().replace(/[^0-9.]/g, '') || '0');
                            const iQty = parseFloat(getVal(item, 'Qty', 'Quantity')?.toString().replace(/[^0-9.]/g, '') || '1');
                            const iUnitPrice = parseFloat(getVal(item, 'Unit Price', 'Price', 'Rate')?.toString().replace(/[^0-9.]/g, '') || '0');
                            const iDiscount = parseFloat(getVal(item, 'Item Discount', 'Discount')?.toString().replace(/[^0-9.]/g, '') || '0');
                            const iDescription = getVal(item, 'Item Description', 'Description', 'Item') || 'Item';

                            await invoiceSql`
                                INSERT INTO invoice_items (
                                    invoice_id, description, quantity, unit_price, discount, total
                                ) VALUES (
                                    ${invoiceId}, ${iDescription}, ${iQty}, ${iUnitPrice}, ${iDiscount}, ${iSubTotal}
                                )
                            `;
                        }
                    } else {
                        // Fallback to a single default item if no item descriptions provided
                        await invoiceSql`
                            INSERT INTO invoice_items (
                                invoice_id, description, quantity, unit_price, discount, total
                            ) VALUES (
                                ${invoiceId}, 'Imported Invoice Item', 1, ${subTotal}, ${discountTotal}, ${subTotal - discountTotal}
                            )
                        `;
                    }

                    // Handle advance payment
                    if (advanceReceived > 0) {
                        const [lastP] = await invoiceSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM invoice_payments` as any[];
                        const nextId = lastP.next_id;
                        const receiptNo = `REC-I${nextId.toString().padStart(4, '0')}`;
                        
                        await invoiceSql`
                            INSERT INTO invoice_payments (
                                invoice_id, amount, payment_date, payment_method, notes, receipt_no, staff_name
                            ) VALUES (
                                ${invoiceId}, ${advanceReceived}, ${createdDate}, ${paymentType}, 'Initial Advance (Imported)', ${receiptNo}, 'Admin'
                            )
                        `;
                    }
                    importedInvoices++;
                } else {
                    // Default to Proforma/Quotation
                    const existing = await quotationSql`SELECT id FROM quotations WHERE quotation_no = ${billNo}` as any[];
                    if (existing.length > 0) {
                        errors.push(`Proforma #${billNo} already exists`);
                        continue;
                    }

                    const result = await quotationSql`
                        INSERT INTO quotations (
                            quotation_no, customer_name, customer_email, customer_phone, customer_address,
                            created_date, due_date, sub_total, discount_total, tax_amount, total_amount,
                            advance_received, status, payment_type
                        ) VALUES (
                            ${billNo}, ${customerName}, ${customerEmail}, ${customerPhone}, ${customerAddress},
                            ${createdDate}, ${dueDate}, ${subTotal}, ${discountTotal}, ${taxAmount}, ${totalAmount},
                            ${advanceReceived}, ${status}, ${paymentType}
                        ) RETURNING id
                    ` as any[];

                    const quotationId = result[0].id;

                    // Add items
                    const itemsToInsert = rows.filter(r => getVal(r, 'Item Description', 'Description', 'Item'));
                    if (itemsToInsert.length > 0) {
                        for (const item of itemsToInsert) {
                            const iSubTotal = parseFloat(getVal(item, 'Item Total', 'Total', 'Subtotal')?.toString().replace(/[^0-9.]/g, '') || '0');
                            const iQty = parseFloat(getVal(item, 'Qty', 'Quantity')?.toString().replace(/[^0-9.]/g, '') || '1');
                            const iUnitPrice = parseFloat(getVal(item, 'Unit Price', 'Price', 'Rate')?.toString().replace(/[^0-9.]/g, '') || '0');
                            const iDiscount = parseFloat(getVal(item, 'Item Discount', 'Discount')?.toString().replace(/[^0-9.]/g, '') || '0');
                            const iDescription = getVal(item, 'Item Description', 'Description', 'Item') || 'Item';

                            await quotationSql`
                                INSERT INTO quotation_items (
                                    quotation_id, description, quantity, unit_price, discount, total
                                ) VALUES (
                                    ${quotationId}, ${iDescription}, ${iQty}, ${iUnitPrice}, ${iDiscount}, ${iSubTotal}
                                )
                            `;
                        }
                    } else {
                        // Fallback
                        await quotationSql`
                            INSERT INTO quotation_items (
                                quotation_id, description, quantity, unit_price, discount, total
                            ) VALUES (
                                ${quotationId}, 'Imported Proforma Item', 1, ${subTotal}, ${discountTotal}, ${subTotal - discountTotal}
                            )
                        `;
                    }

                    // Handle advance payment
                    if (advanceReceived > 0) {
                        const [lastP] = await quotationSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM quotation_payments` as any[];
                        const nextId = lastP.next_id;
                        const receiptNo = `REC-Q${nextId.toString().padStart(4, '0')}`;
                        
                        await quotationSql`
                            INSERT INTO quotation_payments (
                                quotation_id, amount, payment_date, payment_method, notes, receipt_no, staff_name
                            ) VALUES (
                                ${quotationId}, ${advanceReceived}, ${createdDate}, ${paymentType}, 'Initial Advance (Imported)', ${receiptNo}, 'Admin'
                            )
                        `;
                    }
                    importedQuotations++;
                }
            } catch (err: any) {
                errors.push(`Error importing ${billNo}: ${err.message}`);
            }
        }

        if (importedInvoices > 0 || importedQuotations > 0) {
            await logActivity(
                'Admin',
                'Bulk Import Bills',
                `Imported ${importedInvoices} invoices and ${importedQuotations} proformas with their items`,
                'success',
                'Admin'
            );
        }

        return NextResponse.json({
            success: true,
            importedInvoices,
            importedQuotations,
            errors
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
