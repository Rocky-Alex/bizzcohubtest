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

        // Check if products table exists
        try {
            await sql`SELECT 1 FROM products LIMIT 1`;
        } catch (e) {
            // If table doesn't exist, return empty stats
            return NextResponse.json({
                totalProducts: 0,
                totalAccessories: 0,
                lowStockItems: 0,
                totalValue: 0,
                trends: { products: 0, accessories: 0, stock: 0, value: 0 }
            });
        }

        // Define categories
        const accessoryCategories = ['Accessories', 'Monitor', 'Component'];
        // All others count as "Products" (Systems)

        const stats = await sql`
            SELECT 
                -- Total Products (Systems: type='system' or 'laptop')
                COUNT(CASE WHEN type = 'system' OR type = 'laptop' OR (type IS NULL AND category != ALL(${accessoryCategories})) THEN 1 END) as total_products,
                
                -- Total Accessories (type='accessory' or category match)
                COUNT(CASE WHEN type = 'accessory' OR (type IS NULL AND category = ANY(${accessoryCategories})) THEN 1 END) as total_accessories,
                
                -- Low Stock (Global)
                COUNT(CASE WHEN COALESCE(stock_quantity, stock, quantity, 0) < 10 THEN 1 END) as low_stock,
                
                -- Total Value (Global: price * stock)
                SUM(COALESCE(base_price, price, 0) * COALESCE(stock_quantity, stock, quantity, 0)) as total_value,

                -- Trends (Current Month vs Previous Month for creation)
                COUNT(CASE WHEN COALESCE(date_added, created_at) >= date_trunc('month', CURRENT_DATE) AND (type = 'system' OR type = 'laptop' OR (type IS NULL AND category != ALL(${accessoryCategories}))) THEN 1 END) as products_curr_month,
                
                COUNT(CASE WHEN COALESCE(date_added, created_at) >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND COALESCE(date_added, created_at) < date_trunc('month', CURRENT_DATE) AND (type = 'system' OR type = 'laptop' OR (type IS NULL AND category != ALL(${accessoryCategories}))) THEN 1 END) as products_prev_month,
                
                COUNT(CASE WHEN COALESCE(date_added, created_at) >= date_trunc('month', CURRENT_DATE) AND (type = 'accessory' OR (type IS NULL AND category = ANY(${accessoryCategories}))) THEN 1 END) as accessories_curr_month,
                
                COUNT(CASE WHEN COALESCE(date_added, created_at) >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND COALESCE(date_added, created_at) < date_trunc('month', CURRENT_DATE) AND (type = 'accessory' OR (type IS NULL AND category = ANY(${accessoryCategories}))) THEN 1 END) as accessories_prev_month

            FROM products
        `;

        const s = stats[0];

        // Helper for percentage growth
        const calcTrend = (curr: number, prev: number) => {
            curr = Number(curr || 0);
            prev = Number(prev || 0);
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const result = {
            totalProducts: Number(s.total_products || 0),
            totalAccessories: Number(s.total_accessories || 0),
            lowStockItems: Number(s.low_stock || 0),
            totalValue: Number(s.total_value || 0),
            trends: {
                products: calcTrend(s.products_curr_month, s.products_prev_month),
                accessories: calcTrend(s.accessories_curr_month, s.accessories_prev_month),
                stock: 0, // Placeholder
                value: 0  // Placeholder
            }
        };

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error fetching inventory stats:', error);
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
