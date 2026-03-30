import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

// Ensure the sale_out table exists
async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS sale_out (
            id SERIAL PRIMARY KEY,
            master_inventory_id INTEGER,
            purchase_lot_item_id INTEGER,
            source VARCHAR DEFAULT 'master',
            barcode VARCHAR,
            lot_number VARCHAR,
            brand VARCHAR,
            model VARCHAR,
            series VARCHAR,
            product_name VARCHAR,
            qty_sold INTEGER NOT NULL DEFAULT 1,
            sold_by VARCHAR DEFAULT 'Admin',
            invoice_no VARCHAR,
            customer_name VARCHAR,
            notes TEXT,
            sold_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `;
    // Add columns if they don't exist (for existing tables)
    try {
        await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS purchase_lot_item_id INTEGER`;
        await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'master'`;
        await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS invoice_no VARCHAR`;
        await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS customer_name VARCHAR`;
    } catch (e) {
        // ignore if already exists
    }
}

// GET — Fetch sale out history
export async function GET(request: NextRequest) {
    try {
        await ensureTable();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();
        const limit = parseInt(searchParams.get('limit') || '100');

        let results;
        if (search) {
            const searchTerm = `%${search}%`;
            results = await sql`
                SELECT * FROM sale_out
                WHERE brand ILIKE ${searchTerm}
                   OR model ILIKE ${searchTerm}
                   OR barcode ILIKE ${searchTerm}
                   OR lot_number ILIKE ${searchTerm}
                   OR product_name ILIKE ${searchTerm}
                ORDER BY sold_at DESC
                LIMIT ${limit}
            ` as unknown as any[];
        } else {
            results = await sql`
                SELECT * FROM sale_out
                ORDER BY sold_at DESC
                LIMIT ${limit}
            ` as unknown as any[];
        }

        return NextResponse.json(results);
    } catch (error: unknown) {
        console.error('[SoldOut GET] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST — Record sale out (supports single or bulk)
export async function POST(request: NextRequest) {
    try {
        await ensureTable();

        const body = await request.json();
        const { items, notes, soldBy, invoiceNo, customerName } = body;

        // Support both single-item (legacy) and bulk format
        let saleItems: { id: number; source: 'master' | 'purchase'; qtySold: number }[] = [];

        if (items && Array.isArray(items)) {
            saleItems = items;
        } else {
            // Legacy single-item format
            const { masterInventoryId, purchaseLotItemId, qtySold, source } = body;
            const isMaster = source !== 'purchase';
            saleItems = [{
                id: isMaster ? masterInventoryId : purchaseLotItemId,
                source: isMaster ? 'master' : 'purchase',
                qtySold: qtySold || 1
            }];
        }

        if (saleItems.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        let successCount = 0;
        let totalQtySold = 0;
        const errors: string[] = [];
        const soldDetails: string[] = [];
        const soldAt = new Date();
        for (const saleItem of saleItems) {
            const { id, source, qtySold } = saleItem;
            if (!id || !qtySold || qtySold < 1) {
                errors.push(`Invalid item: id=${id}, qty=${qtySold}`);
                continue;
            }

            const isMaster = source !== 'purchase';
            let item: any;

            try {
                if (isMaster) {
                    const rows = await sql`
                        SELECT id, barcode, lot_number, brand, model, series, product_name, quantity
                        FROM master_inventory WHERE id = ${id}
                    ` as unknown as any[];
                    if (rows.length === 0) { errors.push(`Master item #${id} not found`); continue; }
                    item = rows[0];
                } else {
                    const rows = await sql`
                        SELECT pli.id, pl.lot_number, pli.brand, pli.model, pli.series,
                                pli.product_name, pli.quantity
                        FROM purchase_lot_items pli
                        JOIN purchase_lots pl ON pli.lot_id = pl.id
                        WHERE pli.id = ${id}
                    ` as unknown as any[];
                    if (rows.length === 0) { errors.push(`Purchase item #${id} not found`); continue; }
                    item = rows[0];
                    item.barcode = '';
                }

                if (item.quantity < qtySold) {
                    errors.push(`${item.brand} ${item.model}: insufficient qty (have ${item.quantity}, need ${qtySold})`);
                    continue;
                }

                // Insert into sale_out
                await sql`
                    INSERT INTO sale_out (
                        master_inventory_id, purchase_lot_item_id, source,
                        barcode, lot_number, brand, model, series, product_name,
                        qty_sold, sold_by, invoice_no, customer_name, notes, sold_at
                    ) VALUES (
                        ${isMaster ? item.id : null},
                        ${!isMaster ? item.id : null},
                        ${isMaster ? 'master' : 'purchase'},
                        ${item.barcode || ''},
                        ${item.lot_number || ''},
                        ${item.brand || ''},
                        ${item.model || ''},
                        ${item.series || ''},
                        ${item.product_name || ''},
                        ${qtySold},
                        ${soldBy || 'Admin'},
                        ${invoiceNo || null},
                        ${customerName || null},
                        ${notes || ''},
                        ${soldAt}
                    )
                `;

                // Deduct quantity
                if (isMaster) {
                    await sql`
                        UPDATE master_inventory
                        SET quantity = quantity - ${qtySold}, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ${id}
                    `;
                } else {
                    await sql`
                        UPDATE purchase_lot_items
                        SET quantity = quantity - ${qtySold}
                        WHERE id = ${id}
                    `;
                }

                successCount++;
                totalQtySold += qtySold;
                soldDetails.push(`${item.brand} ${item.model} x${qtySold}`);
            } catch (innerErr: any) {
                errors.push(`${item?.brand || 'Unknown'} ${item?.model || ''}: ${innerErr.message}`);
            }
        }

        if (successCount > 0) {
            await logActivity(
                soldBy || 'Admin',
                'Sale Out (Bulk)',
                `Sold ${totalQtySold} pc(s) across ${successCount} items: ${soldDetails.join(', ')}`,
                'success',
                'Admin'
            );
        }

        return NextResponse.json({
            success: successCount > 0,
            message: `Successfully sold ${successCount} of ${saleItems.length} items (${totalQtySold} pcs total)`,
            successCount,
            totalQtySold,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error: unknown) {
        console.error('[SoldOut POST] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
