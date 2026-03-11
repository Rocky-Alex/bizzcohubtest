import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const idStr = searchParams.get('id');

        if (!idStr) {
            return NextResponse.json({ success: false, error: 'Lot ID is required' }, { status: 400 });
        }

        const id = parseInt(idStr);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid Lot ID' }, { status: 400 });
        }

        // 1. Fetch Lot Metadata from purchase_lots
        const lotInfo = await sql`
            SELECT id, lot_number, supplier_name, invoice_date, invoice_number, total_cost, notes, status
            FROM purchase_lots
            WHERE id = ${id}
        ` as unknown as any[];

        if (lotInfo.length === 0) {
            return NextResponse.json({ success: false, error: 'Lot not found' }, { status: 404 });
        }

        const lotMetadata = {
            lotId: lotInfo[0].id.toString(),
            lotNumber: lotInfo[0].lot_number,
            supplierName: lotInfo[0].supplier_name,
            invoiceDate: lotInfo[0].invoice_date,
            invoiceNumber: lotInfo[0].invoice_number,
            totalCost: lotInfo[0].total_cost,
            notes: lotInfo[0].notes,
            status: lotInfo[0].status
        };

        // 2. Fetch Items from purchase_lot_items
        const items = await sql`
            SELECT 
                id as "itemId",
                product_name as "productName",
                product_type as "productType",
                brand,
                model,
                series,
                processor,
                processor_gen as "processorGen",
                ram,
                storage,
                graphics,
                screen_size as "screenSize",
                screen_resolution as "screenResolution",
                condition_status as "conditionStatus",
                sku, 
                quantity,
                qc_count as "qcCount",
                unit_cost as "unitCost"
            FROM purchase_lot_items
            WHERE lot_id = ${id}
            ORDER BY id ASC
        ` as unknown as any[];

        console.log(`[API] Found ${items.length} items for Lot ID: ${id}`);

        // Return raw items (or aggregated if multiple rows per product)
        // Since we insert compacted rows, we can return directly
        const lot = { ...lotMetadata, items: items };

        return NextResponse.json({ success: true, lot });

    } catch (error: unknown) {
        console.error('Error fetching lot details:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
