import { NextResponse } from 'next/server';
import { invoiceSql as sql, sql as mainSql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function GET(req: Request, context: any): Promise<NextResponse> {
    try {
        const params = await Promise.resolve(context.params);
        const { id  } = params;

        const invoiceResult = await sql`
            SELECT * FROM invoices WHERE id = ${id}
        ` as unknown as any[];

        if (invoiceResult.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const itemsResult = await sql`
            SELECT 
                ii.*,
                COALESCE(mi.quantity, (SELECT quantity FROM master_inventory WHERE sku = ii.product_code LIMIT 1)) as master_stock,
                COALESCE(pli.quantity, (SELECT SUM(quantity) FROM purchase_lot_items WHERE sku = ii.product_code)) as purchase_stock
            FROM invoice_items ii
            LEFT JOIN master_inventory mi ON ii.inventory_id = mi.id AND (ii.source = 'master' OR ii.source = 'QC Passed')
            LEFT JOIN purchase_lot_items pli ON ii.inventory_id = pli.id AND (ii.source = 'purchase' OR ii.source = 'Purchase')
            WHERE ii.invoice_id = ${id}
        ` as unknown as any[];

        // Fetch sold quantities from sale_out table (Main DB)
        const invoiceNo = invoiceResult[0].invoice_no;
        const soldResult = await mainSql`
            SELECT inventory_id, source, SUM(quantity) as sold_qty 
            FROM sale_out 
            WHERE invoice_no = ${invoiceNo}
            GROUP BY inventory_id, source
        ` as unknown as any[];

        // Map sold quantities to items
        const itemsWithSold = itemsResult.map(item => {
            const soldRecord = soldResult.find(s => 
                s.inventory_id === item.inventory_id && 
                (s.source?.toLowerCase() === item.source?.toLowerCase() || 
                 (s.source === 'master' && item.source === 'QC Passed'))
            );
            return {
                ...item,
                sold_quantity: soldRecord ? parseInt(soldRecord.sold_qty) : 0
            };
        });

        return NextResponse.json({ invoice: invoiceResult[0], items: itemsWithSold }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching invoice details:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req: Request, context: any): Promise<NextResponse> {
    try {
        const params = await Promise.resolve(context.params);
        const { id  } = params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Update invoice status
        const result = await sql`
            UPDATE invoices
            SET status = ${status}
            WHERE id = ${id}
            RETURNING id, status
        ` as unknown as any[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        await logActivity(
            'Admin',
            'Update Invoice Status',
            `Invoice #${id} status updated to ${status}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Status updated successfully', invoice: result[0] }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error updating invoice status:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(req: Request, context: any): Promise<NextResponse> {
    try {
        const params = await Promise.resolve(context.params);
        const { id  } = params;
        const body = await req.json();
        const {
            invoiceNo, customerId, customerName, customerAddress, customerEmail, customerPhone,
            createdDate, dueDate, subTotal, discountTotal, taxRate, taxAmount, totalAmount,
            paymentType, status, isTaxable, isDiscountable, showTerms, advanceReceived, items,
            notes, terms // Add notes and terms
        } = body;

        // Validation
        if (!invoiceNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch existing invoice to compare changes
        const existingInvoiceResult = await sql`SELECT * FROM invoices WHERE id = ${id}` as unknown as any[];
        const changeDetails = [`Invoice #${invoiceNo} updated.`];

        if (existingInvoiceResult.length > 0) {
            const old = existingInvoiceResult[0];

            if (Number(old.total_amount) !== Number(totalAmount)) {
                changeDetails.push(`Total Amount changed from ${old.total_amount} to ${totalAmount}`);
            }
            if (old.status !== status) {
                changeDetails.push(`Status changed from ${old.status} to ${status}`);
            }
            if (old.payment_type !== paymentType) {
                changeDetails.push(`Payment Type changed from ${old.payment_type} to ${paymentType}`);
            }
            // Add more comparisons as needed
        }

        // Update Invoice
        const result = await sql`
            UPDATE invoices SET
                invoice_no = ${invoiceNo},
                customer_id = ${customerId || null},
                customer_name = ${customerName},
                customer_address = ${customerAddress},
                customer_email = ${customerEmail},
                customer_phone = ${customerPhone},
                created_date = ${createdDate},
                due_date = ${dueDate},
                sub_total = ${subTotal},
                discount_total = ${discountTotal},
                tax_rate = ${taxRate},
                tax_amount = ${taxAmount},
                total_amount = ${totalAmount},
                payment_type = ${paymentType},
                status = ${status || 'Pending'},
                is_taxable = ${isTaxable},
                is_discountable = ${isDiscountable},
                show_terms = ${showTerms},
                advance_received = ${advanceReceived || 0},
                notes = ${notes || null},
                terms_and_conditions = ${terms || null}
            WHERE id = ${id}
            RETURNING id
        ` as unknown as any[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // --- Handle initial payment synchronization ---
        const [existingInitial] = await sql`
            SELECT id FROM invoice_payments 
            WHERE invoice_id = ${id} AND notes = 'Initial Advance' 
            LIMIT 1
        ` as unknown as any[];

        if (Number(advanceReceived) > 0) {
            if (existingInitial) {
                await sql`
                    UPDATE invoice_payments 
                    SET amount = ${advanceReceived}, payment_date = ${createdDate}, payment_method = ${paymentType}
                    WHERE id = ${existingInitial.id}
                `;
            } else {
                const [lastP] = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM invoice_payments` as unknown as any[];
                const nextId = lastP.next_id;
                const receiptNo = `REC-I${nextId.toString().padStart(4, '0')}`;
                await sql`
                    INSERT INTO invoice_payments (
                        invoice_id, amount, payment_date, payment_method, notes, receipt_no, staff_name
                    ) VALUES (
                        ${id}, ${advanceReceived}, ${createdDate}, ${paymentType}, 'Initial Advance', ${receiptNo}, 'Admin'
                    )
                `;
            }
        } else if (existingInitial) {
            await sql`DELETE FROM invoice_payments WHERE id = ${existingInitial.id}`;
        }

        // Replace Items
        await sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`;

        const itemsList = Array.isArray(items) ? items : [];
        for (const item of itemsList) {
            await sql`
                INSERT INTO invoice_items (
                    invoice_id, description, quantity, unit_price, discount, total, product_code, source, inventory_id, ram, storage, graphics
                ) VALUES (
                    ${id}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}, ${item.product_code || null}, ${item.source || null}, ${item.inventory_id || null}, ${item.ram || null}, ${item.storage || null}, ${item.graphics || null}
                )
            `;
        }

        await logActivity(
            customerName || 'Admin',
            'Update Invoice',
            changeDetails.join('\n'), // Use newline to separate changes
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Invoice updated successfully' }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error updating invoice:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(req: Request, context: any): Promise<NextResponse> {
    try {
        const params = await Promise.resolve(context.params);
        const { id  } = params;
        
        const result = await sql`
            DELETE FROM invoices
            WHERE id = ${id}
            RETURNING id
        ` as unknown as any[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        await logActivity(
            'Admin',
            'Delete Invoice',
            `Invoice #${id} deleted`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error deleting invoice:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
