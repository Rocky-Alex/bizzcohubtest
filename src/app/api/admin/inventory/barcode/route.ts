import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const barcode = searchParams.get('barcode');

        if (!barcode) {
            return NextResponse.json({ success: false, error: 'Barcode is required' }, { status: 400 });
        }

        // Barcode format: BCH-<QC_ID> (e.g., BCH-1005)
        // Or could be internal ID if just numbers.
        let qcId = -1;

        const cleanBarcode = barcode.trim().toUpperCase();
        if (cleanBarcode.startsWith('BCH-')) {
            const idPart = cleanBarcode.replace('BCH-', '');
            // Logic: seqNumber = 999 + insertedId
            // So insertedId = seqNumber - 999
            const seqNumber = parseInt(idPart);
            if (!isNaN(seqNumber)) {
                qcId = seqNumber - 999;
            }
        } else {
            // Maybe they scanned just the number?
            const possibleId = parseInt(cleanBarcode);
            if (!isNaN(possibleId)) {
                // If small number, maybe ID? If > 999 maybe seqNumber?
                // Let's assume if > 999 it is seqNumber
                if (possibleId > 999) {
                    qcId = possibleId - 999;
                } else {
                    qcId = possibleId;
                }
            }
        }

        if (qcId <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid barcode format' }, { status: 404 });
        }

        // Fetch QC Item with related Lot and Product info
        // Note: inventory_qc does not have product_id, so we link to products via SKU
        const sql = `
            SELECT 
                iq.*,
                pl.lot_id as purchase_lot_code,
                pl.lot_number as purchase_lot_number,
                p.ram as product_ram,
                p.storage as product_storage,
                p.screen_size as product_screen_size,
                p.graphics_card as product_graphics,
                p.product_name as product_name_master
            FROM inventory_qc iq
            LEFT JOIN purchase_lots pl ON iq.lot_id = pl.id
            LEFT JOIN products p ON TRIM(UPPER(p.product_code)) = TRIM(UPPER(iq.sku))
            WHERE iq.id = $1
            LIMIT 1
        `;

        const result = await query(sql, [qcId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }

        const item = result.rows[0];
        const seqNumber = 999 + item.id;

        // Map snake_case database fields to camelCase for frontend where needed
        // Coalesce item-specific specs with product master specs
        const mappedItem = {
            ...item,
            productName: item.product_name || item.product_name_master,
            ram: item.ram || item.product_ram || '',
            storage: item.storage || item.product_storage || '',
            screen_size: item.screen_size || item.product_screen_size || '',
            graphics_card: item.graphics || item.product_graphics || '',
            barcodeValue: `BCH-${seqNumber}`,
            lotNumber: item.purchase_lot_number || item.purchase_lot_code || `Lot #${item.lot_id}`,
            generatedId: `List-${item.lot_id}-${item.product_id || 'GEN'}-${seqNumber}`
        };

        return NextResponse.json({
            success: true,
            item: mappedItem
        });

    } catch (error) {
        console.error('Error fetching barcode details:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
