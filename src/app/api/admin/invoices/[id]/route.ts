import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const invoiceResult = await sql`
            SELECT * FROM invoices WHERE id = ${id}
        `;

        if (invoiceResult.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const itemsResult = await sql`
            SELECT * FROM invoice_items WHERE invoice_id = ${id}
        `;

        return NextResponse.json({ invoice: invoiceResult[0], items: itemsResult }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching invoice details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
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
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Status updated successfully', invoice: result[0] }, { status: 200 });

    } catch (error: any) {
        console.error('Error updating invoice status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await req.json();
        const {
            invoiceNo, customerId, customerName, customerAddress, customerEmail, customerPhone,
            createdDate, dueDate, subTotal, discountTotal, taxRate, taxAmount, totalAmount,
            paymentType, status, isTaxable, isDiscountable, advanceReceived, items
        } = body;

        // Validation
        if (!invoiceNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
                advance_received = ${advanceReceived || 0}
            WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // 1. Fetch existing items to revert stock
        const existingItems = await sql`SELECT product_code, quantity FROM invoice_items WHERE invoice_id = ${id}`;

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
        await sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`;

        // Ensure column exists (Migration fix for existing dbs)
        try {
            await sql`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_code TEXT`;
        } catch (e) {
            console.log('Migration note (invoice_items update):', e);
        }

        for (const item of items) {
            await sql`
                INSERT INTO invoice_items (
                    invoice_id, description, quantity, unit_price, discount, total, product_code
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

        return NextResponse.json({ message: 'Invoice updated successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const result = await sql`
            DELETE FROM invoices
            WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
