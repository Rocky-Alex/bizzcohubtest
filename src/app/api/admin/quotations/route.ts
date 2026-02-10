import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import { logActivity } from '@/lib/activity-logger';
import { Quotation } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
    try {
        // DDL removed for performance. Schema assumed to exist.


        const data = await sql`
            SELECT * FROM quotations ORDER BY created_at DESC
        ` as unknown as Quotation[];

        return NextResponse.json({ quotations: data }, { status: 200 });
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
            items,
            advanceReceived
        } = body;

        if (!quotationNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // DDL removed for performance.


        const result = await sql`
            INSERT INTO quotations (
                quotation_no, customer_id, customer_name, customer_address, 
                customer_email, customer_phone, created_date, due_date, 
                sub_total, discount_total, tax_rate, tax_amount, total_amount, 
                payment_type, status, is_taxable, is_discountable, advance_received
            ) VALUES (
                ${quotationNo}, ${customerId || null}, ${customerName}, ${customerAddress}, 
                ${customerEmail}, ${customerPhone}, ${createdDate}, ${dueDate}, 
                ${subTotal}, ${discountTotal}, ${taxRate}, ${taxAmount}, ${totalAmount}, 
                ${paymentType}, ${status || 'Pending'}, ${isTaxable}, ${isDiscountable}, ${advanceReceived || 0}
            ) RETURNING id
        ` as unknown as { id: number }[];

        const quotationId = result[0].id;

        for (const item of items) {
            await sql`
                INSERT INTO quotation_items (
                    quotation_id, description, quantity, unit_price, discount, total
                ) VALUES (
                    ${quotationId}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}
                )
            `;
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
