import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseLots } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'active'; // active, completed

        const lots = await db.query.purchaseLots.findMany({
            orderBy: [desc(purchaseLots.createdAt)],
            with: {
                items: {
                    columns: {
                        quantity: true
                    }
                }
            }
        });

        // Get QC counts per lot
        const qcCounts = await db.execute(sql`
            SELECT lot_id, COUNT(*)::int as count 
            FROM qc_inventory 
            GROUP BY lot_id
        `);

        // Map QC counts
        const qcMap: Record<number, number> = {};
        const countRows = Array.isArray(qcCounts) ? qcCounts : (qcCounts as any).rows || [];
        countRows.forEach((r: any) => {
            if (r.lot_id) {
                qcMap[r.lot_id] = Number(r.count);
            }
        });

        const activeLots = lots.map(lot => {
            const totalItems = lot.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const { items, ...rest } = lot;
            const qcCount = qcMap[lot.lotId] || 0;
            return { ...rest, totalItems, qcCount };
        }).filter(lot => {
            if (status === 'completed') {
                return lot.qcCount >= lot.totalItems && lot.totalItems > 0;
            } else {
                return lot.qcCount < lot.totalItems;
            }
        });

        return NextResponse.json({ success: true, lots: activeLots });
    } catch (error: any) {
        console.error('Error fetching purchase lots:', error);
        return NextResponse.json({ error: 'Failed to fetch purchase lots' }, { status: 500 });
    }
}
