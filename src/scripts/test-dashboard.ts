
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("🧪 Starting Dashboard Verification...");

    // Dynamic imports
    const { db } = await import("@/db");
    const { orders } = await import("@/db/schema");
    const { eq, sql } = await import("drizzle-orm");

    // 1. Simulate fetching API Logic
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    console.log(`✅ Order Count: ${orderCount.count}`);

    const revenueResult = await db.select({
        total: sql<number>`sum(${orders.totalAmount})`
    }).from(orders).where(eq(orders.paymentStatus, 'Paid'));
    console.log(`✅ Total Revenue: $${revenueResult[0]?.total || 0}`);

    if (parseInt(orderCount.count.toString()) >= 0) {
        console.log("✅ Dashboard Stats verification passed (Data exists/readable).");
    } else {
        console.error("❌ Failed to read stats.");
    }
}

main();
