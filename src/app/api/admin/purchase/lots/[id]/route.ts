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

        console.log(`[API] Deleting Purchase Lot ID: ${id}`);

        // 1. Delete associated QC records
        await sql`DELETE FROM inventory_qc WHERE lot_id = ${id}`;

        // 2. Delete the lot (cascades to purchase_lot_items)
        const result = await sql`DELETE FROM purchase_lots WHERE id = ${id} RETURNING lot_number` as unknown as { lot_number: string }[];

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: 'Lot not found' }, { status: 404 });
        }

        const lotNumber = result[0].lot_number || `ID: ${id}`;

        await logActivity(
            'Admin',
            'Purchase Delete',
            `Deleted purchase lot ${lotNumber}`,
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
