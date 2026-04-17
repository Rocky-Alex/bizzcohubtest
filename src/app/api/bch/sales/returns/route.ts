import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Fetch all items currently in Sales Return Staging (Pending QC)
        const items = await sql`
            SELECT * FROM sales_return_inventory 
            WHERE status != 'QC Passed'
            ORDER BY created_at DESC
        ` as unknown as any[];

        return NextResponse.json({ success: true, items });
    } catch (error: any) {
        console.error('Error fetching return inventory:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, reason, returnedBy, condition } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ success: false, error: "Items array is required" }, { status: 400 });
        }

        const results = [];

        for (const item of items) {
            // 1. Fetch details from sale_out to ensure it exists
            const saleQuery = await sql`
                SELECT * FROM sale_out 
                WHERE barcode = ${item.barcode} OR master_inventory_id = ${item.id}
                LIMIT 1
            ` as unknown as any[];

            if (!saleQuery || saleQuery.length === 0) {
                results.push({ barcode: item.barcode, success: false, error: "Item not found in Sales records" });
                continue;
            }

            const sale = saleQuery[0];

            // 2. Insert into sales_return_inventory
            await sql`
                INSERT INTO sales_return_inventory (
                    master_inventory_id,
                    barcode,
                    sku,
                    lot_number,
                    product_name,
                    brand,
                    model,
                    series,
                    qty_returned,
                    return_reason,
                    returned_by,
                    condition_at_return,
                    status
                ) VALUES (
                    ${sale.master_inventory_id},
                    ${sale.barcode},
                    null,
                    ${sale.lot_number},
                    ${sale.product_name},
                    ${sale.brand},
                    ${sale.model},
                    ${sale.series},
                    1,
                    ${reason || 'No reason provided'},
                    ${returnedBy || 'Admin'},
                    ${condition || 'Unknown'},
                    'Pending QC'
                )
            `;

            await logActivity(
                'Admin',
                'Sales Return',
                `Item ${sale.barcode} (${sale.product_name}) moved to Return Staging for QC`,
                'success',
                returnedBy || 'Admin'
            );

            results.push({ barcode: sale.barcode, success: true });
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Error processing return:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
