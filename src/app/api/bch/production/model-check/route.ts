import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query || query.length < 2) {
            return NextResponse.json({ master: [], purchase: [] });
        }

        const searchTerm = `%${query}%`;
        console.log(`[ModelCheck] Searching for: ${searchTerm}`);

        // 1. Search Master Inventory
        let masterResults: any[] = [];
        try {
            // Fetch detailed columns for table view
            // Note: master_inventory might not have 'processor_gen', it might be 'generation'. 
            // Also checking for 'selling_price'.
            masterResults = await sql`
                SELECT 
                    mi.id, mi.product_name, mi.brand, mi.model, mi.series, mi.sku, 
                    mi.processor, mi.generation, mi.ram, mi.storage,
                    mi.serial_number, mi.barcode, mi.lot_number, 
                    mi.condition_status, mi.qc_status, 
                    COALESCE(pp.unit_cost, mi.unit_cost, 0) as unit_cost, 
                    COALESCE(pp.base_price, mi.selling_price, 0) as selling_price,
                    mi.created_at
                FROM master_inventory mi
                LEFT JOIN products_price pp ON pp.source = 'master_inventory' AND pp.source_id = mi.id
                WHERE 
                    mi.product_name ILIKE ${searchTerm} OR
                    mi.model ILIKE ${searchTerm} OR
                    mi.sku ILIKE ${searchTerm} OR
                    mi.serial_number ILIKE ${searchTerm} OR
                    mi.barcode ILIKE ${searchTerm}
                ORDER BY mi.created_at DESC
                LIMIT 50
            ` as any[];
            console.log(`[ModelCheck] Master results: ${masterResults.length}`);
        } catch (e: any) {
            console.error('[ModelCheck] Master Inventory search failed:', e.message);
        }

        // 2. Search Purchase Lots
        let purchaseResults: any[] = [];
        try {
            // Aggregated Query for Total Qty per Variant
            purchaseResults = await sql`
                SELECT 
                    MIN(pli.id) as id,
                    pli.product_name, 
                    SUM(pli.quantity) as quantity, 
                    SUM(pli.qc_count) as qc_count, 
                    COALESCE(MAX(pp.unit_cost), AVG(pli.unit_cost), 0) as unit_cost,
                    COALESCE(MAX(pp.base_price), 0) as selling_price,
                    pli.processor, 
                    pli.processor_gen,
                    pl.lot_number, 
                    pl.supplier_name, 
                    pl.status as lot_status, 
                    MAX(pl.created_at) as created_at
                FROM purchase_lot_items pli
                JOIN purchase_lots pl ON pli.lot_id = pl.id
                LEFT JOIN products_price pp ON pp.source = 'purchase' AND pp.source_id = pli.id
                WHERE 
                    pli.product_name ILIKE ${searchTerm} OR
                    pl.lot_number ILIKE ${searchTerm}
                GROUP BY 
                    pli.product_name, pli.processor, pli.processor_gen, 
                    pl.lot_number, pl.supplier_name, pl.status
                ORDER BY created_at DESC
                LIMIT 50
            ` as any[];
            console.log(`[ModelCheck] Purchase results: ${purchaseResults.length}`);
        } catch (e: any) {
            console.error('[ModelCheck] Purchase Lots search failed:', e.message);
        }

        return NextResponse.json({
            master: masterResults,
            purchase: purchaseResults
        });

    } catch (error: any) {
        console.error('Model Search Error (General):', error);
        return NextResponse.json(
            { error: 'Failed to search models: ' + error.message },
            { status: 500 }
        );
    }
}
