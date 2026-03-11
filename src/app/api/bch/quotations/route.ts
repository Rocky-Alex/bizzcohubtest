import { NextResponse } from 'next/server';
import { quotationSql as sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { Quotation } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const quotationNo = url.searchParams.get('quotationNo');

        const data = await (quotationNo
            ? sql`SELECT * FROM quotations WHERE quotation_no = ${quotationNo} ORDER BY created_date DESC`
            : sql`SELECT * FROM quotations ORDER BY created_date DESC`
        ) as unknown as Quotation[];

        return NextResponse.json({ quotations: data }, { 
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching quotations:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const {
            quotationNo,
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
        if (!quotationNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert Quotation
        const quotationResult = await sql`
            INSERT INTO quotations (
                quotation_no, customer_id, customer_name, customer_address, 
                customer_email, customer_phone, created_date, due_date, 
                sub_total, discount_total, tax_rate, tax_amount, total_amount, 
                payment_type, status, is_taxable, is_discountable, show_terms, advance_received, notes, terms_and_conditions
            ) VALUES (
                ${quotationNo}, ${customerId || null}, ${customerName}, ${customerAddress}, 
                ${customerEmail}, ${customerPhone}, ${createdDate}, ${dueDate}, 
                ${subTotal}, ${discountTotal}, ${taxRate}, ${taxAmount}, ${totalAmount}, 
                ${paymentType}, ${status || 'Pending'}, ${isTaxable}, ${isDiscountable}, ${showTerms !== undefined ? showTerms : true}, ${advanceReceived || 0},
                ${notes || null}, ${terms || null}
            ) RETURNING id
        ` as unknown as { id: number }[];

        const quotationId = quotationResult[0].id;

        // Insert Items
        for (const item of items) {
            await sql`
                INSERT INTO quotation_items (
                    quotation_id, description, quantity, unit_price, discount, total, product_code
                ) VALUES (
                    ${quotationId}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}, ${item.product_code || null}
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
            'Create Quotation',
            `Quotation #${quotationNo} created for ${customerName}. Total: ${totalAmount}.`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Quotation created successfully', quotationId }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error creating quotation:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === '23505') {
            return NextResponse.json({ error: 'Quotation number already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}


