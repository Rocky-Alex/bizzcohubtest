
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("🧪 Starting Coupons Verification...");

    const { db } = await import("@/db");
    const { coupons } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const testCode = "TEST-SAVE-" + Date.now();

    // 1. Create Coupon (Simulate API logic using direct DB for speed, or fetch if server running)
    // Using direct DB as per previous test pattern
    console.log("1️⃣ Creating Coupon...");
    const [newCoupon] = await db.insert(coupons).values({
        code: testCode,
        discountType: 'percentage',
        discountValue: '20.00',
        minOrderAmount: '50.00',
        usageLimit: 100,
        startDate: new Date(),
        status: 'Active'
    }).returning();

    if (!newCoupon) {
        console.error("❌ Failed to create coupon");
        process.exit(1);
    }
    console.log(`✅ Created Coupon: ${newCoupon.code} (ID: ${newCoupon.couponId})`);

    // 2. Verify Logic
    if (newCoupon.discountType === 'percentage' && parseFloat(newCoupon.discountValue) === 20.00) {
        console.log("✅ Coupon data matches.");
    } else {
        console.error("❌ Coupon data mismatch.");
    }

    // 3. Cleanup (Delete)
    console.log("3️⃣ Deleting Coupon...");
    await db.delete(coupons).where(eq(coupons.couponId, newCoupon.couponId));

    // Double check
    const check = await db.select().from(coupons).where(eq(coupons.couponId, newCoupon.couponId));
    if (check.length === 0) {
        console.log("✅ Coupon deleted successfully.");
    } else {
        console.error("❌ Failed to delete coupon.");
    }
}

main();
