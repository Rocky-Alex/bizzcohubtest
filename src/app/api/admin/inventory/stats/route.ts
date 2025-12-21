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
                -- Total Products (Grand Total of all items)
                COUNT(*) as total_products,
                
                -- Total Laptops (specific check)
                COUNT(CASE 
                    WHEN type = 'laptop' 
                    OR category ILIKE '%Laptop%' 
                    OR category ILIKE '%MacBook%' 
                    THEN 1 
                END) as total_laptops,

                -- Total Accessories
                COUNT(CASE 
                    WHEN type = 'accessory' 
                    OR (type IS NULL AND category = ANY(${accessoryCategories})) 
                    THEN 1 
                END) as total_accessories,
                
                -- Low Stock
                COUNT(CASE WHEN COALESCE(stock_quantity, 0) < 10 THEN 1 END) as low_stock,
                
                -- Total Value
                SUM(COALESCE(base_price, 0) * COALESCE(stock_quantity, 0)) as total_value,

                -- Trends (simplified for performance/clarity: just using total added this month vs last)
                COUNT(CASE WHEN date_added >= date_trunc('month', CURRENT_DATE) THEN 1 END) as items_curr_month,
                COUNT(CASE 
                    WHEN date_added >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                    AND date_added < date_trunc('month', CURRENT_DATE) 
                    THEN 1 
                END) as items_prev_month

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

        // Calculate specific trends if needed, but for now relying on general input/output trends 
        // to map to the UI trends objects.
        const generalTrend = calcTrend(s.items_curr_month, s.items_prev_month);

        const result = {
            totalProducts: Number(s.total_products || 0),
            totalLaptops: Number(s.total_laptops || 0),
            totalAccessories: Number(s.total_accessories || 0),
            lowStockItems: Number(s.low_stock || 0),
            totalValue: Number(s.total_value || 0),
            trends: {
                products: generalTrend,
                laptops: 0, // Placeholder or specific calc if requested
                accessories: 0,
                stock: 0,
                value: 0
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
