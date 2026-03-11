import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { orderId: string } }
): Promise<NextResponse> {
    try {
        const orderId = params.orderId;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Fetch Boxes
        const boxes = await sql`
            SELECT * FROM packing_boxes 
            WHERE order_id = ${orderId} 
            ORDER BY box_number ASC
        ` as unknown as any[];

        if (boxes.length === 0) {
            return NextResponse.json({ boxes: [] });
        }

        // Fetch Items for these boxes
        // Using a loop for simplicity with current raw SQL setup, or COULD use a JOIN.
        // Let's use a JOIN to be more efficient if possible, but structure might be easier to parse in JS
        // for "Box -> Items" hierarchy if we fetch all items for this order's boxes.

        const boxIds = boxes.map(b => b.id);

        if (boxIds.length > 0) {
            // Fetch all items for these boxes
            // sql template literals handling arrays usually need a helper or just safe values.
            // Neon/Postgres.js usually handles arrays with sql`${array}` but let's be safe and simple:
            // We'll iterate or fetch all items where packing_box_id IN ...

            // Simple approach: Fetch all items for this order via join or just fetch for each box (N+1 but N is small: number of boxes)
            // Let's do a single query joining if possible, or just all items for these boxes.

            // Constructing "IN" clause with template literals in raw helper might be tricky if not supported directly.
            // Safe fallback: Fetch all items for the order's boxes.

            const items = await sql`
                SELECT pi.* 
                FROM packed_items pi
                JOIN packing_boxes pb ON pi.packing_box_id = pb.id
                WHERE pb.order_id = ${orderId}
                ORDER BY pi.id ASC
             ` as unknown as any[];

            // Map items to boxes
            const boxesWithItems = boxes.map(box => ({
                ...box,
                items: items.filter(item => item.packing_box_id === box.id)
            }));

            return NextResponse.json({ boxes: boxesWithItems });
        }

        return NextResponse.json({ boxes });

    } catch (error: unknown) {
        console.error('Error fetching packing list:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to fetch packing list', details: errorMessage }, { status: 500 });
    }
}
