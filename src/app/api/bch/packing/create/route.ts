import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { boxes } = body;

        if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
            return NextResponse.json({ error: 'Missing boxes data' }, { status: 400 });
        }

        // 1. Ensure Tables Exist
        await sql`
            CREATE TABLE IF NOT EXISTS packing_boxes (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL,
                box_type TEXT NOT NULL,
                box_number INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS packed_items (
                id SERIAL PRIMARY KEY,
                packing_box_id INTEGER NOT NULL REFERENCES packing_boxes(id) ON DELETE CASCADE,
                product_name TEXT NOT NULL,
                sku TEXT,
                quantity INTEGER NOT NULL,
                qc_id INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Process each box in the batch
        const createdBoxIds = [];

        for (const box of boxes) {
            const { orderId, boxType, boxNumber, items } = box;

            if (!orderId || !items || items.length === 0) {
                console.warn(`Skipping invalid box #${boxNumber}`);
                continue;
            }

            // 2. Insert Packing Box
            const boxResult = await sql`
                INSERT INTO packing_boxes (order_id, box_type, box_number)
                VALUES (${orderId}, ${boxType}, ${boxNumber})
                RETURNING id
            ` as unknown as { id: number }[];

            const boxId = boxResult[0].id;
            createdBoxIds.push(boxId);

            // 3. Insert Packed Items
            for (const item of items) {
                await sql`
                    INSERT INTO packed_items (packing_box_id, product_name, sku, quantity, qc_id)
                    VALUES (${boxId}, ${item.product_name || item.name}, ${item.sku || item.productCode || null}, ${item.quantity}, ${item.qc_id || null})
                `;
            }
        }

        await logActivity(
            'Admin',
            'Packing',
            `Packed ${createdBoxIds.length} boxes`,
            'success',
            'Admin'
        );

        return NextResponse.json({ success: true, boxIds: createdBoxIds });

    } catch (error: unknown) {
        console.error('Error saving packing list:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to save packing list', details: errorMessage }, { status: 500 });
    }
}
