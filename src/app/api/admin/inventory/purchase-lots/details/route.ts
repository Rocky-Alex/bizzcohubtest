import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseLots, purchaseLotItems } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const lotId = searchParams.get('id');

        if (!lotId) {
            return NextResponse.json({ error: 'Missing lot ID' }, { status: 400 });
        }

        const lot = await db.query.purchaseLots.findFirst({
            where: eq(purchaseLots.lotId, parseInt(lotId)),
            with: {
                items: true
            }
        });

        if (!lot) {
            return NextResponse.json({ error: 'Purchase lot not found' }, { status: 404 });
        }

        // Fetch QC counts for this lot's items
        try {
            const counts = await db.execute(sql`
                SELECT purchase_lot_item_id, COUNT(*)::int as count 
                FROM qc_inventory 
                WHERE lot_id = ${parseInt(lotId)} 
                GROUP BY purchase_lot_item_id
            `);

            // Map counts to items (handle 'rows' based on driver)
            const countRows = Array.isArray(counts) ? counts : (counts as any).rows || [];
            const countMap: Record<number, number> = {};

            countRows.forEach((r: any) => {
                if (r.purchase_lot_item_id) {
                    countMap[r.purchase_lot_item_id] = Number(r.count);
                }
            });

            // Enrich items
            (lot.items as any) = lot.items.map((item: any) => ({
                ...item,
                qcCount: countMap[item.itemId] || 0
            }));

        } catch (e) {
            console.warn("Error fetching QC counts:", e);
        }

        return NextResponse.json({ success: true, lot });
    } catch (error: any) {
        console.error('Error fetching purchase lot details:', error);
        return NextResponse.json({ error: 'Failed to fetch purchase lot details' }, { status: 500 });
    }
}
