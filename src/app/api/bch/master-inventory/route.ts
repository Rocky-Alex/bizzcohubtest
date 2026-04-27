export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const barcode = searchParams.get('barcode');
        const sku = searchParams.get('sku');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let items;

        if (barcode) {
            items = await sql`
                SELECT * FROM master_inventory 
                WHERE barcode = ${barcode}
                LIMIT 1
            `;
        } else if (sku) {
            items = await sql`
                SELECT * FROM master_inventory 
                WHERE sku = ${sku}
                LIMIT 1
            `;
        } else if (search) {
            const searchPattern = `%${search}%`;
            items = await sql`
                SELECT * FROM master_inventory 
                WHERE 
                    product_name ILIKE ${searchPattern} OR
                    barcode ILIKE ${searchPattern} OR
                    sku ILIKE ${searchPattern} OR
                    model ILIKE ${searchPattern} OR
                    lot_number ILIKE ${searchPattern}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else {
            items = await sql`
                SELECT * FROM master_inventory 
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        }

        return NextResponse.json({ success: true, data: items || [] });
    } catch (e: any) {
        console.error("Master Inventory API Error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Allow direct insertion if legacy tables are gone
        const result = await sql`
            INSERT INTO master_inventory (
                barcode, sku, lot_number, lot_notes,
                product_name, brand, model, series, category, type,
                processor, processor_gen, ram, storage, graphics_card, screen_size, screen_resolution, condition_status, qc_status,
                unit_cost, total_cost, base_price, offer_price, quantity,
                supplier_name, invoice_number,
                primary_image_url, all_images_urls,
                qc_created_by, qc_created_at
            ) VALUES (
                ${body.barcode}, ${body.sku}, ${body.lot_number}, ${body.lot_notes},
                ${body.product_name}, ${body.brand}, ${body.model}, ${body.series}, ${body.category}, ${body.type},
                ${body.processor}, ${body.processor_gen}, ${body.ram}, ${body.storage}, ${body.graphics_card}, ${body.screen_size}, ${body.screen_resolution}, ${body.condition_status}, ${body.qc_status},
                ${body.unit_cost}, ${body.total_cost}, ${body.base_price}, ${body.offer_price}, ${body.quantity || 1},
                ${body.supplier_name}, ${body.invoice_number},
                ${body.primary_image_url}, ${body.all_images_urls},
                ${body.qc_created_by}, ${body.qc_created_at || new Date().toISOString()}
            )
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        if (!body.id) {
            return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
        }

        const result = await sql`
            UPDATE master_inventory SET
                barcode = COALESCE(${body.barcode}, barcode),
                sku = COALESCE(${body.sku}, sku),
                lot_number = COALESCE(${body.lot_number}, lot_number),
                lot_notes = COALESCE(${body.lot_notes}, lot_notes),
                product_name = COALESCE(${body.product_name}, product_name),
                brand = COALESCE(${body.brand}, brand),
                model = COALESCE(${body.model}, model),
                series = COALESCE(${body.series}, series),
                category = COALESCE(${body.category}, category),
                type = COALESCE(${body.type}, type),
                processor = COALESCE(${body.processor}, processor),
                processor_gen = COALESCE(${body.processor_gen}, processor_gen),
                ram = COALESCE(${body.ram}, ram),
                storage = COALESCE(${body.storage}, storage),
                graphics_card = COALESCE(${body.graphics_card}, graphics_card),
                screen_size = COALESCE(${body.screen_size}, screen_size),
                screen_resolution = COALESCE(${body.screen_resolution}, screen_resolution),
                condition_status = COALESCE(${body.condition_status}, condition_status),
                qc_status = COALESCE(${body.qc_status}, qc_status),
                unit_cost = COALESCE(${body.unit_cost}, unit_cost),
                total_cost = COALESCE(${body.total_cost}, total_cost),
                base_price = COALESCE(${body.base_price}, base_price),
                offer_price = COALESCE(${body.offer_price}, offer_price),
                quantity = COALESCE(${body.quantity}, quantity),
                supplier_name = COALESCE(${body.supplier_name}, supplier_name),
                invoice_number = COALESCE(${body.invoice_number}, invoice_number),
                primary_image_url = COALESCE(${body.primary_image_url}, primary_image_url),
                all_images_urls = COALESCE(${body.all_images_urls}, all_images_urls),
                updated_at = NOW()
            WHERE id = ${body.id}
            RETURNING *
        `;

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result[0] });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        await sql`DELETE FROM master_inventory WHERE id = ${id}`;
        return NextResponse.json({ success: true, message: "Deleted successfully" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
