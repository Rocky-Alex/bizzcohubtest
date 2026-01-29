import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseLots, purchaseLotItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const lotId = parseInt(params.id);
        if (isNaN(lotId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const lot = await db.select().from(purchaseLots).where(eq(purchaseLots.lotId, lotId)).limit(1);

        if (lot.length === 0) {
            return NextResponse.json({ error: 'Purchase Lot not found' }, { status: 404 });
        }

        const items = await db.select().from(purchaseLotItems).where(eq(purchaseLotItems.lotId, lotId));

        return NextResponse.json({
            lot: lot[0],
            items
        });

    } catch (error: any) {
        console.error('Fetch Lot Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const lotId = parseInt(params.id);
        if (isNaN(lotId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Delete items first (foreign key constraint)
        await db.delete(purchaseLotItems).where(eq(purchaseLotItems.lotId, lotId));

        // Delete lot
        await db.delete(purchaseLots).where(eq(purchaseLots.lotId, lotId));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Lot Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
