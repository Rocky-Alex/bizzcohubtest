import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
    try {
        // 1. Total Spend (Overall - excluding Archived)
        const totalSpendRes = await sql`
            SELECT SUM(total_cost) as total 
            FROM purchase_lots 
            WHERE status != 'Archived'
        ` as unknown as { total: string | null }[];
        const totalSpend = parseFloat(totalSpendRes[0]?.total || '0');

        // 2. Spend this month
        const monthlySpendRes = await sql`
            SELECT SUM(total_cost) as total 
            FROM purchase_lots 
            WHERE status != 'Archived' 
            AND invoice_date >= DATE_TRUNC('month', CURRENT_DATE)
        ` as unknown as { total: string | null }[];
        const monthlySpend = parseFloat(monthlySpendRes[0]?.total || '0');

        // 3. Total Lots
        const totalLotsRes = await sql`SELECT COUNT(*) as count FROM purchase_lots WHERE status != 'Archived'` as unknown as { count: string }[];
        const totalLots = parseInt(totalLotsRes[0]?.count || '0');

        // 4. Total Items Purchased
        const totalItemsRes = await sql`
            SELECT SUM(pli.quantity) as count 
            FROM purchase_lot_items pli
            JOIN purchase_lots pl ON pli.lot_id = pl.id
            WHERE pl.status != 'Archived'
        ` as unknown as { count: string | null }[];
        const totalItems = parseInt(totalItemsRes[0]?.count || '0');

        // 5. Items pending QC
        const pendingQCRes = await sql`
            SELECT SUM(pli.quantity - pli.qc_count) as count 
            FROM purchase_lot_items pli
            JOIN purchase_lots pl ON pli.lot_id = pl.id
            WHERE pl.status != 'Archived' AND pli.quantity > pli.qc_count
        ` as unknown as { count: string | null }[];
        const pendingQC = parseInt(pendingQCRes[0]?.count || '0');

        // 6. Finished QC
        const finishedQCRes = await sql`
            SELECT SUM(pli.qc_count) as count 
            FROM purchase_lot_items pli
            JOIN purchase_lots pl ON pli.lot_id = pl.id
            WHERE pl.status != 'Archived'
        ` as unknown as { count: string | null }[];
        const finishedQC = parseInt(finishedQCRes[0]?.count || '0');

        // 7. Top Suppliers (by spend)
        const topSuppliers = await sql`
            SELECT supplier_name as name, SUM(total_cost) as total
            FROM purchase_lots
            WHERE status != 'Archived'
            GROUP BY supplier_name
            ORDER BY total DESC
            LIMIT 5
        ` as unknown as any[];

        // 8. Recent Lots
        const recentLots = await sql`
            SELECT id, lot_number, supplier_name, total_cost, invoice_date, status
            FROM purchase_lots
            WHERE status != 'Archived'
            ORDER BY created_at DESC
            LIMIT 5
        ` as unknown as any[];

        // 9. Trends (simplified: compare this month to last month)
        const lastMonthSpendRes = await sql`
            SELECT SUM(total_cost) as total 
            FROM purchase_lots 
            WHERE status != 'Archived'
            AND invoice_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            AND invoice_date < DATE_TRUNC('month', CURRENT_DATE)
        ` as unknown as { total: string | null }[];
        const lastMonthSpend = parseFloat(lastMonthSpendRes[0]?.total || '0');
        const spendTrend = lastMonthSpend === 0 ? (monthlySpend > 0 ? 100 : 0) : ((monthlySpend - lastMonthSpend) / lastMonthSpend) * 100;

        return NextResponse.json({
            success: true,
            totalSpend,
            monthlySpend,
            totalLots,
            totalItems,
            pendingQC,
            finishedQC,
            topSuppliers,
            recentLots,
            lastUpdated: new Date().toISOString(),
            trends: {
                spend: spendTrend
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching purchase stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
