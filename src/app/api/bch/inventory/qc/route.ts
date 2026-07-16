import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { logActivity } from '@/lib/activity-logger';
import { revalidatePath } from 'next/cache';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        // Auto-Migration: Ensure stock_balance exists
        try {
            await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS stock_balance INTEGER`;
            await sql`UPDATE master_inventory SET stock_balance = quantity WHERE stock_balance IS NULL`;
        } catch (e) {}

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const sku = searchParams.get('sku') || '';

        let items;
        
        if (sku) {
            items = await sql`
                -- 1. Master Inventory
                SELECT 
                    mi.id, mi.lot_number, mi.product_name, mi.brand, mi.model, mi.series,
                    mi.processor, mi.processor_gen, mi.ram, mi.storage, mi.graphics_card,
                    mi.condition_status, mi.qc_status, 
                    (mi.quantity - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL), 0)) as quantity,
                    mi.barcode as sku, mi.barcode,
                    mi.base_price, mi.offer_price, 'QC Passed' as "source",
                    mi.created_at, mi.updated_at
                FROM master_inventory mi
                WHERE (mi.barcode ILIKE ${sku} OR mi.sku ILIKE ${sku})
                AND (mi.quantity - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL), 0)) > 0
                
                UNION ALL

                -- 2. Purchase Inventory
                SELECT 
                    pli.id, pl.lot_number, pli.product_name, pli.brand, pli.model, pli.series,
                    pli.processor, pli.processor_gen, pli.ram, pli.storage, pli.graphics as graphics_card,
                    pli.condition_status, 'Pending' as qc_status, 
                    (pli.quantity - COALESCE(pli.qc_count, 0) - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL), 0)) as quantity, 
                    pli.sku, NULL as barcode,
                    NULL as base_price, NULL as offer_price, 'Purchase' as "source",
                    pli.created_at, pli.created_at as updated_at
                FROM purchase_lot_items pli
                JOIN purchase_lots pl ON pl.id = pli.lot_id
                WHERE pli.sku ILIKE ${sku}
                AND (pli.quantity - COALESCE(pli.qc_count, 0) - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL), 0)) > 0

                UNION ALL

                -- 3. Returned Items
                SELECT 
                    so.inventory_id as id, 
                    (SELECT lot_number FROM master_inventory WHERE id = so.inventory_id LIMIT 1) as lot_number,
                    so.product_name, so.brand, so.model, so.series,
                    so.processor, so.processor_gen, so.ram, so.storage, so.graphics as graphics_card,
                    'Restocked' as condition_status, 'QC Passed' as qc_status, 
                    1 as quantity, 
                    so.barcode as sku, so.barcode,
                    NULL as base_price, NULL as offer_price, 'Returned Stock' as "source",
                    so.sold_at as created_at, so.sold_at as updated_at
                FROM sale_out so
                WHERE (so.barcode ILIKE ${sku}) AND (so.status = 'Restocked' OR so.returned_at IS NOT NULL)

                ORDER BY created_at DESC
            ` as unknown as any[];
        } else if (search) {
            items = await sql`
                -- 1. Master Inventory
                SELECT 
                    mi.id, mi.lot_number, mi.product_name, mi.brand, mi.model, mi.series,
                    mi.processor, mi.processor_gen, mi.ram, mi.storage, mi.graphics_card,
                    mi.condition_status, mi.qc_status, 
                    (mi.quantity - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL), 0)) as quantity,
                    mi.barcode as sku, mi.barcode,
                    mi.base_price, mi.offer_price, 'QC Passed' as "source",
                    mi.created_at, mi.updated_at
                FROM master_inventory mi
                WHERE 
                    (mi.product_name ILIKE ${'%' + search + '%'} OR
                    mi.barcode ILIKE ${'%' + search + '%'} OR
                    mi.lot_number ILIKE ${'%' + search + '%'})
                    AND (mi.quantity - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL), 0)) > 0
                
                UNION ALL

                -- 2. Purchase Inventory
                SELECT 
                    pli.id, pl.lot_number, pli.product_name, pli.brand, pli.model, pli.series,
                    pli.processor, pli.processor_gen, pli.ram, pli.storage, pli.graphics as graphics_card,
                    pli.condition_status, 'Pending' as qc_status, 
                    (pli.quantity - COALESCE(pli.qc_count, 0) - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL), 0)) as quantity, 
                    pli.sku, NULL as barcode,
                    NULL as base_price, NULL as offer_price, 'Purchase' as "source",
                    pli.created_at, pli.created_at as updated_at
                FROM purchase_lot_items pli
                JOIN purchase_lots pl ON pl.id = pli.lot_id
                WHERE 
                    (pli.product_name ILIKE ${'%' + search + '%'} OR
                    pl.lot_number ILIKE ${'%' + search + '%'} OR
                    pli.sku ILIKE ${'%' + search + '%'})
                    AND (pli.quantity - COALESCE(pli.qc_count, 0) - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL), 0)) > 0

                UNION ALL

                -- 3. Returned Items
                SELECT 
                    so.inventory_id as id, 
                    (SELECT lot_number FROM master_inventory WHERE id = so.inventory_id LIMIT 1) as lot_number,
                    so.product_name, so.brand, so.model, so.series,
                    so.processor, so.processor_gen, so.ram, so.storage, so.graphics as graphics_card,
                    'Restocked' as condition_status, 'QC Passed' as qc_status, 
                    1 as quantity, 
                    so.barcode as sku, so.barcode,
                    NULL as base_price, NULL as offer_price, 'Returned Stock' as "source",
                    so.sold_at as created_at, so.sold_at as updated_at
                FROM sale_out so
                WHERE 
                    (so.product_name ILIKE ${'%' + search + '%'} OR
                    so.barcode ILIKE ${'%' + search + '%'} OR
                    so.brand ILIKE ${'%' + search + '%'})
                    AND (so.status = 'Restocked' OR so.returned_at IS NOT NULL)
                
                ORDER BY created_at DESC
            ` as unknown as any[];
        } else {
            items = await sql`
                -- 1. Master Inventory
                SELECT 
                    mi.id, mi.lot_number, mi.product_name, mi.brand, mi.model, mi.series,
                    mi.processor, mi.processor_gen, mi.ram, mi.storage, mi.graphics_card,
                    mi.condition_status, mi.qc_status, 
                    (mi.quantity - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL), 0)) as quantity,
                    mi.barcode as sku, mi.barcode,
                    mi.base_price, mi.offer_price, 'QC Passed' as "source",
                    mi.created_at, mi.updated_at
                FROM master_inventory mi
                WHERE (mi.quantity - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = mi.id AND so.source = 'master' AND so.returned_at IS NULL), 0)) > 0
                
                UNION ALL

                -- 2. Purchase Inventory
                SELECT 
                    pli.id, pl.lot_number, pli.product_name, pli.brand, pli.model, pli.series,
                    pli.processor, pli.processor_gen, pli.ram, pli.storage, pli.graphics as graphics_card,
                    pli.condition_status, 'Pending' as qc_status, 
                    (pli.quantity - COALESCE(pli.qc_count, 0) - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL), 0)) as quantity, 
                    pli.sku, NULL as barcode,
                    NULL as base_price, NULL as offer_price, 'Purchase' as "source",
                    pli.created_at, pli.created_at as updated_at
                FROM purchase_lot_items pli
                JOIN purchase_lots pl ON pl.id = pli.lot_id
                WHERE (pli.quantity - COALESCE(pli.qc_count, 0) - COALESCE((SELECT SUM(so.quantity) FROM sale_out so WHERE so.inventory_id = pli.id AND so.source = 'purchase' AND so.returned_at IS NULL), 0)) > 0

                UNION ALL

                -- 3. Returned Items
                SELECT 
                    so.inventory_id as id, 
                    (SELECT lot_number FROM master_inventory WHERE id = so.inventory_id LIMIT 1) as lot_number,
                    so.product_name, so.brand, so.model, so.series,
                    so.processor, so.processor_gen, so.ram, so.storage, so.graphics as graphics_card,
                    'Restocked' as condition_status, 'QC Passed' as qc_status, 
                    1 as quantity, 
                    so.barcode as sku, so.barcode,
                    NULL as base_price, NULL as offer_price, 'Returned Stock' as "source",
                    so.sold_at as created_at, so.sold_at as updated_at
                FROM sale_out so
                WHERE so.status = 'Restocked' OR so.returned_at IS NOT NULL

                ORDER BY created_at DESC
            ` as unknown as any[];
        }

        return NextResponse.json({ success: true, data: items });
    } catch (error: unknown) {
        console.error('Error fetching QC inventory:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Database connection error' 
        }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        // Auto-Migration: Ensure stock_balance exists
        try {
            await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS stock_balance INTEGER`;
            await sql`UPDATE master_inventory SET stock_balance = quantity WHERE stock_balance IS NULL`;
        } catch (e) {}

        const body = await req.json();
        const {
            productName,
            brand,
            model,
            series,
            sku,
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
            purchaseLotItemId,
            isReturn // The new flag from the frontend
        } = body;

        // --- HANDLE RETURNS WORKFLOW ---
        if (isReturn) {
            const returnId = purchaseLotItemId;
            
            // 1. Get return details
            const returnResult = await sql`SELECT * FROM sales_returns WHERE id = ${returnId}` as any[];
            if (returnResult.length === 0) {
                return NextResponse.json({ success: false, error: 'Return record not found' }, { status: 404 });
            }
            const returnRecord = returnResult[0];

            // 2. Update Master Inventory (Restock)
            // Use the original inventory_id linked to the return
            if (returnRecord.inventory_id) {
                await sql`
                    UPDATE master_inventory 
                    SET 
                        stock_balance = COALESCE(stock_balance, 0) + (SELECT quantity FROM sale_out WHERE id = ${returnRecord.sales_out_id}),
                        product_name = ${productName},
                        brand = ${brand || null},
                        model = ${model || null},
                        processor = ${processor || null},
                        processor_gen = ${processor_gen || null},
                        ram = ${ram || null},
                        storage = ${storage || null},
                        graphics_card = ${graphics_card || null},
                        condition_status = ${condition_status || 'Passed'},
                        updated_at = NOW()
                    WHERE id = ${returnRecord.inventory_id}
                `;
            }

            // 3. Update Sales Return Status
            await sql`
                UPDATE sales_returns 
                SET qc_status = 'QC Passed', 
                    updated_at = NOW()
                WHERE id = ${returnId}
            `;

            // 4. Update Sale Out Status
            await sql`
                UPDATE sale_out 
                SET status = 'Restocked', 
                    updated_at = NOW()
                WHERE id = ${returnRecord.sales_out_id}
            `;

            await logActivity(
                'Admin',
                'Return QC Passed',
                `Return ID ${returnId} for ${productName} passed Production QC and was restocked.`,
                'success',
                'Admin'
            );

            return NextResponse.json({ success: true, message: 'Return restocked successfully', newMasterItemId: returnRecord.inventory_id });
        }

        // --- NORMAL PURCHASE LOT WORKFLOW ---
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
                stock_balance,
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
