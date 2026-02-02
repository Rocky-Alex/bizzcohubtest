import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        // DDL removed for performance. Schema assumed to exist.


        const data = await sql`
            SELECT * FROM invoices 
            WHERE 1=1
            ${url.searchParams.get('invoiceNo') ? sql`AND invoice_no = ${url.searchParams.get('invoiceNo')}` : sql``}
            ORDER BY created_date DESC
        `;

        return NextResponse.json({ invoices: data }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            invoiceNo,
            customerId,
            customerName,
            customerAddress,
            customerEmail,
            customerPhone,
            createdDate,
            dueDate,
            subTotal,
            discountTotal,
            taxRate,
            taxAmount,
            totalAmount,
            paymentType,
            status,
            isTaxable,
            isDiscountable,
            showTerms,
            items,
            notes, // Add notes
            terms, // Add terms
            advanceReceived // New field
        } = body;

        // Validation
        if (!invoiceNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // DDL removed for performance.
        // Ensure new column exists
        try {
            await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS show_terms BOOLEAN DEFAULT TRUE`;
            await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT`;
        } catch (e) {
            console.log('Migration note (invoices):', e);
        }

        // Insert Invoice
        const invoiceResult = await sql`
            INSERT INTO invoices (
                invoice_no, customer_id, customer_name, customer_address, 
                customer_email, customer_phone, created_date, due_date, 
                sub_total, discount_total, tax_rate, tax_amount, total_amount, 
                payment_type, status, is_taxable, is_discountable, show_terms, advance_received, notes, terms_and_conditions
            ) VALUES (
                ${invoiceNo}, ${customerId || null}, ${customerName}, ${customerAddress}, 
                ${customerEmail}, ${customerPhone}, ${createdDate}, ${dueDate}, 
                ${subTotal}, ${discountTotal}, ${taxRate}, ${taxAmount}, ${totalAmount}, 
                ${paymentType}, ${status || 'Pending'}, ${isTaxable}, ${isDiscountable}, ${showTerms}, ${advanceReceived || 0},
                ${notes || null}, ${terms || null}
            ) RETURNING id
        `;

        const invoiceId = invoiceResult[0].id;

        // Ensure column exists
        try {
            await sql`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_code TEXT`;
        } catch (e) {
            console.log('Migration note (invoice_items):', e);
        }

        // Insert Items
        for (const item of items) {
            await sql`
                INSERT INTO invoice_items (
                    invoice_id, description, quantity, unit_price, discount, total, product_code
                ) VALUES (
                    ${invoiceId}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}, ${item.product_code || null}
                )
            `;

            // Deduct from Inventory if product_code is provided
            if (item.product_code) {
                // We use GREATEST(0, ...) to prevent negative stock if that's desired, 
                // but usually simply subtracting is fine and lets admin see negative stock if they oversold.
                // Let's just subtract. If they want to prevent negative, we'd check first.
                // User said "reduce from the inventory".
                await sql`
                    UPDATE products 
                    SET stock_quantity = stock_quantity - ${Number(item.qty)}
                    WHERE product_code = ${item.product_code}
                `;
            }
        }

        await logActivity(
            customerName || 'Admin',
            'Create Invoice',
            `Invoice #${invoiceNo} created for ${customerName}. Total: ${totalAmount}.`,
            'success',
            'Admin' // Assuming Admin creates invoice, could be passed from body if needed
        );

        return NextResponse.json({ message: 'Invoice created successfully', invoiceId }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating invoice:', error);
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Invoice number already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
