import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
    try {
        const query = await sql`
            SELECT iqc.*, 
                   pl.lot_number,
                   pli.unit_cost
            FROM inventory_qc iqc
            LEFT JOIN purchase_lots pl ON iqc.lot_id = pl.id
            LEFT JOIN purchase_lot_items pli ON iqc.purchase_lot_item_id = pli.id
            ORDER BY iqc.created_at DESC
            LIMIT 100
        `;

        return NextResponse.json({ success: true, data: query });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        console.log('QC POST: Received request');
        const body = await req.json();

        // Sanitize helper: Convert undefined to null for SQL
        const s = (val: any) => val === undefined ? null : val;

        const {
            lotId,
            purchaseLotItemId,
            productId,
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
            notes
        } = body;



        // 1. Insert into Inventory QC
        console.log('QC POST: Inserting into inventory_qc...');

        // Ensure numbers
        const pLotId = parseInt(String(lotId));
        const pItemId = parseInt(String(purchaseLotItemId));
        const pProdId = productId ? parseInt(String(productId)) : null;

        const qcResult = await sql`
            INSERT INTO inventory_qc (
                lot_id, purchase_lot_item_id, product_id, sku, product_name,
                brand, model, series, processor, processor_gen,
                ram, storage, graphics_card, screen_size, screen_resolution,
                keyboard_type, keyboard_backlit, condition_status,
                status, created_by
            ) VALUES (
                ${pLotId}, ${pItemId}, ${pProdId}, ${s(sku)}, ${s(productName)},
                ${s(brand)}, ${s(model)}, ${s(series)}, ${s(processor)}, ${s(processor_gen)},
                ${s(ram)}, ${s(storage)}, ${s(graphics_card)}, ${s(screen_size)}, ${s(screen_resolution)},
                ${s(keyboard_type)}, ${s(keyboard_backlit)}, ${s(condition_status)},
                'Passed', 'Admin'
            )
            RETURNING id
        `;

        if (!qcResult || qcResult.length === 0) {
            throw new Error('Failed to insert QC record');
        }

        const qcId = qcResult[0].id;
        console.log('QC POST: Inserted QC ID:', qcId);

        // 2. Handle Master Product (Sync)
        let finalProductId = pProdId;

        if (finalProductId) {
            // Update User provided product ID (stock increment)
            console.log('QC POST: Updating existing product stock:', finalProductId);
            await sql`UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + 1 WHERE id = ${finalProductId}`;
        } else {
            // Check if SKU exists to avoid duplicate
            console.log('QC POST: Checking for existing product by SKU/Name...');
            const existing = await sql`
                SELECT id FROM products 
                WHERE product_code = ${s(sku)} 
                OR (
                    product_name = ${s(productName)} 
                    AND model = ${s(model)} 
                    AND processor = ${s(processor)}
                    AND brand = ${s(brand)}
                )
            `;

            if (existing.length > 0) {
                finalProductId = existing[0].id;
                console.log('QC POST: Found existing product:', finalProductId);
                await sql`UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + 1 WHERE id = ${finalProductId}`;
            } else {
                console.log('QC POST: Creating new product...');
                const newProduct = await sql`
                    INSERT INTO products (
                        product_code, product_name, type, brand, model, series, 
                        processor, processor_gen, ram, storage, graphics_card,
                        screen_size, screen_resolution, condition_status,
                        stock_quantity, base_price, category, date_added
                    ) VALUES (
                        ${s(sku)}, ${s(productName)}, 'laptop', ${s(brand)}, ${s(model)}, ${s(series)},
                        ${s(processor)}, ${s(processor_gen)}, ${s(ram)}, ${s(storage)}, ${s(graphics_card)},
                        ${s(screen_size)}, ${s(screen_resolution)}, ${s(condition_status)},
                        1, 0, 'Laptops', NOW()
                    )
                    RETURNING id
                `;
                finalProductId = newProduct[0].id;
                console.log('QC POST: New product created:', finalProductId);
            }

            // Link QC to the new/found product
            if (finalProductId) {
                console.log('QC POST: Linking QC to Product ID...');
                await sql`UPDATE inventory_qc SET product_id = ${finalProductId} WHERE id = ${qcId}`;
            }
        }

        console.log('QC POST: Logging activity...');
        await logActivity(
            'Admin',
            'QC Check',
            `QC Passed: ${productName} (${sku})`,
            'success'
        );

        console.log('QC POST: Success');
        return NextResponse.json({ success: true, insertedId: qcId, productId: finalProductId });

    } catch (error: any) {
        console.error('QC Post Error Detailed:', error);
        // Return only the error message to avoid circular structure issues in logging
        return NextResponse.json({ success: false, error: `${error.name}: ${error.message}` }, { status: 500 });
    }
}
