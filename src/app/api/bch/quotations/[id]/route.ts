import { NextResponse } from 'next/server';
import { quotationSql as sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;

        const quotationResult = await sql`
            SELECT * FROM quotations WHERE id = ${id}
        ` as unknown as any[];

        if (quotationResult.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        const itemsResult = await sql`
            SELECT * FROM quotation_items WHERE quotation_id = ${id}
        ` as unknown as any[];

        return NextResponse.json({ quotation: quotationResult[0], items: itemsResult }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching quotation details:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Update quotation status
        const result = await sql`
            UPDATE quotations
            SET status = ${status}
            WHERE id = ${id}
            RETURNING id, status
        ` as unknown as any[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        await logActivity(
            'Admin',
            'Update Quotation Status',
            `Quotation #${id} status updated to ${status}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Status updated successfully', quotation: result[0] }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error updating quotation status:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;
        const body = await req.json();
        const {
            quotationNo, customerId, customerName, customerAddress, customerEmail, customerPhone,
            createdDate, dueDate, subTotal, discountTotal, taxRate, taxAmount, totalAmount,
            paymentType, status, isTaxable, isDiscountable, showTerms, advanceReceived, items,
            notes, terms // Add notes and terms
        } = body;

        // Validation
        if (!quotationNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch existing quotation to compare changes
        const existingQuotationResult = await sql`SELECT * FROM quotations WHERE id = ${id}` as unknown as any[];
        const changeDetails = [`Quotation #${quotationNo} updated.`];

        if (existingQuotationResult.length > 0) {
            const old = existingQuotationResult[0];

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

        // Update Quotation
        const result = await sql`
            UPDATE quotations SET
                quotation_no = ${quotationNo},
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
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        // --- Handle initial payment synchronization ---
        const [existingInitial] = await sql`
            SELECT id FROM quotation_payments 
            WHERE quotation_id = ${id} AND notes = 'Initial Advance' 
            LIMIT 1
        ` as unknown as any[];

        if (Number(advanceReceived) > 0) {
            if (existingInitial) {
                await sql`
                    UPDATE quotation_payments 
                    SET amount = ${advanceReceived}, payment_date = ${createdDate}, payment_method = ${paymentType}
                    WHERE id = ${existingInitial.id}
                `;
            } else {
                const [lastP] = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM quotation_payments` as unknown as any[];
                const nextId = lastP.next_id;
                const receiptNo = `REC-Q${nextId.toString().padStart(4, '0')}`;
                await sql`
                    INSERT INTO quotation_payments (
                        quotation_id, amount, payment_date, payment_method, notes, receipt_no, staff_name
                    ) VALUES (
                        ${id}, ${advanceReceived}, ${createdDate}, ${paymentType}, 'Initial Advance', ${receiptNo}, 'Admin'
                    )
                `;
            }
        } else if (existingInitial) {
            await sql`DELETE FROM quotation_payments WHERE id = ${existingInitial.id}`;
        }

        // 1. Fetch existing items to revert stock
        const existingItems = await sql`SELECT product_code, quantity FROM quotation_items WHERE quotation_id = ${id}` as unknown as any[];

        // 2. Revert stock (Add back old quantities)
        for (const item of existingItems) {
            if (item.product_code) {
                await sql`
                    UPDATE products 
                    SET stock_quantity = stock_quantity + ${Number(item.quantity)}
                    WHERE product_code = ${item.product_code}
                `;
            }
        }

        // Replace Items
        await sql`DELETE FROM quotation_items WHERE quotation_id = ${id}`;

        // Ensure column exists (Migration fix for existing dbs)
        try {
            await sql`ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS product_code TEXT`;
        } catch (e: unknown) {
            console.log('Migration note (quotation_items update):', e);
        }

        const itemsList = Array.isArray(items) ? items : [];
        for (const item of itemsList) {
            await sql`
                INSERT INTO quotation_items (
                    quotation_id, description, quantity, unit_price, discount, total, product_code
                ) VALUES (
                    ${id}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}, ${item.product_code || null}
                )
            `;

            // Deduct from Inventory if product_code is provided
            if (item.product_code) {
                await sql`
                    UPDATE products 
                    SET stock_quantity = stock_quantity - ${Number(item.qty)}
                    WHERE product_code = ${item.product_code}
                `;
            }
        }

        await logActivity(
            customerName || 'Admin',
            'Update Quotation',
            changeDetails.join('\n'), // Use newline to separate changes
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Quotation updated successfully' }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error updating quotation:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;

        const result = await sql`
            DELETE FROM quotations
            WHERE id = ${id}
            RETURNING id
        ` as unknown as any[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        await logActivity(
            'Admin',
            'Delete Quotation',
            `Quotation #${id} deleted`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Quotation deleted successfully' }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error deleting quotation:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

