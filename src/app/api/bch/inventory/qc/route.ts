import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

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
            const id = seqNum - 1000; // Derived ID from barcode

            if (id > 0) {
                items = await sql`
                    SELECT * FROM master_inventory 
                    WHERE id = ${id}
                ` as unknown as any[];

                if (!items || items.length === 0) {
                    // Fallback to searching barcode string
                    items = await sql`
                        SELECT * FROM master_inventory 
                        WHERE barcode ILIKE ${sku || search}
                        ORDER BY created_at DESC
                    ` as unknown as any[];
                }
            } else {
                items = await sql`
                    SELECT * FROM master_inventory 
                    WHERE barcode ILIKE ${sku || search}
                    ORDER BY created_at DESC
                ` as unknown as any[];
            }
        } else if (sku) {
            items = await sql`
                SELECT * FROM master_inventory 
                WHERE sku ILIKE ${sku}
                ORDER BY created_at DESC
            ` as unknown as any[];
        } else if (search) {
            items = await sql`
                SELECT * FROM master_inventory 
                WHERE 
                    product_name ILIKE ${'%' + search + '%'} OR
                    barcode ILIKE ${'%' + search + '%'} OR
                    lot_number ILIKE ${'%' + search + '%'} OR
                    sku ILIKE ${'%' + search + '%'}
                ORDER BY created_at DESC
            ` as unknown as any[];
        } else {
            // Default list - maybe limit to recent?
            items = await sql`
                SELECT * FROM master_inventory 
                ORDER BY created_at DESC
                LIMIT 100
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
                lot_number, -- We should fetch the actual lot number if possible, or link via lotId
                product_name, brand, model, series,
                processor, processor_gen, ram, storage, graphics_card, 
                screen_size, screen_resolution,
                condition_status, qc_status,
                quantity,
                created_at, updated_at
            )
            VALUES (
                (SELECT lot_number FROM purchase_lots WHERE id = ${lotId}), -- Fetch Lot Number dynamically
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
            const barcode = `BCH-${1000 + newMasterId}`;

            // 2. Generate Barcode/SKU for the new Master Item
            await sql`UPDATE master_inventory SET barcode = ${barcode}, sku = ${barcode} WHERE id = ${newMasterId}`;

            // 3. Update Staging Count (Increment qc_count)
            if (purchaseLotItemId) {
                await sql`
                    UPDATE purchase_lot_items 
                    SET qc_count = qc_count + 1 
                    WHERE id = ${purchaseLotItemId}
                `;
            }

            await logActivity(
                'Admin',
                'QC Check',
                `Moved item ${productName} from Staging to Inventory (BCH-${1000 + newMasterId})`,
                'success',
                'Admin'
            );

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
