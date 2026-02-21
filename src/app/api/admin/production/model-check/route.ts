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
                    id, product_name, brand, model, series, sku, 
                    processor, generation, ram, storage,
                    serial_number, barcode, lot_number, 
                    condition_status, qc_status, 
                    unit_cost, selling_price,
                    created_at
                FROM master_inventory
                WHERE 
                    product_name ILIKE ${searchTerm} OR
                    model ILIKE ${searchTerm} OR
                    sku ILIKE ${searchTerm} OR
                    serial_number ILIKE ${searchTerm} OR
                    barcode ILIKE ${searchTerm}
                ORDER BY created_at DESC
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
                    pli.unit_cost,
                    pli.processor, 
                    pli.processor_gen,
                    pl.lot_number, 
                    pl.supplier_name, 
                    pl.status as lot_status, 
                    MAX(pl.created_at) as created_at
                FROM purchase_lot_items pli
                JOIN purchase_lots pl ON pli.lot_id = pl.id
                WHERE 
                    pli.product_name ILIKE ${searchTerm} OR
                    pl.lot_number ILIKE ${searchTerm}
                GROUP BY 
                    pli.product_name, pli.unit_cost, pli.processor, pli.processor_gen, 
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
