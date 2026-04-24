import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, results: [] });
        }

        // Create explicit params for queries
        const searchPattern = query.trim();
        const normalizedQuery = query.trim();

        // Check if query looks like a Barcode/ID (BCH-XXXX or numeric)
        let exactId = null;
        const bchMatch = normalizedQuery.toUpperCase().match(/^BCH-(\d+)$/);

        if (bchMatch) {
            exactId = parseInt(bchMatch[1]) - 999;
        } else if (!isNaN(Number(normalizedQuery))) {
            exactId = parseInt(normalizedQuery);
        }

        const idParam = exactId !== null ? exactId : null; // Ensure explicit null if not set

        // SPLIT QUERY INTO TERMS for multi-match (Space separated)
        // e.g. "HP 840 G8" -> ["HP", "840", "G8"]
        const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean).slice(0, 4); // Max 4 terms for performance

        // Helper to generate dynamic AND conditions for a concatenated string
        // Since we can't dynamic SQL easily with template tags, we'll hardcode up to 4 potential terms
        // Logic: (T1 Matches) AND (T2 Matches) ...

        const t0 = searchTerms[0] ? `%${searchTerms[0]}%` : '%';
        const t1 = searchTerms[1] ? `%${searchTerms[1]}%` : '%';
        const t2 = searchTerms[2] ? `%${searchTerms[2]}%` : '%';
        const t3 = searchTerms[3] ? `%${searchTerms[3]}%` : '%';

        // Parallel Queries with individual error handling to prevent 500s
        const results_raw = await Promise.all([
            // 1. Search QC Inventory (Now Master Inventory)
            sql`
                SELECT
                    mi.id,
                    'qc_item' as type,
                    mi.product_name as label,
                    mi.sku as code, 
                    mi.lot_number,
                    (SELECT COALESCE(SUM(so.quantity), 0) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL) as sold_quantity,
                    (mi.quantity - (SELECT COALESCE(SUM(so.quantity), 0) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL)) as stock_quantity,
                    mi.condition_status as detail,
                    mi.brand, mi.model, mi.processor, mi.ram, mi.storage
                FROM master_inventory mi
                WHERE 
                    (mi.id = ${idParam} AND ${idParam} IS NOT NULL) OR
                    (
                        CONCAT_WS(' ', mi.brand, mi.model, mi.series, mi.product_name, mi.sku) ILIKE ${t0} AND
                        CONCAT_WS(' ', mi.brand, mi.model, mi.series, mi.product_name, mi.sku) ILIKE ${t1} AND
                        CONCAT_WS(' ', mi.brand, mi.model, mi.series, mi.product_name, mi.sku) ILIKE ${t2} AND
                        CONCAT_WS(' ', mi.brand, mi.model, mi.series, mi.product_name, mi.sku) ILIKE ${t3}
                    )
                ORDER BY mi.created_at DESC
                LIMIT 15
            `.catch((err: unknown) => { console.error('QC Search Error:', err); return []; }),

            // 2. Search Master Products (Generic)
            sql`
                SELECT 
                    id, 
                    'product_master' as type,
                    product_name as label,
                    product_code as code, 
                    category as detail,
                    brand, model, series
                FROM products 
                WHERE 
                   CONCAT_WS(' ', brand, product_name, product_code, category) ILIKE ${t0} AND
                   CONCAT_WS(' ', brand, product_name, product_code, category) ILIKE ${t1} AND
                   CONCAT_WS(' ', brand, product_name, product_code, category) ILIKE ${t2} AND
                   CONCAT_WS(' ', brand, product_name, product_code, category) ILIKE ${t3}
                LIMIT 10
            `.catch((err: unknown) => { console.error('Product Search Error:', err); return []; }),

            // 3. Search Purchase Lots
            sql`
                SELECT 
                    id, 
                    'lot' as type,
                    supplier_name as label,
                    lot_number as code, 
                    'Purchase Lot' as detail
                FROM purchase_lots 
                WHERE 
                   CONCAT_WS(' ', lot_number, supplier_name) ILIKE ${t0} AND
                   CONCAT_WS(' ', lot_number, supplier_name) ILIKE ${t1} 
                LIMIT 5
            `.catch((err: unknown) => { console.error('Lot Search Error:', err); return []; }),

            // 4. Search Purchase Lot Items (Individual Products in Lots)
            sql`
                SELECT 
                    pli.id, 
                    'purchase_item' as type,
                    pli.product_name as label,
                    pli.sku as code, 
                    pl.lot_number,
                    (SELECT COALESCE(SUM(so.quantity), 0) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL) as sold_quantity,
                    (pli.quantity - COALESCE(pli.qc_count, 0) - (SELECT COALESCE(SUM(so.quantity), 0) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL)) as stock_quantity,
                    'Purchase Inventory' as detail,
                    pli.brand, pli.model, pli.processor, pli.ram, pli.storage
                FROM purchase_lot_items pli
                JOIN purchase_lots pl ON pli.lot_id = pl.id
                WHERE 
                   CONCAT_WS(' ', pli.brand, pli.model, pli.series, pli.product_name, pli.sku) ILIKE ${t0} AND
                   CONCAT_WS(' ', pli.brand, pli.model, pli.series, pli.product_name, pli.sku) ILIKE ${t1} AND
                   CONCAT_WS(' ', pli.brand, pli.model, pli.series, pli.product_name, pli.sku) ILIKE ${t2} AND
                   CONCAT_WS(' ', pli.brand, pli.model, pli.series, pli.product_name, pli.sku) ILIKE ${t3} AND
                   pli.quantity > 0
                LIMIT 15
            `.catch((err: unknown) => { console.error('Purchase Item Search Error:', err); return []; })
        ]);

        const [qcResults, productResults, lotResults, purchaseItemResults] = results_raw as any[][];

        // Combine and format results
        const results = [
            ...qcResults.map(i => ({ ...i, value: `qc_${i.id}`, displayType: 'Master Inventory' })),
            ...purchaseItemResults.map(i => ({ ...i, value: `pi_${i.id}`, displayType: 'Purchase Inventory' })),
            ...productResults.map(i => ({ ...i, value: `prod_${i.id}`, displayType: 'Master Product' })),
            ...lotResults.map(i => ({ ...i, value: `lot_${i.id}`, displayType: 'Lot' }))
        ];

        return NextResponse.json({ success: true, results: results });

    } catch (error: unknown) {
        console.error('Search API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
