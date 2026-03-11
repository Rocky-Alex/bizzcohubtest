import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Auto-create the products_price table if it doesn't exist yet.
// Identifies a price record by (source, source_id) so it works for any origin table.
async function ensurePriceTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS products_price (
            id          SERIAL PRIMARY KEY,
            source      VARCHAR(50)    NOT NULL,
            source_id   INTEGER        NOT NULL,
            unit_cost   NUMERIC(12, 2) DEFAULT 0,
            base_price  NUMERIC(12, 2) DEFAULT 0,
            offer_price NUMERIC(12, 2) DEFAULT 0,
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (source, source_id)
        )
    `);
}

export async function GET(request: NextRequest) {
    try {
        await ensurePriceTable();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim() || '';

        let result;

        if (!search) {
            // No search: show master_inventory, prices from products_price if present
            result = await query(`
                SELECT 
                    mi.id,
                    'master_inventory'                           AS source,
                    mi.product_name,
                    mi.barcode,
                    mi.sku,
                    mi.category,
                    mi.brand,
                    mi.series,
                    mi.model,
                    mi.lot_number,
                    mi.quantity                                  AS stock_quantity,
                    COALESCE(pp.unit_cost,   mi.unit_cost,   0) AS unit_cost,
                    COALESCE(pp.base_price,  mi.base_price,  0) AS base_price,
                    COALESCE(pp.offer_price, mi.offer_price, 0) AS offer_price,
                    mi.primary_image_url
                FROM master_inventory mi
                LEFT JOIN products_price pp
                    ON pp.source = 'master_inventory' AND pp.source_id = mi.id
                ORDER BY mi.created_at DESC
                LIMIT 200
            `);
        } else {
            const pattern = `%${search}%`;

            result = await query(`
                -- 1. master_inventory
                SELECT
                    mi.id,
                    'master_inventory'                           AS source,
                    mi.product_name,
                    mi.barcode,
                    mi.sku,
                    mi.category,
                    mi.brand,
                    mi.series,
                    mi.model,
                    mi.lot_number,
                    mi.quantity                                  AS stock_quantity,
                    COALESCE(pp.unit_cost,   mi.unit_cost,   0) AS unit_cost,
                    COALESCE(pp.base_price,  mi.base_price,  0) AS base_price,
                    COALESCE(pp.offer_price, mi.offer_price, 0) AS offer_price,
                    mi.primary_image_url
                FROM master_inventory mi
                LEFT JOIN products_price pp
                    ON pp.source = 'master_inventory' AND pp.source_id = mi.id
                WHERE
                    mi.product_name ILIKE $1 OR mi.barcode    ILIKE $1 OR
                    mi.sku          ILIKE $1 OR mi.brand       ILIKE $1 OR
                    mi.series       ILIKE $1 OR mi.model       ILIKE $1 OR
                    mi.lot_number   ILIKE $1 OR mi.category    ILIKE $1

                UNION ALL

                -- 2. purchase_lot_items grouped by product (total qty), prices from products_price
                SELECT
                    MIN(pli.id)                                      AS id,
                    'purchase'                                        AS source,
                    pli.product_name,
                    NULL                                              AS barcode,
                    pli.sku,
                    pli.product_type                                  AS category,
                    pli.brand,
                    pli.series,
                    pli.model,
                    STRING_AGG(DISTINCT pl.lot_number, ', ' ORDER BY pl.lot_number) AS lot_number,
                    SUM(pli.quantity)                                 AS stock_quantity,
                    COALESCE(MAX(pp.unit_cost),   AVG(pli.unit_cost), 0) AS unit_cost,
                    COALESCE(MAX(pp.base_price),  0)                  AS base_price,
                    COALESCE(MAX(pp.offer_price), 0)                  AS offer_price,
                    NULL                                              AS primary_image_url
                FROM purchase_lot_items pli
                LEFT JOIN purchase_lots pl  ON pl.id  = pli.lot_id
                LEFT JOIN products_price pp ON pp.source = 'purchase' AND pp.source_id = pli.id
                WHERE
                    pli.product_name ILIKE $1 OR pli.sku    ILIKE $1 OR
                    pli.brand        ILIKE $1 OR pli.series  ILIKE $1 OR
                    pli.model        ILIKE $1 OR pl.lot_number ILIKE $1
                GROUP BY
                    pli.product_name, pli.sku, pli.product_type,
                    pli.brand, pli.series, pli.model

                ORDER BY source ASC, id DESC
                LIMIT 200
            `, [pattern]);
        }

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Pricing API Error:', error?.message || error);
        return NextResponse.json({ error: error?.message || 'Failed to fetch pricing data' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await ensurePriceTable();

        const body = await request.json();
        const { updates } = body;

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        for (const item of updates) {
            if (!item.id || !item.source) continue;

            const unitCost = item.unit_cost !== undefined && item.unit_cost !== null ? Number(item.unit_cost) : 0;
            const basePrice = item.base_price !== undefined && item.base_price !== null ? Number(item.base_price) : 0;
            const offerPrice = item.offer_price !== undefined && item.offer_price !== null ? Number(item.offer_price) : 0;

            // UPSERT into products_price — works for any source
            await query(`
                INSERT INTO products_price (source, source_id, unit_cost, base_price, offer_price, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (source, source_id) DO UPDATE SET
                    unit_cost   = EXCLUDED.unit_cost,
                    base_price  = EXCLUDED.base_price,
                    offer_price = EXCLUDED.offer_price,
                    updated_at  = NOW()
            `, [item.source, item.id, unitCost, basePrice, offerPrice]);
        }

        return NextResponse.json({ success: true, message: `${updates.length} price(s) saved to Products_Price` });
    } catch (error: any) {
        console.error('Pricing PUT Error:', error?.message || error);
        return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 });
    }
}
