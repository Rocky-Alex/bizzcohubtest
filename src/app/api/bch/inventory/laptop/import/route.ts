import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { products, importedBy } = body;

        if (!products || !Array.isArray(products)) {
            return NextResponse.json({ success: false, error: 'Products array is required' }, { status: 400 });
        }

        const imported = [];
        const errors = [];

        for (const item of products) {
            try {
                const productName = item.productName || item.product_name || item.name;
                if (!productName) {
                    errors.push({ item, error: 'Product name is required' });
                    continue;
                }

                // Insert laptop row
                const insertResult = await sql`
                    INSERT INTO master_inventory (
                        lot_number,
                        sku,
                        product_name,
                        brand,
                        series,
                        model,
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
                        qc_status,
                        quantity,
                        stock_balance,
                        base_price,
                        offer_price,
                        created_at,
                        updated_at
                    ) VALUES (
                        ${item.lotNumber || item.lot_number || 'IMPORT'},
                        ${item.sku || null},
                        ${productName},
                        ${item.brand || null},
                        ${item.series || null},
                        ${item.model || null},
                        ${item.processor || null},
                        ${item.processorGen || item.processor_gen || null},
                        ${item.ram || null},
                        ${item.storage || null},
                        ${item.graphicsCard || item.graphics_card || null},
                        ${item.screenSize || item.screen_size || null},
                        ${item.screenResolution || item.screen_resolution || null},
                        ${item.keyboardType || item.keyboard_type || null},
                        ${item.keyboardBacklit || item.keyboard_backlit || null},
                        ${item.conditionStatus || item.condition_status || item.condition || 'Unknown'},
                        ${item.qcStatus || item.qc_status || 'Passed'},
                        ${parseInt(item.quantity || 1, 10)},
                        ${parseInt(item.stockBalance || item.stock_balance || item.quantity || 1, 10)},
                        ${item.basePrice || item.base_price ? parseFloat(item.basePrice || item.base_price) : null},
                        ${item.offerPrice || item.offer_price ? parseFloat(item.offerPrice || item.offer_price) : null},
                        NOW(),
                        NOW()
                    )
                    RETURNING id
                ` as unknown as { id: number }[];

                const newId = insertResult[0].id;
                const barcode = item.barcode || `BCH-LP-${1000 + newId}`;

                // Set Barcode
                await sql`
                    UPDATE master_inventory
                    SET barcode = ${barcode}
                    WHERE id = ${newId}
                `;

                imported.push({
                    id: newId,
                    productName,
                    barcode
                });
            } catch (err: any) {
                console.error('Error importing single item:', err);
                errors.push({
                    item: item.productName || item.product_name || 'Unknown',
                    error: err.message || 'Database error'
                });
            }
        }

        if (imported.length > 0) {
            await logActivity(
                importedBy || 'Admin',
                'Import Laptop Inventory',
                `Bulk imported ${imported.length} laptops into inventory`,
                'success',
                'Admin'
            );
        }

        return NextResponse.json({
            success: true,
            importedCount: imported.length,
            imported,
            errors
        });

    } catch (error: unknown) {
        console.error('Error during bulk import:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}
