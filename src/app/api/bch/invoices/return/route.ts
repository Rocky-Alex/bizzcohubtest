import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { invoiceId, returnedItems } = body;

        if (!invoiceId || !returnedItems || !Array.isArray(returnedItems)) {
            return NextResponse.json({ error: 'Invalid return data' }, { status: 400 });
        }

        // Process each returned item
        for (const item of returnedItems) {
            const { productCode, qty } = item;

            if (qty > 0 && productCode) {
                // Update Inventory
                // We increment stock because it's a return
                await sql`
                    UPDATE products 
                    SET stock_quantity = stock_quantity + ${Number(qty)}
                    WHERE product_code = ${productCode}
                `;
            }
        }

        // Optionally update invoice status or add a note
        // Let's add a note to the invoice saying "Return Processed"
        const note = `\n[${new Date().toISOString().split('T')[0]}] Return Processed: ${returnedItems.map((i: Record<string, any>) => `${i.qty}x ${i.productCode}`).join(', ')}`;

        await sql`
            UPDATE invoices 
            SET notes = COALESCE(notes, '') || ${note}
            WHERE id = ${invoiceId}
        `;

        return NextResponse.json({ message: 'Return processed successfully' }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error processing return:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
