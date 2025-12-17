import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';

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
            items,
            advanceReceived // New field
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
                advance_received NUMERIC(15, 2) DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Ensure column exists (migration for existing table)
        await sql`
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS advance_received NUMERIC(15, 2) DEFAULT 0
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

        // Insert Invoice
        const invoiceResult = await sql`
            INSERT INTO invoices (
                invoice_no, customer_id, customer_name, customer_address, 
                customer_email, customer_phone, created_date, due_date, 
                sub_total, discount_total, tax_rate, tax_amount, total_amount, 
                payment_type, status, is_taxable, is_discountable, advance_received
            ) VALUES (
                ${invoiceNo}, ${customerId || null}, ${customerName}, ${customerAddress}, 
                ${customerEmail}, ${customerPhone}, ${createdDate}, ${dueDate}, 
                ${subTotal}, ${discountTotal}, ${taxRate}, ${taxAmount}, ${totalAmount}, 
                ${paymentType}, ${status || 'Pending'}, ${isTaxable}, ${isDiscountable}, ${advanceReceived || 0}
            ) RETURNING id
        `;

        const invoiceId = invoiceResult[0].id;

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

        return NextResponse.json({ message: 'Invoice created successfully', invoiceId }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating invoice:', error);
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Invoice number already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
