import { NextResponse } from 'next/server';
import { invoiceSql as sql, sql as mainSql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { Invoice } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const invoiceNo = url.searchParams.get('invoiceNo');

        let data = await (invoiceNo
            ? sql`SELECT * FROM invoices WHERE invoice_no = ${invoiceNo} ORDER BY created_date DESC`
            : sql`SELECT * FROM invoices ORDER BY created_date DESC`
        ) as unknown as any[];

        const salesPort = url.searchParams.get('salesPort') === 'true';
        if (salesPort) {
            // Get total quantities for each invoice
            const totals = await sql`
                SELECT invoice_id, SUM(quantity) as total_qty 
                FROM invoice_items 
                GROUP BY invoice_id
            ` as unknown as any[];

            // Get sold quantities for each invoice from sale_out (Main DB)
            const solds = await mainSql`
                SELECT invoice_no, SUM(quantity) as sold_qty 
                FROM sale_out 
                GROUP BY invoice_no
            ` as unknown as any[];

            data = data.filter(inv => {
                const total = totals.find(t => t.invoice_id === inv.id)?.total_qty || 0;
                const sold = solds.find(s => s.invoice_no === inv.invoice_no)?.sold_qty || 0;
                return Number(total) > Number(sold);
            });
        }

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
                    invoice_id, description, quantity, unit_price, discount, total, product_code, inventory_id, source, ram, storage, graphics
                ) VALUES (
                    ${invoiceId}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}, ${item.product_code || null}, ${item.inventory_id || null}, ${item.source || null}, ${item.ram || null}, ${item.storage || null}, ${item.graphics || null}
                )
            `;
        }

        // 3. Handle initial payment record in dedicated table
        if (Number(advanceReceived) > 0) {
            const [lastP] = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM invoice_payments` as unknown as any[];
            const nextId = lastP.next_id;
            const receiptNo = `REC-I${nextId.toString().padStart(4, '0')}`;
            
            await sql`
                INSERT INTO invoice_payments (
                    invoice_id, amount, payment_date, payment_method, notes, receipt_no, staff_name
                ) VALUES (
                    ${invoiceId}, ${advanceReceived}, ${createdDate}, ${paymentType}, 'Initial Advance', ${receiptNo}, 'Admin'
                )
            `;
        }

        await logActivity(
            customerName || 'Admin',
            'Create Invoice',
            `Invoice #${invoiceNo} created for ${customerName}. Total: ${totalAmount}. Advance: ${advanceReceived || 0}`,
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
