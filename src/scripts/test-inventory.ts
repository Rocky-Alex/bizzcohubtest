import * as dotenv from 'dotenv';
dotenv.config();

// Remove static imports that depend on env vars
// import { db } from "@/db";
// import { products, productSerials } from "@/db/schema";
// import { eq } from "drizzle-orm";

// Mocking API calls by directly using DB for verification script to save time setting up fetch context
// or I can use fetch if I run next dev. But direct DB is faster for immediate logic verification.

async function main() {
    console.log("🧪 Starting Inventory Verification...");

    // Dynamic imports
    const { db } = await import("@/db");
    const { products, productSerials } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const testSku = "TEST-LAPTOP-" + Date.now();

    // 1. Create Product
    console.log("1️⃣ Creating Product...");
    const [newProduct] = await db.insert(products).values({
        name: "Test Laptop X1",
        sku: testSku,
        category: "Laptops",
        buyPrice: "800.00",
        sellPrice: "1200.00",
        stockQuantity: 0,
        description: "A test unit",
    }).returning();

    if (!newProduct) {
        console.error("❌ Failed to create product");
        process.exit(1);
    }
    console.log(`✅ Created Product: ${newProduct.name} (ID: ${newProduct.productId})`);

    // 2. Add Serials
    console.log("2️⃣ Adding Serials...");
    const serials = ["SN-001", "SN-002", "SN-003"].map(s => s + "-" + Date.now());

    try {
        const insertedSerials = await db.insert(productSerials).values(
            serials.map(sn => ({
                productId: newProduct.productId,
                serialNumber: sn,
                status: "Available" as const
            }))
        ).returning();
        console.log(`✅ Added ${insertedSerials.length} serials.`);
    } catch (e) {
        console.error("❌ Failed to add serials", e);
    }

    // 3. Verify Retrieval
    const storedSerials = await db.query.productSerials.findMany({
        where: eq(productSerials.productId, newProduct.productId)
    });

    if (storedSerials.length === 3) {
        console.log("✅ Verified Serial Count matches.");
    } else {
        console.error("❌ Serial count mismatch.");
    }

    // 4. Cleanup
    console.log("🧹 Cleaning up...");
    await db.delete(productSerials).where(eq(productSerials.productId, newProduct.productId));
    await db.delete(products).where(eq(products.productId, newProduct.productId));
    console.log("✅ Cleanup complete.");
}

main();
