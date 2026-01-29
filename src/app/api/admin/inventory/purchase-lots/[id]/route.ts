import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseLots, purchaseLotItems } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const lotId = parseInt(params.id);
        console.log(`Attempting to delete lotId: ${lotId} (raw: ${params.id})`);

        if (isNaN(lotId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // 1. Delete associated QC records (cascading manually)
        // Since qc_inventory might not be in drizzle schema file yet (it was migrated raw SQL), we use SQL.
        try {
            await db.execute(sql`DELETE FROM qc_inventory WHERE lot_id = ${lotId}`);
            console.log(`Deleted associated QC records for lot ${lotId}`);
        } catch (qcError) {
            console.warn("Error deleting QC records (might not exist):", qcError);
        }

        // 2. Delete items associated with the lot
        const itemsResult = await db.delete(purchaseLotItems)
            .where(eq(purchaseLotItems.lotId, lotId))
            .returning({ id: purchaseLotItems.itemId });

        console.log(`Deleted ${itemsResult.length} items for lot ${lotId}`);

        // 3. Delete the lot itself
        const lotResult = await db.delete(purchaseLots)
            .where(eq(purchaseLots.lotId, lotId))
            .returning({ id: purchaseLots.lotId });

        console.log(`Deleted lot result:`, lotResult);

        if (lotResult.length === 0) {
            console.warn(`Lot ${lotId} was not found or could not be deleted.`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting purchase lot:', error);
        return NextResponse.json({ error: 'Failed to delete purchase lot' }, { status: 500 });
    }
}
