import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const barcode = searchParams.get('barcode');

        if (!barcode) {
            return NextResponse.json({ success: false, error: 'Barcode is required' }, { status: 400 });
        }

        const cleanBarcode = barcode.trim().toUpperCase();

        // Fetch Item from Master Inventory
        // We accept either direct Barcode (BCH-XXXX) or numeric ID
        let results: any[] = [];

        // 1. Try exact Barcode match
        results = await sql`SELECT * FROM master_inventory WHERE barcode = ${cleanBarcode} LIMIT 1` as any[];

        if (results.length === 0) {
            // 2. Try as Numeric ID
            const numericId = parseInt(cleanBarcode);
            if (!isNaN(numericId)) {
                results = await sql`SELECT * FROM master_inventory WHERE id = ${numericId} LIMIT 1` as any[];
            }
        }

        if (results.length === 0 && cleanBarcode.startsWith('BCH-')) {
            // 3. Logic check: If BCH-XXXX, maybe ID = XXXX - 1000? (Legacy format check)
            const idPart = cleanBarcode.replace('BCH-', '');
            const seqNum = parseInt(idPart);
            if (!isNaN(seqNum)) {
                const derivedId = seqNum - 1000;
                if (derivedId > 0) {
                    results = await sql`SELECT * FROM master_inventory WHERE id = ${derivedId} LIMIT 1` as any[];
                }
            }
        }

        if (results.length === 0) {
            return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }

        const item = results[0];

        // Map to frontend expected format
        const mappedItem = {
            ...item,
            productName: item.product_name,
            barcodeValue: item.barcode,
            lotNumber: item.lot_number || 'Unknown',
            generatedId: `INV-${item.id}`
        };

        return NextResponse.json({
            success: true,
            item: mappedItem
        });

    } catch (error: any) {
        console.error('Error fetching barcode details:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
