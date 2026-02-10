
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        console.log("Attempting to delete box:", params.id);
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'Box ID is required' }, { status: 400 });
        }

        // Verify existence mostly for logging/error checking
        const boxCheck = await sql`SELECT box_number, order_id FROM packing_boxes WHERE id = ${id}`;

        if (boxCheck.length === 0) {
            return NextResponse.json({ error: 'Box not found' }, { status: 404 });
        }

        const { box_number, order_id } = boxCheck[0];

        // Delete (Cascade handles items)
        await sql`DELETE FROM packing_boxes WHERE id = ${id}`;

        await logActivity(
            'Admin',
            'Packing',
            `Deleted Box #${box_number} from Order #${order_id}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('Error deleting box:', error);
        return NextResponse.json({ error: 'Failed to delete box' }, { status: 500 });
    }
}
