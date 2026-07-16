import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

// Helper to run auto-migrations to ensure table columns exist
async function ensureSchema() {
    try {
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS stock_balance INTEGER`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS base_price DECIMAL(12, 2)`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS offer_price DECIMAL(12, 2)`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS series TEXT`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS screen_size TEXT`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS screen_resolution TEXT`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS keyboard_type TEXT`;
        await sql`ALTER TABLE master_inventory ADD COLUMN IF NOT EXISTS keyboard_backlit TEXT`;
    } catch (e) {
        console.error('Schema update warning:', e);
    }
}

export async function GET(req: Request): Promise<NextResponse> {
    try {
        await ensureSchema();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const brand = searchParams.get('brand') || '';
        const processor = searchParams.get('processor') || '';
        const ram = searchParams.get('ram') || '';
        const storage = searchParams.get('storage') || '';
        const condition = searchParams.get('condition') || '';
        const qcStatus = searchParams.get('qcStatus') || '';
        
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const order = searchParams.get('order') || 'desc';
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // Build dynamic query
        let queryText = `
            SELECT *, COUNT(*) OVER() AS total_count 
            FROM master_inventory
            WHERE 1=1
        `;
        const params: any[] = [];
        let pIndex = 1;

        if (search) {
            queryText += ` AND (product_name ILIKE $${pIndex} OR barcode ILIKE $${pIndex + 1} OR sku ILIKE $${pIndex + 2} OR lot_number ILIKE $${pIndex + 3})`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            pIndex += 4;
        }

        if (brand) {
            queryText += ` AND brand = $${pIndex}`;
            params.push(brand);
            pIndex += 1;
        }

        if (processor) {
            queryText += ` AND processor = $${pIndex}`;
            params.push(processor);
            pIndex += 1;
        }

        if (ram) {
            queryText += ` AND ram = $${pIndex}`;
            params.push(ram);
            pIndex += 1;
        }

        if (storage) {
            queryText += ` AND storage = $${pIndex}`;
            params.push(storage);
            pIndex += 1;
        }

        if (condition) {
            queryText += ` AND condition_status = $${pIndex}`;
            params.push(condition);
            pIndex += 1;
        }

        if (qcStatus) {
            queryText += ` AND qc_status = $${pIndex}`;
            params.push(qcStatus);
            pIndex += 1;
        }

        // Validate sorting fields to prevent injection
        const validSortFields = ['created_at', 'product_name', 'base_price', 'offer_price', 'quantity', 'stock_balance', 'brand', 'model', 'condition_status', 'qc_status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        queryText += ` ORDER BY ${sortField} ${sortOrder}`;

        // Add limit and offset
        queryText += ` LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
        params.push(limit, offset);

        const data = await sql(queryText, ...params) as unknown as any[];
        
        const total = data.length > 0 ? parseInt(data[0].total_count, 10) : 0;
        
        // Remove total_count column from output rows
        const items = data.map(item => {
            const { total_count, ...rest } = item;
            return rest;
        });

        // Also fetch unique drop-lists values for filters
        const dropdowns = {
            brands: (await sql`SELECT DISTINCT brand FROM master_inventory WHERE brand IS NOT NULL AND brand != '' ORDER BY brand ASC` as any[]).map(r => r.brand),
            processors: (await sql`SELECT DISTINCT processor FROM master_inventory WHERE processor IS NOT NULL AND processor != '' ORDER BY processor ASC` as any[]).map(r => r.processor),
            rams: (await sql`SELECT DISTINCT ram FROM master_inventory WHERE ram IS NOT NULL AND ram != '' ORDER BY ram ASC` as any[]).map(r => r.ram),
            storages: (await sql`SELECT DISTINCT storage FROM master_inventory WHERE storage IS NOT NULL AND storage != '' ORDER BY storage ASC` as any[]).map(r => r.storage),
            conditions: (await sql`SELECT DISTINCT condition_status FROM master_inventory WHERE condition_status IS NOT NULL AND condition_status != '' ORDER BY condition_status ASC` as any[]).map(r => r.condition_status),
        };

        return NextResponse.json({
            success: true,
            data: items,
            total,
            dropdowns
        });

    } catch (error: unknown) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        await ensureSchema();
        const body = await req.json();

        const {
            productName,
            brand,
            series,
            model,
            sku,
            processor,
            processorGen,
            ram,
            storage,
            graphicsCard,
            screenSize,
            screenResolution,
            keyboardType,
            keyboardBacklit,
            conditionStatus,
            qcStatus,
            quantity,
            stockBalance,
            basePrice,
            offerPrice,
            lotNumber,
            createdBy
        } = body;

        if (!productName) {
            return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 });
        }

        // Insert new product
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
                ${lotNumber || 'MANUAL'},
                ${sku || null},
                ${productName},
                ${brand || null},
                ${series || null},
                ${model || null},
                ${processor || null},
                ${processorGen || null},
                ${ram || null},
                ${storage || null},
                ${graphicsCard || null},
                ${screenSize || null},
                ${screenResolution || null},
                ${keyboardType || null},
                ${keyboardBacklit || null},
                ${conditionStatus || 'Unknown'},
                ${qcStatus || 'Passed'},
                ${parseInt(quantity || 1, 10)},
                ${parseInt(stockBalance || quantity || 1, 10)},
                ${basePrice ? parseFloat(basePrice) : null},
                ${offerPrice ? parseFloat(offerPrice) : null},
                NOW(),
                NOW()
            )
            RETURNING id
        ` as unknown as { id: number }[];

        const newId = insertResult[0].id;
        const generatedBarcode = `BCH-LP-${1000 + newId}`;

        // Update with barcode
        await sql`
            UPDATE master_inventory
            SET barcode = ${generatedBarcode}
            WHERE id = ${newId}
        `;

        await logActivity(
            createdBy || 'Admin',
            'Add Inventory Product',
            `Added laptop ${productName} (Barcode: ${generatedBarcode}, SKU: ${sku || 'N/A'}) to inventory`,
            'success',
            'Admin'
        );

        return NextResponse.json({
            success: true,
            message: 'Laptop added successfully',
            data: { id: newId, barcode: generatedBarcode }
        });

    } catch (error: unknown) {
        console.error('Error adding laptop:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}

export async function PUT(req: Request): Promise<NextResponse> {
    try {
        await ensureSchema();
        const body = await req.json();

        const {
            id,
            productName,
            brand,
            series,
            model,
            sku,
            barcode,
            processor,
            processorGen,
            ram,
            storage,
            graphicsCard,
            screenSize,
            screenResolution,
            keyboardType,
            keyboardBacklit,
            conditionStatus,
            qcStatus,
            quantity,
            stockBalance,
            basePrice,
            offerPrice,
            lotNumber,
            updatedBy
        } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        // Update query
        const result = await sql`
            UPDATE master_inventory
            SET
                product_name = ${productName},
                brand = ${brand || null},
                series = ${series || null},
                model = ${model || null},
                sku = ${sku || null},
                barcode = ${barcode || null},
                processor = ${processor || null},
                processor_gen = ${processorGen || null},
                ram = ${ram || null},
                storage = ${storage || null},
                graphics_card = ${graphicsCard || null},
                screen_size = ${screenSize || null},
                screen_resolution = ${screenResolution || null},
                keyboard_type = ${keyboardType || null},
                keyboard_backlit = ${keyboardBacklit || null},
                condition_status = ${conditionStatus || 'Unknown'},
                qc_status = ${qcStatus || 'Passed'},
                quantity = ${parseInt(quantity || 1, 10)},
                stock_balance = ${parseInt(stockBalance || quantity || 1, 10)},
                base_price = ${basePrice ? parseFloat(basePrice) : null},
                offer_price = ${offerPrice ? parseFloat(offerPrice) : null},
                lot_number = ${lotNumber || 'MANUAL'},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING id
        ` as unknown as any[];

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        await logActivity(
            updatedBy || 'Admin',
            'Update Inventory Product',
            `Updated laptop ${productName} (ID: ${id}) in inventory`,
            'success',
            'Admin'
        );

        return NextResponse.json({
            success: true,
            message: 'Laptop updated successfully'
        });

    } catch (error: unknown) {
        console.error('Error updating laptop:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}

export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const deletedBy = searchParams.get('deletedBy') || 'Admin';

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        // Fetch details before delete for activity logging
        const itemResult = await sql`
            SELECT product_name, barcode FROM master_inventory WHERE id = ${id}
        ` as unknown as any[];

        if (itemResult.length === 0) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        const { product_name, barcode } = itemResult[0];

        // Perform DELETE
        await sql`
            DELETE FROM master_inventory WHERE id = ${id}
        `;

        await logActivity(
            deletedBy,
            'Delete Inventory Product',
            `Deleted laptop ${product_name} (Barcode: ${barcode}, ID: ${id}) from inventory`,
            'success',
            'Admin'
        );

        return NextResponse.json({
            success: true,
            message: 'Laptop deleted successfully'
        });

    } catch (error: unknown) {
        console.error('Error deleting laptop:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}
