import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let query;
        if (status === 'completed') {
            query = await sql`
                SELECT pl.id as "lotId", pl.lot_number as "lotNumber", pl.supplier_name as "supplierName", 
                       pl.invoice_date as "invoiceDate", pl.invoice_number as "invoiceNumber", 
                       pl.total_cost as "totalCost", pl.created_at as "createdAt",
                       COUNT(pli.id) as "totalItems"
                FROM purchase_lots pl
                LEFT JOIN purchase_lot_items pli ON pl.id = pli.lot_id
                WHERE pl.status = 'Completed'
                GROUP BY pl.id
                ORDER BY pl.created_at DESC
            `;
        } else {
            query = await sql`
                SELECT pl.id as "lotId", pl.lot_number as "lotNumber", pl.supplier_name as "supplierName", 
                       pl.invoice_date as "invoiceDate", pl.invoice_number as "invoiceNumber", 
                       pl.total_cost as "totalCost", pl.created_at as "createdAt",
                       COUNT(pli.id) as "totalItems"
                FROM purchase_lots pl
                LEFT JOIN purchase_lot_items pli ON pl.id = pli.lot_id
                WHERE pl.status != 'Completed' OR pl.status IS NULL
                GROUP BY pl.id
                ORDER BY pl.created_at DESC
            `;
        }

        return NextResponse.json({ success: true, lots: query });
    } catch (error: any) {
        console.error('Error fetching purchase lots:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
