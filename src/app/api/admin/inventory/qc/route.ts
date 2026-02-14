import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const sku = searchParams.get('sku');

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS inventory_qc (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER,
                barcode TEXT,
                purchase_lot_item_id INTEGER,
                sku TEXT,
                product_name TEXT NOT NULL,
                brand TEXT,
                model TEXT,
                series TEXT,
                processor TEXT,
                processor_gen TEXT,
                ram TEXT,
                storage TEXT,
                graphics TEXT,
                screen_size TEXT,
                screen_resolution TEXT,
                keyboard_type TEXT,
                keyboard_backlit TEXT,
                condition_status TEXT,
                status TEXT DEFAULT 'Passed',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Ensure all necessary columns exist (migration)
        try {
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS barcode TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS graphics TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS processor_gen TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS screen_size TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS screen_resolution TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS keyboard_type TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS keyboard_backlit TEXT`;
        } catch (e: unknown) {
            console.warn('Could not update inventory_qc schema:', e);
        }

        let items;
        // Check for BCH-XXXX format
        const bchMatch = (sku || search || '').toString().toUpperCase().match(/^BCH-(\d+)$/);

        // NOTE: inventory_qc.sku is treated as Serial Number.
        // We join products on product_name because sku (Serial) won't match product_code (Model).
        if (bchMatch) {
            const seqNum = parseInt(bchMatch[1]);
            const id = seqNum - 999;
            if (id > 0) {
                // Try looking up by ID first
                items = await sql`
                    SELECT inventory_qc.*, p.ram as product_ram, p.storage as product_storage 
                    FROM inventory_qc 
                    LEFT JOIN products p ON TRIM(UPPER(p.product_name)) = TRIM(UPPER(inventory_qc.product_name))
                    WHERE inventory_qc.id = ${id}
                ` as unknown as any[];

                // If no result by ID, try matching the SKU column explicitly
                if (!items || items.length === 0) {
                    items = await sql`
                        SELECT inventory_qc.*, p.ram as product_ram, p.storage as product_storage 
                        FROM inventory_qc 
                        LEFT JOIN products p ON TRIM(UPPER(p.product_name)) = TRIM(UPPER(inventory_qc.product_name))
                        WHERE TRIM(inventory_qc.sku) ILIKE ${sku || search} 
                        ORDER BY inventory_qc.created_at DESC
                    ` as unknown as any[];
                }
            } else {
                // ID calculation invalid, try SKU
                items = await sql`
                    SELECT inventory_qc.*, p.ram as product_ram, p.storage as product_storage 
                    FROM inventory_qc 
                    LEFT JOIN products p ON TRIM(UPPER(p.product_name)) = TRIM(UPPER(inventory_qc.product_name))
                    WHERE TRIM(inventory_qc.sku) ILIKE ${sku || search} 
                    ORDER BY inventory_qc.created_at DESC
                ` as unknown as any[];
            }
        } else if (sku) {
            items = await sql`
                SELECT inventory_qc.*, p.ram as product_ram, p.storage as product_storage 
                FROM inventory_qc 
                LEFT JOIN products p ON TRIM(UPPER(p.product_name)) = TRIM(UPPER(inventory_qc.product_name))
                WHERE TRIM(inventory_qc.sku) ILIKE ${sku} 
                ORDER BY inventory_qc.created_at DESC
            ` as unknown as any[];
        } else if (search) {
            items = await sql`
                SELECT inventory_qc.*, p.ram as product_ram, p.storage as product_storage 
                FROM inventory_qc 
                LEFT JOIN products p ON TRIM(UPPER(p.product_name)) = TRIM(UPPER(inventory_qc.product_name))
                WHERE TRIM(inventory_qc.sku) ILIKE ${search} OR inventory_qc.product_name ILIKE ${'%' + search + '%'}
                ORDER BY inventory_qc.created_at DESC
            ` as unknown as any[];
        } else {
            items = await sql`
                SELECT inventory_qc.*, p.ram as product_ram, p.storage as product_storage 
                FROM inventory_qc 
                LEFT JOIN products p ON TRIM(UPPER(p.product_name)) = TRIM(UPPER(inventory_qc.product_name))
                ORDER BY inventory_qc.created_at DESC
            ` as unknown as any[];
        }

        return NextResponse.json({ success: true, data: items });
    } catch (error: unknown) {
        console.error('Error fetching QC inventory:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const {
            lotId,
            productId,
            purchaseLotItemId,
            sku,
            productName,
            brand,
            model,
            series,
            processor,
            processor_gen,
            ram,
            storage,
            graphics_card,
            screen_size,
            screen_resolution,
            keyboard_type,
            keyboard_backlit,
            condition_status
        } = body as {
            lotId?: number;
            productId?: number;
            purchaseLotItemId?: number;
            sku?: string;
            productName: string;
            brand?: string;
            model?: string;
            series?: string;
            processor?: string;
            processor_gen?: string;
            ram?: string;
            storage?: string;
            graphics_card?: string;
            screen_size?: string;
            screen_resolution?: string;
            keyboard_type?: string;
            keyboard_backlit?: string;
            condition_status?: string;
        };

        // Ensure table exists and columns are up to date
        await sql`
            CREATE TABLE IF NOT EXISTS inventory_qc (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER,
                barcode TEXT,
                purchase_lot_item_id INTEGER,
                sku TEXT,
                product_name TEXT NOT NULL,
                brand TEXT,
                model TEXT,
                series TEXT,
                processor TEXT,
                processor_gen TEXT,
                ram TEXT,
                storage TEXT,
                graphics TEXT,
                screen_size TEXT,
                screen_resolution TEXT,
                keyboard_type TEXT,
                keyboard_backlit TEXT,
                condition_status TEXT,
                status TEXT DEFAULT 'Passed',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        try {
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS barcode TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS graphics TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS processor_gen TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS screen_size TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS screen_resolution TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS keyboard_type TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS keyboard_backlit TEXT`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS purchase_lot_item_id INTEGER`;
        } catch (e: unknown) {
            console.warn('Could not update inventory_qc schema in POST:', e);
        }

        const result = await sql`
            INSERT INTO inventory_qc (
                lot_id, purchase_lot_item_id, sku, product_name, brand, model, series,
                processor, processor_gen, ram, storage, graphics, screen_size, screen_resolution,
                keyboard_type, keyboard_backlit, condition_status
            )
            VALUES (
                ${lotId || null}, ${purchaseLotItemId || null}, ${sku || null}, 
                ${productName}, ${brand || null}, ${model || null}, ${series || null},
                ${processor || null}, ${processor_gen || null}, ${ram || null}, ${storage || null}, 
                ${graphics_card || null}, ${screen_size || null}, ${screen_resolution || null},
                ${keyboard_type || null}, ${keyboard_backlit || null}, ${condition_status || null}
            )
            RETURNING id
        ` as unknown as { id: number }[];

        if (result && result.length > 0) {
            const insertedId = result[0].id;
            const barcodeVal = `BCH-${999 + insertedId}`;
            await sql`UPDATE inventory_qc SET barcode = ${barcodeVal} WHERE id = ${insertedId}`;
        }

        // Update purchase lot item QC count if applicable
        if (purchaseLotItemId) {
            try {
                await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS qc_count INTEGER DEFAULT 0`;
                await sql`
                    UPDATE purchase_lot_items 
                    SET qc_count = COALESCE(qc_count, 0) + 1 
                    WHERE id = ${purchaseLotItemId}
                `;
            } catch (e: unknown) {
                console.warn('Could not update purchase_lot_items qc_count:', e);
            }
        }

        await logActivity(
            'Admin',
            'QC Check',
            `QC passed for ${productName} (SKU: ${sku || 'N/A'})`,
            'success',
            'Admin'
        );

        return NextResponse.json({ success: true, insertedId: result[0].id });
    } catch (error: unknown) {
        console.error('Error saving QC check:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function PUT(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const {
            id,
            sku,
            productName,
            brand,
            model,
            series,
            processor,
            processor_gen,
            ram,
            storage,
            graphics_card,
            screen_size,
            screen_resolution,
            keyboard_type,
            keyboard_backlit,
            condition_status,
            updatedBy
        } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required for update' }, { status: 400 });
        }

        // Ensure columns exist
        try {
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE`;
            await sql`ALTER TABLE inventory_qc ADD COLUMN IF NOT EXISTS updated_by TEXT`;
        } catch (e) {
            console.warn('Could not update schema for updated_at:', e);
        }

        const result = await sql`
            UPDATE inventory_qc
            SET 
                sku = ${sku || null},
                product_name = ${productName},
                brand = ${brand || null},
                model = ${model || null},
                series = ${series || null},
                processor = ${processor || null},
                processor_gen = ${processor_gen || null},
                ram = ${ram || null},
                storage = ${storage || null},
                graphics = ${graphics_card || null},
                screen_size = ${screen_size || null},
                screen_resolution = ${screen_resolution || null},
                keyboard_type = ${keyboard_type || null},
                keyboard_backlit = ${keyboard_backlit || null},
                condition_status = ${condition_status || null},
                updated_at = CURRENT_TIMESTAMP,
                updated_by = ${updatedBy || 'Admin'}
            WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }

        await logActivity(
            'Admin',
            'QC Update',
            `QC updated for ${productName} (ID: ${id})`,
            'success',
            updatedBy || 'Admin'
        );

        return NextResponse.json({ success: true, message: 'Updated successfully' });
    } catch (error: unknown) {
        console.error('Error updating QC:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
