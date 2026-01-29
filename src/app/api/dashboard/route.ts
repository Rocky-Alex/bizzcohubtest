import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, customers, activityLogs } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // 1. KPI Stats
        const [customerCount] = await db.select({ count: count() }).from(customers);
        const [productCount] = await db.select({ count: count() }).from(products);
        const [orderCount] = await db.select({ count: count() }).from(orders);

        // Low stock
        const lowStockProducts = await db.select({ count: count() })
            .from(products)
            .where(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`);

        // Revenue (All time - roughly)
        const revenueResult = await db.select({
            total: sql<number>`sum(${orders.totalAmount})`
        }).from(orders).where(eq(orders.paymentStatus, 'Paid'));
        const totalRevenue = revenueResult[0]?.total || 0;

        // 2. Recent Orders
        const recentOrders = await db.query.orders.findMany({
            limit: 5,
            orderBy: [desc(orders.createdAt)],
            with: { customer: true }
        });

        // 3. Sales Chart (Last 7 days - Simplified)
        // Group by date
        const salesChart = await db.execute(sql`
            SELECT DATE(created_at) as date, SUM(total_amount) as total
            FROM orders
            WHERE payment_status = 'Paid'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) DESC
            LIMIT 7
        `);

        return NextResponse.json({
            stats: {
                totalCustomers: customerCount.count,
                totalProducts: productCount.count,
                totalOrders: orderCount.count,
                lowStock: lowStockProducts[0]?.count || 0,
                revenue: totalRevenue
            },
            recentOrders,
            salesChart: salesChart.rows || [] // Adapt based on driver return type
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}
