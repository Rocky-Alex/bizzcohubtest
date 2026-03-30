import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request, { params }: { params: { code: string } }): Promise<NextResponse> {
    try {
        const { code } = params;

        if (!code) {
            return NextResponse.json({ error: 'Product code is required' }, { status: 400 });
        }

        const data = await sql`
            SELECT 
                i.invoice_no, 
                i.created_date, 
                i.customer_name, 
                ii.unit_price, 
                ii.quantity, 
                ii.discount, 
                ii.total
            FROM invoices i
            JOIN invoice_items ii ON i.id = ii.invoice_id
            WHERE ii.product_code = ${code}
            ORDER BY i.created_date DESC
            LIMIT 10
        ` as unknown as any[];

        return NextResponse.json({ history: data }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error fetching product history:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
