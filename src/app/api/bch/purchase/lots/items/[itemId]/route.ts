import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function PUT(_req: Request, context: any): Promise<NextResponse> {
    try {
        const params = await Promise.resolve(context.params);
        const itemId = params.itemId;
        const body = await _req.json();
        const {
            productType,
            productName,
            brand,
            series,
            model,
            processor,
            processorGen,
            sku,
            quantity,
            unitCost,
            description
        } = body;

        await sql`
            UPDATE purchase_lot_items
            SET 
                product_type = ${productType || null},
                product_name = ${productName},
                brand = ${brand || null},
                series = ${series || null},
                model = ${model || null},
                processor = ${processor || null},
                processor_gen = ${processorGen || null},
                sku = ${sku || null},
                quantity = ${parseInt(quantity?.toString()) || 1},
                unit_cost = ${parseFloat(unitCost?.toString()) || 0},
                description = ${description || null}
            WHERE id = ${itemId}
        `;

        // Also update the total_cost in purchase_lots
        const lotIdRes = await sql`SELECT lot_id FROM purchase_lot_items WHERE id = ${itemId}` as unknown as { lot_id: number }[];
        if (lotIdRes.length > 0) {
            const lotId = lotIdRes[0].lot_id;
            await sql`
                UPDATE purchase_lots 
                SET total_cost = (
                    SELECT SUM(quantity * unit_cost) 
                    FROM purchase_lot_items 
                    WHERE lot_id = ${lotId}
                )
                WHERE id = ${lotId}
            `;
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error updating purchase lot item:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(_req: Request, context: any): Promise<NextResponse> {
    try {
        const params = await Promise.resolve(context.params);
        const itemId = params.itemId;

        // Get lot ID before deleting for updating grand total
        const lotIdRes = await sql`SELECT lot_id, product_name FROM purchase_lot_items WHERE id = ${itemId}` as unknown as { lot_id: number, product_name: string }[];
        if (lotIdRes.length === 0) {
            return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }

        const lotId = lotIdRes[0].lot_id;
        const productName = lotIdRes[0].product_name;

        await sql`DELETE FROM purchase_lot_items WHERE id = ${itemId}`;

        // Update grand total
        await sql`
            UPDATE purchase_lots 
            SET total_cost = (
                SELECT COALESCE(SUM(quantity * unit_cost), 0) 
                FROM purchase_lot_items 
                WHERE lot_id = ${lotId}
            )
            WHERE id = ${lotId}
        `;

        await logActivity(
            'Admin',
            'Delete Item',
            `Deleted item ${productName} from purchase lot`,
            'success',
            'Admin'
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error deleting purchase lot item:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
