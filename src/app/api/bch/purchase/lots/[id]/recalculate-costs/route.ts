import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
    try {
        // Await params to be compatible with both Next 14 and Next 15+
        const params = await Promise.resolve(context.params);
        const id = parseInt(params.id);

        const body = await req.json();
        const { newTotalCost, force } = body;

        console.log(`[API] Recalculating costs for Lot ID: ${id}, New Total: ${newTotalCost}, Force: ${!!force}`);

        if (newTotalCost === undefined || isNaN(Number(newTotalCost))) {
            return NextResponse.json({ success: false, error: 'Invalid total cost' }, { status: 400 });
        }

        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid lot ID' }, { status: 400 });
        }

        // 1. Get all items in this lot
        const items = await sql`
            SELECT id, quantity, unit_cost FROM purchase_lot_items WHERE lot_id = ${id}
        ` as unknown as { id: number, quantity: number, unit_cost: number }[];

        if (items.length === 0) {
            return NextResponse.json({ success: false, error: 'No items in this lot' }, { status: 400 });
        }

        const totalQty = items.reduce((sum, item) => sum + Number(item.quantity), 0);
        if (totalQty === 0) {
            return NextResponse.json({ success: false, error: 'Total quantity is zero' }, { status: 400 });
        }

        if (force) {
            // Overwrite EVERYTHING
            const unitCostPerUnit = Number(newTotalCost) / totalQty;
            for (const item of items) {
                const newTotalItemCost = Number(item.quantity) * unitCostPerUnit;
                await sql`
                    UPDATE purchase_lot_items
                    SET unit_cost = ${unitCostPerUnit}, total_cost = ${newTotalItemCost}
                    WHERE id = ${item.id}
                `;
            }
        } else {
            // SMART DISTRIBUTION
            // Find items that already have a price set (considered "Locked")
            const lockedItems = items.filter(i => Number(i.unit_cost) > 0);
            const unlockedItems = items.filter(i => Number(i.unit_cost) <= 0);

            if (unlockedItems.length > 0) {
                const lockedTotalCost = lockedItems.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_cost)), 0);
                const remainingBalance = Number(newTotalCost) - lockedTotalCost;
                const remainingQty = unlockedItems.reduce((sum, i) => sum + Number(i.quantity), 0);

                const unitCostForUnlocked = remainingQty > 0 ? remainingBalance / remainingQty : 0;

                for (const item of unlockedItems) {
                    const newTotalItemCost = Number(item.quantity) * unitCostForUnlocked;
                    await sql`
                        UPDATE purchase_lot_items
                        SET unit_cost = ${unitCostForUnlocked}, total_cost = ${newTotalItemCost}
                        WHERE id = ${item.id}
                    `;
                }
            } else {
                // All items already have a price? Overwrite everything equally (fallback)
                const unitCostPerUnit = Number(newTotalCost) / totalQty;
                for (const item of items) {
                    const newTotalItemCost = Number(item.quantity) * unitCostPerUnit;
                    await sql`
                        UPDATE purchase_lot_items
                        SET unit_cost = ${unitCostPerUnit}, total_cost = ${newTotalItemCost}
                        WHERE id = ${item.id}
                    `;
                }
            }
        }

        // 4. Update the lot record total_cost
        // If we are NOT forcing, the total cost of the lot should technically be the NewTotalCost provided
        // But we should ensure the lot total strictly matches the actual Sum(items) in case of rounding,
        // however for business logic, usually NewTotalCost is the truth.
        await sql`
            UPDATE purchase_lots
            SET total_cost = ${newTotalCost}
            WHERE id = ${id}
        `;

        console.log(`[API] Lot cost update complete`);

        await logActivity(
            'Admin',
            'Lot Cost Recalculation',
            `Recalculated costs for lot ID ${id} to total: ${newTotalCost}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error recalculating lot costs:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
