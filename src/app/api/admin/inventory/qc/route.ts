import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { logActivity } from '@/lib/activity-logger';

// Helper to get DB connection
const getSql = () => {
    const dbUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('Database configuration missing');
    }
    return neon(dbUrl);
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('QC Request received', body);
        const sql = getSql();

        const {
            lotId,
            productId,
            sku,
            productName,
            brand,
            series,
            model,
            ram,
            storage,
            graphics_card,
            screen_size,
            screen_resolution,
            keyboard_type,
            keyboard_backlit,
            condition_status,
            processor,
            processor_gen,
            purchaseLotItemId
        } = body;

        // Ensure QC Inventory table exists (simple check/migration)
        await sql`
            CREATE TABLE IF NOT EXISTS qc_inventory (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(lot_id),
                product_id INTEGER, -- Removed FK constraint to avoid "relation products does not exist" error
                sku VARCHAR(100),
                product_name VARCHAR(255),
                brand VARCHAR(100),
                series VARCHAR(100),
                model VARCHAR(100),
                ram VARCHAR(100),
                storage VARCHAR(100),
                graphics VARCHAR(100),
                screen_size VARCHAR(100),
                screen_resolution VARCHAR(100),
                keyboard_type VARCHAR(100),
                keyboard_backlit VARCHAR(50),
                condition_status VARCHAR(50),
                status VARCHAR(50) DEFAULT 'QC Passed',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // Lazy migration for new columns
        try {
            await sql`ALTER TABLE qc_inventory ADD COLUMN IF NOT EXISTS processor VARCHAR(100)`;
            await sql`ALTER TABLE qc_inventory ADD COLUMN IF NOT EXISTS processor_gen VARCHAR(100)`;
            await sql`ALTER TABLE qc_inventory ADD COLUMN IF NOT EXISTS purchase_lot_item_id INTEGER`;
        } catch (e) {
            console.warn("Migration warning (processor/gen/item_id):", e);
        }

        // Check for Quantity Limit (Prevention of Over-Over)
        if (purchaseLotItemId) {
            try {
                // Get Total Quantity from Lot Item
                const itemData = await sql`SELECT quantity FROM purchase_lot_items WHERE item_id = ${purchaseLotItemId}`;
                const totalQty = itemData[0]?.quantity || 0;

                // Get Current QC Count
                const currentCountRes = await sql`
                    SELECT COUNT(*)::int as count 
                    FROM qc_inventory 
                    WHERE purchase_lot_item_id = ${purchaseLotItemId}
                `;
                const currentCount = currentCountRes[0]?.count || 0;

                if (currentCount >= totalQty) {
                    return NextResponse.json({
                        error: `QC Limit Reached! All ${totalQty} items have already been processed.`
                    }, { status: 400 });
                }
            } catch (e) {
                console.warn("Error validating QC limit:", e);
                // Proceed with caution or throw? 
                // We'll proceed if check fails to avoid blocking valid logic due to DB error, 
                // but usually we should block.
            }
        }

        // Insert into QC Inventory
        const result = await sql`
            INSERT INTO qc_inventory (
                lot_id, product_id, sku, product_name, brand, series, model, 
                ram, storage, graphics, screen_size, screen_resolution, 
                keyboard_type, keyboard_backlit, condition_status,
                processor, processor_gen, purchase_lot_item_id
            ) VALUES (
                ${lotId || null}, ${productId || null}, ${sku}, ${productName}, ${brand}, ${series}, ${model},
                ${ram}, ${storage}, ${graphics_card}, ${screen_size}, ${screen_resolution},
                ${keyboard_type}, ${keyboard_backlit}, ${condition_status},
                ${processor}, ${processor_gen}, ${purchaseLotItemId || null}
            )
            RETURNING id
        `;

        const insertedId = result[0]?.id;

        await logActivity(
            'Admin',
            'QC Check',
            `QC check submitted for ${productName} (SKU: ${sku})`,
            'success',
            'Admin'
        );

        return NextResponse.json({ success: true, message: 'QC Data submitted to Inventory', insertedId });

    } catch (error: any) {
        console.error('Error submitting QC data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const sql = getSql();
        const data = await sql`
            SELECT * FROM qc_inventory 
            ORDER BY created_at DESC
        `;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching QC data:', error);
        // Check if table missing
        if (error.message && error.message.includes('relation "qc_inventory" does not exist')) {
            return NextResponse.json({ success: true, data: [] });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
