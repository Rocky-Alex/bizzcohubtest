import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const timestamp = searchParams.get('t');
    
    console.log(`[API] GET /api/bch/purchase/lots/inventory${timestamp ? `?t=${timestamp}` : ''}`);

    try {
        const items = await sql`
            SELECT 
                pli.*,
                pl.lot_number as "lotNumber",
                pl.supplier_name as "supplierName",
                pl.invoice_number as "invoiceNumber",
                pl.invoice_date as "invoiceDate",
                pl.status as "lotStatus"
            FROM purchase_lot_items pli
            JOIN purchase_lots pl ON pli.lot_id = pl.id
            ORDER BY pl.created_at DESC, pli.id ASC
        ` as unknown as any[];

        console.log(`[API] Found ${items.length} items across all lots.`);
        if (items.length > 0) {
            console.log(`[API] Sample: Lot ${items[0].lotNumber}, ID ${items[0].id}`);
        }

        return NextResponse.json({ success: true, data: items, count: items.length });
    } catch (error: unknown) {
        console.error('Error fetching purchase lot inventory:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
