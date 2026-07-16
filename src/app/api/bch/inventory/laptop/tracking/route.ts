import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const barcode = searchParams.get('barcode');
        const sku = searchParams.get('sku');

        if (!barcode && !sku) {
            // General tracking / activity log for all inventory changes
            const generalLogs = await sql`
                SELECT * FROM activity_logs
                WHERE action ILIKE '%Inventory%' OR action ILIKE '%QC%'
                ORDER BY timestamp DESC
                LIMIT 50
            ` as unknown as any[];

            return NextResponse.json({
                success: true,
                logs: generalLogs
            });
        }

        const targetCode = barcode || sku;
        
        // 1. Fetch current inventory status
        const itemResult = await sql`
            SELECT * FROM master_inventory
            WHERE barcode = ${targetCode} OR sku = ${targetCode}
            LIMIT 1
        ` as unknown as any[];

        if (itemResult.length === 0) {
            return NextResponse.json({ success: false, error: 'Product not found in inventory' }, { status: 404 });
        }

        const item = itemResult[0];

        // 2. Fetch sales history from sale_out
        const salesResult = await sql`
            SELECT * FROM sale_out
            WHERE barcode = ${item.barcode} OR barcode = ${item.sku}
            ORDER BY sold_at DESC
        ` as unknown as any[];

        // 3. Fetch activity logs mentioning this item
        const searchPattern = `%${item.barcode}%`;
        const searchPatternId = `%ID: ${item.id}%`;
        const searchPatternSku = item.sku ? `%${item.sku}%` : '%____%';

        const activityLogs = await sql`
            SELECT * FROM activity_logs
            WHERE 
                (details ILIKE ${searchPattern} OR details ILIKE ${searchPatternId} OR details ILIKE ${searchPatternSku})
                OR (action ILIKE '%Inventory%' AND details ILIKE ${'%' + item.product_name + '%'})
            ORDER BY timestamp DESC
        ` as unknown as any[];

        // 4. Construct a unified chronologically ordered timeline
        const timeline: any[] = [];

        // Add creation event
        timeline.push({
            type: 'creation',
            title: 'Inventory Check-in (QC Passed)',
            description: `Product checked into master inventory with barcode ${item.barcode}${item.lot_number ? ` from Purchase Lot ${item.lot_number}` : ''}.`,
            timestamp: item.created_at,
            user: 'System/QC Team',
            status: 'success'
        });

        // Add updates from activity logs
        activityLogs.forEach((log: any) => {
            timeline.push({
                type: 'log',
                title: log.action,
                description: log.details,
                timestamp: log.timestamp,
                user: log.user_name,
                status: log.status
            });
        });

        // Add sales events
        salesResult.forEach((sale: any) => {
            timeline.push({
                type: 'sale',
                title: 'Item Sold / Shipped',
                description: `Sold to customer. Status: ${sale.status || 'Completed'}. Quantity: ${sale.quantity || 1}.`,
                timestamp: sale.sold_at,
                user: 'Billing Portal',
                status: 'success'
            });

            if (sale.returned_at) {
                timeline.push({
                    type: 'return',
                    title: 'Item Returned',
                    description: `Returned by customer. Return status: ${sale.status || 'Restocked'}. Reason: Returned stock.`,
                    timestamp: sale.returned_at,
                    user: 'Sales Returns',
                    status: 'warning'
                });
            }
        });

        // Sort timeline by timestamp ascending
        timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return NextResponse.json({
            success: true,
            product: item,
            timeline
        });

    } catch (error: unknown) {
        console.error('Error fetching tracking details:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}
