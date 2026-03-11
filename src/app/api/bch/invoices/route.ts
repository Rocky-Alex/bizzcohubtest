import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { Invoice } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const invoiceNo = url.searchParams.get('invoiceNo');

        const data = await (invoiceNo
            ? sql`SELECT * FROM invoices WHERE invoice_no = ${invoiceNo} ORDER BY created_date DESC`
            : sql`SELECT * FROM invoices ORDER BY created_date DESC`
        ) as unknown as Invoice[];

        return NextResponse.json({ invoices: data }, { 
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching invoices:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
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
            notes,
            terms,
            advanceReceived
        } = body;

        // Validation
        if (!invoiceNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
                ${paymentType}, ${status || 'Pending'}, ${isTaxable}, ${isDiscountable}, ${showTerms !== undefined ? showTerms : true}, ${advanceReceived || 0},
                ${notes || null}, ${terms || null}
            ) RETURNING id
        ` as unknown as { id: number }[];

        const invoiceId = invoiceResult[0].id;

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
            'Admin'
        );

        return NextResponse.json({ message: 'Invoice created successfully', invoiceId }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error creating invoice:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === '23505') {
            return NextResponse.json({ error: 'Invoice number already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
