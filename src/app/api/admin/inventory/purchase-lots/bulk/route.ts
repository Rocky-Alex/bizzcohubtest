import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lotMetadata, items } = body;

        if (!lotMetadata || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // 1. Create Purchase Lot
        const lotResult = await sql`
            INSERT INTO purchase_lots (
                lot_number, supplier_name, invoice_number, invoice_date, total_cost, notes, status
            ) VALUES (
                ${lotMetadata.lotNumber || null},
                ${lotMetadata.supplierName},
                ${lotMetadata.invoiceNumber},
                ${lotMetadata.invoiceDate || null},
                ${lotMetadata.totalCost || 0},
                ${lotMetadata.notes || ''},
                'Active'
            )
            RETURNING id
        `;

        const lotId = lotResult[0].id;

        // 2. Insert Items
        // We do this in a loop or bulk insert. Loop is safer for variable interpolation in neon sometimes, but separate queries.
        // For 50-100 items, parallel promises are fine.

        await Promise.all(items.map((item: any) => {
            return sql`
                INSERT INTO purchase_lot_items (
                    lot_id, product_name, sku, quantity, unit_cost, 
                    brand, model, series, processor, processor_gen, 
                    product_type, description, metadata
                ) VALUES (
                    ${lotId},
                    ${item.productName},
                    ${item.sku},
                    ${item.quantity},
                    ${item.unitCost},
                    ${item.brand},
                    ${item.model},
                    ${item.series},
                    ${item.processor},
                    ${item.processorGen},
                    ${item.productType},
                    ${item.description},
                    ${JSON.stringify(item.metadata)}
                )
            `;
        }));

        await logActivity(
            'Admin',
            'Import Purchase Lot',
            `Imported Lot #${lotId} from ${lotMetadata.supplierName} with ${items.length} items.`,
            'success'
        );

        return NextResponse.json({ success: true, lotId, count: items.length });

    } catch (error: any) {
        console.error('Error importing purchase lot:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
