import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
    try {
        // Ensure tables exist
        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lots (
                id SERIAL PRIMARY KEY,
                lot_number TEXT,
                supplier_name TEXT NOT NULL,
                supplier_id INTEGER,
                invoice_date DATE,
                invoice_number TEXT,
                notes TEXT,
                total_cost DECIMAL(12, 2) DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lot_items (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id) ON DELETE CASCADE,
                product_type TEXT,
                product_name TEXT NOT NULL,
                brand TEXT,
                series TEXT,
                model TEXT,
                processor TEXT,
                processor_gen TEXT,
                sku TEXT,
                quantity INTEGER DEFAULT 1,
                unit_cost DECIMAL(12, 2) DEFAULT 0,
                qc_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 1. Total Spend (Overall)
        const totalSpendRes = await sql`SELECT SUM(total_cost) as total FROM purchase_lots` as unknown as { total: string | null }[];
        const totalSpend = parseFloat(totalSpendRes[0]?.total || '0');

        // 2. Spend this month
        const monthlySpendRes = await sql`
            SELECT SUM(total_cost) as total 
            FROM purchase_lots 
            WHERE invoice_date >= DATE_TRUNC('month', CURRENT_DATE)
        ` as unknown as { total: string | null }[];
        const monthlySpend = parseFloat(monthlySpendRes[0]?.total || '0');

        // 3. Total Lots
        const totalLotsRes = await sql`SELECT COUNT(*) as count FROM purchase_lots` as unknown as { count: string }[];
        const totalLots = parseInt(totalLotsRes[0]?.count || '0');

        // 4. Total Items Purchased
        const totalItemsRes = await sql`SELECT SUM(quantity) as count FROM purchase_lot_items` as unknown as { count: string | null }[];
        const totalItems = parseInt(totalItemsRes[0]?.count || '0');

        // 5. Items pending QC
        const pendingQCRes = await sql`
            SELECT SUM(quantity - qc_count) as count 
            FROM purchase_lot_items 
            WHERE quantity > qc_count
        ` as unknown as { count: string | null }[];
        const pendingQC = parseInt(pendingQCRes[0]?.count || '0');

        // 6. Finished QC
        const finishedQCRes = await sql`
            SELECT SUM(qc_count) as count 
            FROM purchase_lot_items
        ` as unknown as { count: string | null }[];
        const finishedQC = parseInt(finishedQCRes[0]?.count || '0');

        // 6. Top Suppliers (by spend)
        const topSuppliers = await sql`
            SELECT supplier_name as name, SUM(total_cost) as total
            FROM purchase_lots
            GROUP BY supplier_name
            ORDER BY total DESC
            LIMIT 5
        ` as unknown as any[];

        // 7. Recent Lots
        const recentLots = await sql`
            SELECT id, lot_number, supplier_name, total_cost, invoice_date, status
            FROM purchase_lots
            ORDER BY created_at DESC
            LIMIT 5
        ` as unknown as any[];

        // 8. Trends (simplified: compare this month to last month)
        const lastMonthSpendRes = await sql`
            SELECT SUM(total_cost) as total 
            FROM purchase_lots 
            WHERE invoice_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            AND invoice_date < DATE_TRUNC('month', CURRENT_DATE)
        ` as unknown as { total: string | null }[];
        const lastMonthSpend = parseFloat(lastMonthSpendRes[0]?.total || '0');
        const spendTrend = lastMonthSpend === 0 ? 0 : ((monthlySpend - lastMonthSpend) / lastMonthSpend) * 100;

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
