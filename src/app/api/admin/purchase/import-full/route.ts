import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        const createdBy = session?.user?.name || 'Admin';

        const body = await req.json();
        const { lots } = body; // Expecting array of { metadata, items }

        // 1. Schema Migration: Add missing columns
        try {
            await sql`ALTER TABLE purchase_lots ADD COLUMN IF NOT EXISTS notes TEXT`;
            await sql`ALTER TABLE purchase_lots ADD COLUMN IF NOT EXISTS supplier_id INTEGER`;

            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS ram TEXT`;
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS storage TEXT`;
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS graphics TEXT`;
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS screen_size TEXT`;
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS screen_resolution TEXT`;
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS keyboard_type TEXT`;
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS keyboard_backlit TEXT`;
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS condition_status TEXT`;
        } catch (e) {
            console.warn('Schema migration failed (columns may exist):', e);
        }

        const results = [];

        for (const lotData of lots) {
            const { metadata, items } = lotData;

            // 2. Generate/Get Lot ID logic (simplified for bulk: just verify uniqueness or auto-gen)
            // We'll use the lot number from metadata if provided, else generate one.
            // But we need strict ordering if generating multiple.

            // Auto-inc logic for Lot ID
            const lastLotResult = await sql`SELECT lot_id FROM purchase_lots ORDER BY id DESC LIMIT 1` as unknown as { lot_id: string }[];
            let nextLotId = 'LOT-01';
            if (lastLotResult.length > 0 && lastLotResult[0].lot_id) {
                const lastIdStr = lastLotResult[0].lot_id;
                const parts = lastIdStr.split('-');
                if (parts.length === 2) {
                    const num = parseInt(parts[1], 10);
                    if (!isNaN(num)) nextLotId = `LOT-${String(num + 1).padStart(2, '0')}`;
                }
            }
            // Note: In high concurrency this auto-inc might clash, but for single user bulk import it's fine. 
            // Ideally we'd lock or use sequence.

            // 3. Create Lot
            const lotResult = await sql`
                INSERT INTO purchase_lots (
                    lot_id, lot_number, supplier_name, supplier_id, invoice_date, invoice_number, total_cost, notes, created_by, status
                )
                VALUES (
                    ${nextLotId},
                    ${metadata.lotNumber || nextLotId},
                    ${metadata.supplierName},
                    ${metadata.supplierId || null},
                    ${metadata.invoiceDate},
                    ${metadata.invoiceNumber},
                    ${metadata.totalCost || 0},
                    ${metadata.notes || null},
                    ${createdBy},
                    'active'
                )
                RETURNING id, lot_id
            ` as unknown as { id: number, lot_id: string }[];

            const lotId = lotResult[0].id;
            const lotIdStr = lotResult[0].lot_id;

            // 4. Insert Items
            for (const item of items) {
                await sql`
                    INSERT INTO purchase_lot_items (
                        lot_id, product_type, product_name, brand, series, model, 
                        processor, processor_gen, sku, quantity, unit_cost, 
                        ram, storage, graphics, screen_size, screen_resolution, 
                        keyboard_type, keyboard_backlit, condition_status,
                        created_by
                    )
                    VALUES (
                        ${lotId}, ${item.productType}, ${item.productName}, ${item.brand || null}, 
                        ${item.series || null}, ${item.model || null}, ${item.processor || null}, 
                        ${item.processorGen || null}, ${item.sku || null}, ${item.quantity || 1}, 
                        ${item.unitCost || 0}, 
                        ${item.ram || null}, ${item.storage || null}, ${item.graphics || null},
                        ${item.screenSize || null}, ${item.screenResolution || null},
                        ${item.keyboardType || null}, ${item.keyboardBacklit || null},
                        ${item.conditionStatus || null},
                        ${createdBy}
                    )
                `;
            }
            results.push(lotIdStr);

            await logActivity(createdBy, 'Full Import', `Imported Lot ${lotIdStr} (${metadata.invoiceNumber})`, 'success', createdBy);
        }

        return NextResponse.json({ success: true, importedLots: results });

    } catch (error: unknown) {
        console.error('Error in full import:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
