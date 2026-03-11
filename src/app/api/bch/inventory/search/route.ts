import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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

        const t0 = searchTerms[0] ? `%${searchTerms[0]}%` : null;
        const t1 = searchTerms[1] ? `%${searchTerms[1]}%` : null;
        const t2 = searchTerms[2] ? `%${searchTerms[2]}%` : null;
        const t3 = searchTerms[3] ? `%${searchTerms[3]}%` : null;

        // Parallel Queries
        const [qcResults, productResults, lotResults] = await Promise.all([
            // 1. Search QC Inventory (Now Master Inventory)
            // Fields: brand, model, product_name, sku, series
            sql`
                SELECT
                    id,
                    'qc_item' as type,
                    product_name as label,
                    sku as code, 
                    condition_status as detail,
                    brand, model, processor, ram, storage
                FROM master_inventory 
                WHERE 
                    (id = ${idParam} AND ${idParam} IS NOT NULL) OR
                    (
                        (${t0}::text IS NULL OR CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t0}) AND
                        (${t1}::text IS NULL OR CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t1}) AND
                        (${t2}::text IS NULL OR CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t2}) AND
                        (${t3}::text IS NULL OR CONCAT_WS(' ', brand, model, series, product_name, sku) ILIKE ${t3})
                    )
                ORDER BY created_at DESC
                LIMIT 15
            ` as unknown as any[],

            // 2. Search Master Products (Generic)
            // Fields: brand, name, product_code, description
            sql`
                SELECT 
                    id, 
                    'product_master' as type,
                    name as label,
                    product_code as code, 
                    description as detail,
                    brand
                FROM products 
                WHERE 
                   (${t0}::text IS NULL OR CONCAT_WS(' ', brand, name, product_code, description) ILIKE ${t0}) AND
                   (${t1}::text IS NULL OR CONCAT_WS(' ', brand, name, product_code, description) ILIKE ${t1}) AND
                   (${t2}::text IS NULL OR CONCAT_WS(' ', brand, name, product_code, description) ILIKE ${t2}) AND
                   (${t3}::text IS NULL OR CONCAT_WS(' ', brand, name, product_code, description) ILIKE ${t3})
                LIMIT 10
            ` as unknown as any[],

            // 3. Search Purchase Lots
            // Fields: lot_number, supplier_name
            sql`
                SELECT 
                    lot_id as id, 
                    'lot' as type,
                    supplier_name as label,
                    lot_number as code, 
                    'Purchase Lot' as detail
                FROM purchase_lots 
                WHERE 
                   (${t0}::text IS NULL OR CONCAT_WS(' ', lot_number, supplier_name) ILIKE ${t0}) AND
                   (${t1}::text IS NULL OR CONCAT_WS(' ', lot_number, supplier_name) ILIKE ${t1}) 
                LIMIT 5
            ` as unknown as any[]
        ]);

        // Combine and format results
        const results = [
            ...qcResults.map(i => ({ ...i, value: `qc_${i.id}`, displayType: 'QC Unit' })),
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
