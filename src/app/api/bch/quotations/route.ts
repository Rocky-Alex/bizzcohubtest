import { NextResponse } from 'next/server';
import { quotationSql as sql, sql as mainSql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { Quotation } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const quotationNo = url.searchParams.get('quotationNo');

        let data = await (quotationNo
            ? sql`SELECT * FROM quotations WHERE quotation_no = ${quotationNo} ORDER BY created_date DESC`
            : sql`SELECT * FROM quotations ORDER BY created_date DESC`
        ) as unknown as any[];

        const salesPort = url.searchParams.get('salesPort') === 'true';
        if (salesPort) {
            // Get total quantities for each quotation
            const totals = await sql`
                SELECT quotation_id, SUM(quantity) as total_qty 
                FROM quotation_items 
                GROUP BY quotation_id
            ` as unknown as any[];

            // Get sold quantities for each quotation from sale_out (Main DB)
            const solds = await mainSql`
                SELECT invoice_no, SUM(quantity) as sold_qty 
                FROM sale_out 
                GROUP BY invoice_no
            ` as unknown as any[];

            data = data.filter(q => {
                const total = totals.find(t => t.quotation_id === q.id)?.total_qty || 0;
                const sold = solds.find(s => s.invoice_no === q.quotation_no)?.sold_qty || 0;
                return Number(total) > Number(sold);
            });
        }

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
        if (!quotationNo) {
            return NextResponse.json({ error: 'Quotation number is required' }, { status: 400 });
        }
        if (!customerName) {
            return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
        }
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
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
                    quotation_id, description, quantity, unit_price, discount, total, product_code, ram, storage, graphics, inventory_id, source
                ) VALUES (
                    ${quotationId}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}, ${item.product_code || null}, ${item.ram || null}, ${item.storage || null}, ${item.graphics || null}, ${item.inventory_id || null}, ${item.source || null}
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

        // 3. Handle initial payment record in dedicated table
        if (Number(advanceReceived) > 0) {
            const [lastP] = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM quotation_payments` as unknown as any[];
            const nextId = lastP.next_id;
            const receiptNo = `REC-Q${nextId.toString().padStart(4, '0')}`;
            
            await sql`
                INSERT INTO quotation_payments (
                    quotation_id, amount, payment_date, payment_method, notes, receipt_no, staff_name
                ) VALUES (
                    ${quotationId}, ${advanceReceived}, ${createdDate}, ${paymentType}, 'Initial Advance', ${receiptNo}, 'Admin'
                )
            `;
        }

        await logActivity(
            customerName || 'Admin',
            'Create Quotation',
            `Quotation #${quotationNo} created for ${customerName}. Total: ${totalAmount}. Advance: ${advanceReceived || 0}`,
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


