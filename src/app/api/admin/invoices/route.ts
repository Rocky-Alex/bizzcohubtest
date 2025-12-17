import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function GET() {
    try {
        // Ensure tables exist
        await sql`
            CREATE TABLE IF NOT EXISTS invoices (
                id SERIAL PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                customer_id INTEGER,
                customer_name VARCHAR(255),
                customer_address TEXT,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                created_date DATE,
                due_date DATE,
                sub_total NUMERIC(15, 2),
                discount_total NUMERIC(15, 2),
                tax_rate NUMERIC(5, 2),
                tax_amount NUMERIC(15, 2),
                total_amount NUMERIC(15, 2),
                payment_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Pending',
                is_taxable BOOLEAN DEFAULT TRUE,
                is_discountable BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS invoice_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
                description TEXT,
                quantity INTEGER,
                unit_price NUMERIC(15, 2),
                discount NUMERIC(15, 2),
                total NUMERIC(15, 2)
            )
        `;

        const data = await sql`
            SELECT * FROM invoices ORDER BY created_at DESC
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
            items
        } = body;

        // Validation
        if (!invoiceNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure tables exist before inserting
        await sql`
            CREATE TABLE IF NOT EXISTS invoices (
                id SERIAL PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                customer_id INTEGER,
                customer_name VARCHAR(255),
                customer_address TEXT,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                created_date DATE,
                due_date DATE,
                sub_total NUMERIC(15, 2),
                discount_total NUMERIC(15, 2),
                tax_rate NUMERIC(5, 2),
                tax_amount NUMERIC(15, 2),
                total_amount NUMERIC(15, 2),
                payment_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Pending',
                is_taxable BOOLEAN DEFAULT TRUE,
                is_discountable BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS invoice_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
                description TEXT,
                quantity INTEGER,
                unit_price NUMERIC(15, 2),
                discount NUMERIC(15, 2),
                total NUMERIC(15, 2)
            )
        `;

        let finalInvoiceNo = invoiceNo;
        let invoiceId = null;
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries && !invoiceId) {
            try {
                // Insert Invoice
                const invoiceResult = await sql`
                    INSERT INTO invoices (
                        invoice_no, customer_id, customer_name, customer_address, 
                        customer_email, customer_phone, created_date, due_date, 
                        sub_total, discount_total, tax_rate, tax_amount, total_amount, 
                        payment_type, status, is_taxable, is_discountable
                    ) VALUES (
                        ${finalInvoiceNo}, ${customerId || null}, ${customerName}, ${customerAddress}, 
                        ${customerEmail}, ${customerPhone}, ${createdDate}, ${dueDate}, 
                        ${subTotal}, ${discountTotal}, ${taxRate}, ${taxAmount}, ${totalAmount}, 
                        ${paymentType}, ${status || 'Pending'}, ${isTaxable}, ${isDiscountable}
                    ) RETURNING id
                `;
                invoiceId = invoiceResult[0].id;

            } catch (error: any) {
                if (error.code === '23505') { // Unique violation
                    console.log(`Invoice number ${finalInvoiceNo} exists, generating next...`);

                    // Find max existing number
                    const lastRes = await sql`
                        SELECT invoice_no 
                        FROM invoices 
                        WHERE invoice_no ~ '^#?INV\d+$'
                        ORDER BY CAST(REGEXP_REPLACE(invoice_no, '^#?INV', '') AS INTEGER) DESC
                        LIMIT 1
                    `;

                    let nextNum = 1;
                    if (lastRes.length > 0) {
                        const lastNo = lastRes[0].invoice_no;
                        const numPart = lastNo.replace(/\D/g, '');
                        const parsed = parseInt(numPart, 10);
                        if (!isNaN(parsed)) nextNum = parsed + 1;
                    }

                    // Increment if logic returned same (edge case) or just use nextNum
                    // Note: If multiple requests hit at once, they might calculate same.
                    // But standard retry should clear it up.
                    // We also ensure we don't accidentally reuse the *same* failed number if logic flaw.
                    const candidate = `INV${nextNum.toString().padStart(4, '0')}`;

                    if (candidate === finalInvoiceNo) {
                        // Should not happen if DB has it, but if race condition, maybe.
                        // Force increment
                        nextNum++;
                        finalInvoiceNo = `INV${nextNum.toString().padStart(4, '0')}`;
                    } else {
                        finalInvoiceNo = candidate;
                    }

                    attempt++;
                    continue;
                }
                throw error; // Throw non-duplicate errors
            }
        }

        if (!invoiceId) {
            return NextResponse.json({ error: 'Failed to generate unique invoice number after retries' }, { status: 409 });
        }

        // Insert Items
        for (const item of items) {
            await sql`
                INSERT INTO invoice_items (
                    invoice_id, description, quantity, unit_price, discount, total
                ) VALUES (
                    ${invoiceId}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}
                )
            `;
        }

        return NextResponse.json({
            message: 'Invoice created successfully',
            invoiceId,
            invoiceNo: finalInvoiceNo
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
