import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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

        console.log(`[API] Fetching details for Lot ID: ${id}`);

        // Fetch Lot Metadata
        const lotRows = await sql`
            SELECT 
                id as "lotId", 
                lot_number as "lotNumber", 
                supplier_name as "supplierName", 
                invoice_date as "invoiceDate", 
                invoice_number as "invoiceNumber", 
                notes,
                total_cost as "totalCost"
            FROM purchase_lots
            WHERE id = ${id}
        ` as unknown as any[];

        if (lotRows.length === 0) {
            console.warn(`[API] Lot ${id} not found`);
            return NextResponse.json({ success: false, error: 'Lot not found' }, { status: 404 });
        }

        const lot = lotRows[0];

        // Ensure qc_count column exists
        try {
            await sql`ALTER TABLE purchase_lot_items ADD COLUMN IF NOT EXISTS qc_count INTEGER DEFAULT 0`;
        } catch (e: unknown) {
            console.warn('Could not ensure qc_count column:', e);
        }

        // Fetch Lot Items
        // We use COALESCE and ensure names match what QCChecking expects
        const items = await sql`
            SELECT 
                id as "itemId", 
                COALESCE(product_type, 'Product') as "productType", 
                product_name as "productName", 
                COALESCE(brand, '') as brand, 
                COALESCE(series, '') as series, 
                COALESCE(model, '') as model, 
                COALESCE(processor, '') as processor, 
                COALESCE(processor_gen, '') as "processorGen", 
                COALESCE(sku, '') as sku, 
                COALESCE(quantity, 1) as quantity, 
                COALESCE(qc_count, 0) as "qcCount"
            FROM purchase_lot_items
            WHERE lot_id = ${id}
        ` as unknown as any[];

        console.log(`[API] Found ${items.length} items for Lot ${id}`);
        lot.items = items;

        return NextResponse.json({ success: true, lot });
    } catch (error: unknown) {
        console.error('Error fetching lot details:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
