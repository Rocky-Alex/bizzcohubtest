import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function POST(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const id = params.id;

        // Ensure notes column exists (Migration)
        await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`;

        // 1. Fetch Quotation
        const quotationResult = await sql`SELECT * FROM quotations WHERE id = ${id}` as unknown as any[];
        if (quotationResult.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }
        const quote = quotationResult[0];

        // 2. Fetch Quotation Items
        const items = await sql`SELECT * FROM quotation_items WHERE quotation_id = ${id}` as unknown as any[];

        // 3. Generate Next Invoice Number
        const lastInvResult = await sql`
            SELECT invoice_no 
            FROM invoices 
            WHERE invoice_no LIKE 'INV%' 
            ORDER BY LENGTH(invoice_no) DESC, invoice_no DESC 
            LIMIT 1
        ` as unknown as { invoice_no: string }[];

        let nextNumber = 1;
        if (lastInvResult.length > 0) {
            const lastInvoiceNo = lastInvResult[0].invoice_no;
            const match = lastInvoiceNo.match(/^INV(\d+)$/);
            if (match && match[1]) {
                const currentNum = parseInt(match[1], 10);
                if (!isNaN(currentNum)) {
                    nextNumber = currentNum + 1;
                }
            }
        }
        const invoiceNo = `INV${nextNumber.toString().padStart(4, '0')}`;

        // 4. Create Invoice (Insert into invoices)
        // Note: passing the note string as a parameter ${...}
        const invoiceResult = await sql`
            INSERT INTO invoices (
                invoice_no, customer_id, customer_name, customer_address, 
                customer_email, customer_phone, created_date, due_date, 
                sub_total, discount_total, tax_rate, tax_amount, total_amount, 
                payment_type, status, is_taxable, is_discountable, advance_received, 
                notes
            ) VALUES (
                ${invoiceNo}, ${quote.customer_id || null}, ${quote.customer_name}, ${quote.customer_address},
                ${quote.customer_email}, ${quote.customer_phone}, ${new Date().toISOString()}, ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}, 
                ${quote.sub_total}, ${quote.discount_total}, ${quote.tax_rate}, ${quote.tax_amount}, ${quote.total_amount},
                ${quote.payment_type}, 'Pending', ${quote.is_taxable}, ${quote.is_discountable}, 0,
                ${`Converted from Quotation #${quote.quotation_no}`}
            ) RETURNING id
        ` as unknown as { id: number }[];

        const invoiceId = invoiceResult[0].id;

        // 5. Create Invoice Items
        for (const item of items) {
            await sql`
                INSERT INTO invoice_items (
                    invoice_id, description, quantity, unit_price, discount, total
                ) VALUES (
                    ${invoiceId}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.discount}, ${item.total}
                )
            `;
        }

        // 6. Update Quotation Status
        await sql`UPDATE quotations SET status = 'Converted' WHERE id = ${id}`;

        return NextResponse.json({
            message: 'Quotation converted successfully',
            invoiceId,
            invoiceNo
        }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error converting quotation:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
