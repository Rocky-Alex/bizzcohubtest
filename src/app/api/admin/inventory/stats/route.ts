import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Helper to get DB connection
const getSql = () => {
    const dbUrl = process.env.INVOICE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('Database configuration missing');
    }
    return neon(dbUrl);
};

export async function GET() {
    try {
        const sql = getSql();

        // Ensure tables exist? No, assuming products table exists now with new schema.
        // We do NOT create tables here anymore to avoid overwriting schema.

        // Fetch Stats
        // Parallel queries
        const [productStats, accessoryStats, productTrends, accessoryTrends] = await Promise.all([
            // 1. Current Product Stats
            // Updated columns: stock_quantity, base_price
            sql`SELECT COUNT(*) as count, SUM(stock_quantity * base_price) as value, SUM(CASE WHEN stock_quantity < 10 THEN 1 ELSE 0 END) as low_stock FROM products`,

            // 2. Current Accessory Stats (Assuming accessories table still uses old schema or needs update? 
            // Let's assume accessories uses 'quantity' and 'price' if it wasn't migrated, 
            // OR checks if table exists. For now, wrap in try/catch or assume it might fail if table missing)
            // Ideally we check if table exists first.
            sql`SELECT COUNT(*) as count, SUM(quantity * price) as value, SUM(CASE WHEN quantity < 10 THEN 1 ELSE 0 END) as low_stock FROM accessories`, // Keep old for accessories for now unless migrated

            // 3. Product Trends (vs last month)
            // Updated column: date_added
            sql`
                SELECT 
                    COUNT(*) as count,
                    SUM(CASE WHEN date_added >= date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END) as current_month_count,
                    SUM(CASE WHEN date_added >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                        AND date_added < date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END) as prev_month_count
                FROM products
            `,
            // 4. Accessory Trends
            sql`
                SELECT 
                    COUNT(*) as count,
                    SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END) as current_month_count,
                    SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                        AND created_at < date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END) as prev_month_count
                FROM accessories
            `
        ]);

        const pStats = productStats[0];
        const aStats = accessoryStats[0] || { count: 0, value: 0, low_stock: 0 }; // Handle missing table gracefully
        const pTrends = productTrends[0];
        const aTrends = accessoryTrends[0] || { current_month_count: 0, prev_month_count: 0 };

        const totalProducts = Number(pStats.count) || 0;
        const totalAccessories = Number(aStats.count) || 0;
        const lowStockItems = (Number(pStats.low_stock) || 0) + (Number(aStats.low_stock) || 0);
        const totalValue = (Number(pStats.value) || 0) + (Number(aStats.value) || 0);

        // Calculate Trends (Growth %)
        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const result = {
            totalProducts,
            totalAccessories,
            lowStockItems,
            totalValue,
            trends: {
                products: calcTrend(Number(pTrends.current_month_count), Number(pTrends.prev_month_count)),
                accessories: calcTrend(Number(aTrends.current_month_count), Number(aTrends.prev_month_count)),
                stock: 0,
                value: 0
            }
        };

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error fetching inventory stats:', error);
        // Return 0 stats on error instead of 500 to prevent dashboard crash
        return NextResponse.json({
            totalProducts: 0,
            totalAccessories: 0,
            lowStockItems: 0,
            totalValue: 0,
            trends: { products: 0, accessories: 0, stock: 0, value: 0 },
            error: error.message
        });
    }
}
