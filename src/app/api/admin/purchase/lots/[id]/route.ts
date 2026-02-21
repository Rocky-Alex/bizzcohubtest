import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const id = params.id;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Lot ID is required' }, { status: 400 });
        }

        console.log(`[API] Deleting Purchase Lot with ID: ${id}`);

        // 1. Check if the lot exists in purchase_lots
        const lotCheck = await sql`
            SELECT id, lot_number FROM purchase_lots WHERE id = ${id}
        ` as unknown as { id: number, lot_number: string }[];

        if (lotCheck.length === 0) {
            return NextResponse.json({ success: false, error: 'Lot not found' }, { status: 404 });
        }

        const lotNumber = lotCheck[0].lot_number;

        // 2. Delete items associated with this lot from purchase_lot_items
        await sql`DELETE FROM purchase_lot_items WHERE lot_id = ${id}`;

        // 3. Delete the lot itself from purchase_lots
        await sql`DELETE FROM purchase_lots WHERE id = ${id}`;

        await logActivity(
            'Admin',
            'Purchase Delete',
            `Deleted purchase lot ${lotNumber} (ID: ${id})`,
            'success',
            'Admin'
        );

        return NextResponse.json({ success: true, message: 'Lot deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting lot:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
