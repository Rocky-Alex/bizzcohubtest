import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { logActivity } from '@/lib/activity-logger';
import { revalidatePath } from 'next/cache';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const sku = searchParams.get('sku');

        let items;
        // Check for BCH-XXXX format
        const bchMatch = (sku || search || '').toString().toUpperCase().match(/^BCH-(\d+)$/);

        if (bchMatch) {
            const seqNum = parseInt(bchMatch[1]);
            const id = seqNum - 999; // Derived ID from barcode

            if (id > 0) {
                items = await sql`
                    SELECT * FROM master_inventory 
                    WHERE id = ${id}
                    AND NOT EXISTS (SELECT 1 FROM sale_out WHERE master_inventory_id = master_inventory.id AND returned_at IS NULL)
                ` as unknown as any[];

                if (!items || items.length === 0) {
                    // Fallback to searching barcode string
                    items = await sql`
                        SELECT * FROM master_inventory 
                        WHERE barcode ILIKE ${sku || search}
                        AND NOT EXISTS (SELECT 1 FROM sale_out WHERE master_inventory_id = master_inventory.id AND returned_at IS NULL)
                        ORDER BY created_at DESC
                    ` as unknown as any[];
                }
            } else {
                items = await sql`
                    SELECT * FROM master_inventory 
                    WHERE barcode ILIKE ${sku || search}
                    AND NOT EXISTS (SELECT 1 FROM sale_out WHERE master_inventory_id = master_inventory.id AND returned_at IS NULL)
                    ORDER BY created_at DESC
                ` as unknown as any[];
            }
        } else if (sku) {
            items = await sql`
                SELECT * FROM master_inventory 
                WHERE sku ILIKE ${sku}
                AND NOT EXISTS (SELECT 1 FROM sale_out WHERE master_inventory_id = master_inventory.id)
                ORDER BY created_at DESC
            ` as unknown as any[];
        } else if (search) {
            items = await sql`
                SELECT * FROM master_inventory 
                WHERE 
                    (product_name ILIKE ${'%' + search + '%'} OR
                    barcode ILIKE ${'%' + search + '%'} OR
                    lot_number ILIKE ${'%' + search + '%'} OR
                    sku ILIKE ${'%' + search + '%'})
                    AND NOT EXISTS (SELECT 1 FROM sale_out WHERE master_inventory_id = master_inventory.id AND returned_at IS NULL)
                ORDER BY created_at DESC
            ` as unknown as any[];
        } else {
            // Default list - Optimized for Master Inventory (QC Passed) items only
            items = await sql`
                SELECT 
                    id, 
                    lot_number, 
                    product_name, 
                    brand, 
                    model, 
                    series, 
                    processor, 
                    processor_gen, 
                    ram, 
                    storage, 
                    graphics_card, 
                    condition_status, 
                    qc_status, 
                    quantity, 
                    sku, 
                    barcode,
                    'QC Passed' as "source",
                    created_at,
                    updated_at
                FROM master_inventory 
                WHERE NOT EXISTS (SELECT 1 FROM sale_out WHERE master_inventory_id = master_inventory.id AND returned_at IS NULL)
                ORDER BY id DESC
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
            productName,
            brand,
            model,
            series,
            sku, // Added to resolve 'sku is not defined' error
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
            lotId,
            purchaseLotItemId // ID from purchase_lot_items (Staging)
        } = body;

        // 1. Insert into master_inventory (The "Real" Inventory)
        const insertResult = await sql`
            INSERT INTO master_inventory (
                lot_number, 
                sku,
                product_name, brand, model, series,
                processor, processor_gen, ram, storage, graphics_card, 
                screen_size, screen_resolution,
                condition_status, qc_status,
                quantity,
                created_at, updated_at
            )
            VALUES (
                (SELECT lot_number FROM purchase_lots WHERE id = ${lotId}), 
                ${sku || null},
                ${productName}, ${brand || null}, ${model || null}, ${series || null},
                ${processor || null}, ${processor_gen || null}, ${ram || null}, ${storage || null}, ${graphics_card || null},
                ${screen_size || null}, ${screen_resolution || null},
                ${condition_status || 'Unknown'}, 'Passed',
                1,
                NOW(), NOW()
            )
            RETURNING id
        ` as unknown as { id: number }[];

        if (insertResult && insertResult.length > 0) {
            const newMasterId = insertResult[0].id;
            const barcode = `BCH-${999 + newMasterId}`;

            // 2. Generate Barcode for the new Master Item (Preserve SKU)
            await sql`UPDATE master_inventory SET barcode = ${barcode} WHERE id = ${newMasterId}`;

            // 3. Update Staging Count (Recalculate from Master Inventory for accuracy)
            if (purchaseLotItemId) {
                await sql`
                    UPDATE purchase_lot_items 
                    SET qc_count = (
                        SELECT COUNT(*) 
                        FROM master_inventory 
                        WHERE lot_number = (SELECT lot_number FROM purchase_lots WHERE id = ${lotId})
                        AND product_name = ${productName}
                    )
                    WHERE id = ${purchaseLotItemId}
                `;
            }

            // 4. Automatic Lot Status Transition (If all items in lot are now Checked)
            await sql`
                UPDATE purchase_lots 
                SET status = 'COMPLETED'
                WHERE id = ${lotId} 
                AND (
                    SELECT SUM(qc_count) FROM purchase_lot_items WHERE lot_id = ${lotId}
                ) = (
                    SELECT SUM(quantity) FROM purchase_lot_items WHERE lot_id = ${lotId}
                )
                AND (SELECT SUM(quantity) FROM purchase_lot_items WHERE lot_id = ${lotId}) > 0
            `;

            await logActivity(
                'Admin',
                'QC Check',
                `Moved item ${productName} from Staging to Inventory (BCH-${999 + newMasterId})`,
                'success',
                'Admin'
            );

            // Force clear caches for stats and IDs
            revalidatePath('/api/bch/dashboard/stats');
            revalidatePath('/api/bch/purchase/lots/details');

            return NextResponse.json({ success: true, newMasterItemId: newMasterId });
        }

        return NextResponse.json({ success: false, error: 'Failed to insert item into Master Inventory' }, { status: 500 });

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
            product_name, // Support both
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
            condition_status,
            qc_status, // Allow updating status
            updatedBy
        } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        const finalProductName = productName || product_name;

        const result = await sql`
            UPDATE master_inventory
            SET 
                sku = ${sku || null},
                product_name = ${finalProductName},
                brand = ${brand || null},
                model = ${model || null},
                series = ${series || null},
                processor = ${processor || null},
                processor_gen = ${processor_gen || null},
                ram = ${ram || null},
                storage = ${storage || null},
                graphics_card = ${graphics_card || null},
                screen_size = ${screen_size || null},
                screen_resolution = ${screen_resolution || null},
                condition_status = ${condition_status || null},
                qc_status = ${qc_status || 'Passed'},
                updated_at = NOW()
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
