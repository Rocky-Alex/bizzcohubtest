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
        const { lotMetadata, items } = body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
        }

        // 1. Generate Lot Number if missing
        let lotNumber = lotMetadata.lotNumber;
        if (!lotNumber) {
            try {
                const lastLotResult = await sql`
                    SELECT lot_number FROM master_inventory 
                    WHERE lot_number LIKE 'LOT-%'
                    ORDER BY created_at DESC 
                    LIMIT 1
                ` as unknown as { lot_number: string }[];

                let nextId = 1;
                if (lastLotResult.length > 0 && lastLotResult[0].lot_number) {
                    const parts = lastLotResult[0].lot_number.split('-');
                    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
                        nextId = parseInt(parts[1]) + 1;
                    }
                }
                lotNumber = `LOT-${String(nextId).padStart(3, '0')}`;
            } catch (e) {
                lotNumber = `LOT-${Date.now()}`;
            }
        }

        // 2. Process and Insert Items
        // Use transaction-like approach (sequential inserts)
        let purchaseLotId: number | null = null;
        let insertedCount = 0;

        // A. Insert into purchase_lots
        const lotInsertResult = await sql`
        INSERT INTO purchase_lots (
            lot_number, 
            supplier_name, 
            invoice_number, 
            invoice_date, 
            total_cost, 
            notes, 
            status, 
            created_by
        )
        VALUES (
            ${lotNumber}, 
            ${lotMetadata.supplierName}, 
            ${lotMetadata.invoiceNumber}, 
            ${lotMetadata.invoiceDate || null}, 
            ${lotMetadata.totalCost || 0}, 
            ${lotMetadata.notes || ''}, 
            'Pending', 
            ${createdBy}
        )
        RETURNING id
    ` as unknown as { id: number }[];

        if (!lotInsertResult || lotInsertResult.length === 0) {
            throw new Error("Failed to create Purchase Lot record.");
        }
        purchaseLotId = lotInsertResult[0].id;

        // B. Insert Items into purchase_lot_items
        for (const item of items) {
            const qty = parseInt(item.quantity) || 1;

            // We insert ONE row per product type with quantity, NOT expanded rows.
            // The expansion happens during QC when moving to Master Inventory.
            // This keeps the "Purchase Order" clean.

            await sql`
            INSERT INTO purchase_lot_items (
                lot_id,
                product_name,
                product_type,
                brand,
                model,
                series,
                processor,
                processor_gen,
                ram,
                storage,
                graphics,
                screen_size,
                screen_resolution,
                condition_status,
                quantity,
                unit_cost,
                total_cost,
                sku,
                qc_count
            )
            VALUES (
                ${purchaseLotId},
                ${item.productName},
                ${item.productType || 'Laptop'},
                ${item.brand || ''},
                ${item.model || ''},
                ${item.series || ''},
                ${item.processor || ''},
                ${item.processorGen || ''},
                ${item.ram || ''},
                ${item.storage || ''},
                ${item.graphics || ''},
                ${item.screenSize || ''},
                ${item.screenResolution || ''},
                ${item.conditionStatus || 'Unknown'},
                ${qty},
                ${item.unitCost || 0},
                ${(item.unitCost || 0) * qty},
                ${item.sku || ''}, -- Supplier SKU if any
                0 -- Validated Count starts at 0
            )
        `;
            insertedCount += qty;
        }

        await logActivity(
            createdBy,
            'Import Purchase Lot',
            `Imported lot ${lotNumber} with ${insertedCount} items (Staging) from ${lotMetadata.supplierName}`,
            'success',
            createdBy
        );

        return NextResponse.json({ success: true, lotId: lotNumber, message: 'Import successful (Staged)' });
    } catch (error: unknown) {
        console.error('Error importing purchase lot bulk:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
