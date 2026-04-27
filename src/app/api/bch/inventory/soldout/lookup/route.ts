export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query')?.trim();

        if (!query) {
            return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
        }

        const searchTerm = `%${query}%`;

        // 1. Search master_inventory (Active Inventory)
        const masterResults = await sql`
            SELECT 
                id,
                barcode,
                lot_number,
                lot_id,
                brand,
                model,
                series,
                product_name,
                category,
                processor,
                processor_gen,
                ram,
                storage,
                condition_status,
                quantity,
                unit_cost,
                base_price,
                offer_price
            FROM master_inventory
            WHERE quantity > 0
              AND (
                barcode ILIKE ${searchTerm}
                OR model ILIKE ${searchTerm}
                OR brand ILIKE ${searchTerm}
                OR series ILIKE ${searchTerm}
                OR product_name ILIKE ${searchTerm}
                OR lot_number ILIKE ${searchTerm}
              )
            ORDER BY lot_number, brand, model
        ` as unknown as any[];

        // 2. Search purchase_lot_items (Purchase Lots / Incoming)
        const purchaseResults = await sql`
            SELECT 
                pli.id,
                pl.lot_number,
                pli.lot_id,
                pli.brand,
                pli.model,
                pli.series,
                pli.product_name,
                pli.product_type as category,
                pli.processor,
                pli.processor_gen,
                pli.ram,
                pli.storage,
                pli.condition_status,
                pli.quantity,
                pli.qc_count,
                pli.unit_cost,
                pli.total_cost,
                pl.supplier_name,
                pl.status as lot_status
            FROM purchase_lot_items pli
            JOIN purchase_lots pl ON pli.lot_id = pl.id
            WHERE pli.quantity > 0
              AND (
                pli.model ILIKE ${searchTerm}
                OR pli.brand ILIKE ${searchTerm}
                OR pli.series ILIKE ${searchTerm}
                OR pli.product_name ILIKE ${searchTerm}
                OR pl.lot_number ILIKE ${searchTerm}
                OR pli.sku ILIKE ${searchTerm}
              )
            ORDER BY pl.lot_number, pli.brand, pli.model
        ` as unknown as any[];

        return NextResponse.json({
            master: masterResults,
            purchase: purchaseResults
        });
    } catch (error: unknown) {
        console.error('[SoldOut Lookup] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
