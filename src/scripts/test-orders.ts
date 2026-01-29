
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("🧪 Starting Order Management Verification...");

    // Dynamic imports
    const { db } = await import("@/db");
    const { customers, orders, orderItems, products } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    // 1. Create Customer
    console.log("1️⃣ Creating Customer...");
    const [customer] = await db.insert(customers).values({
        name: "Test Customer " + Date.now(),
        email: `test${Date.now()}@example.com`,
        phone: "555-0199",
        address: "123 Tech Lane"
    }).returning();
    console.log(`✅ Created Customer: ${customer.name} (ID: ${customer.customerId})`);

    // 2. Get a Product (or create one if empty)
    let product = await db.query.products.findFirst();
    if (!product) {
        console.log("⚠️ No products found, creating one...");
        const [newProd] = await db.insert(products).values({
            name: "Fallback Laptop",
            sku: "FB-001-" + Date.now(),
            category: "Laptops",
            buyPrice: "500",
            sellPrice: "1000",
            stockQuantity: 10
        }).returning();
        product = newProd;
    }
    console.log(`info: Using product ID ${product.productId}`);

    // 3. Create Order
    console.log("2️⃣ Creating Order...");
    const [order] = await db.insert(orders).values({
        customerId: customer.customerId,
        totalAmount: (parseFloat(product.sellPrice) * 2).toString(),
        orderStatus: 'Pending',
        paymentStatus: 'Unpaid'
    }).returning();

    await db.insert(orderItems).values({
        orderId: order.orderId,
        productId: product.productId,
        quantity: 2,
        unitPrice: product.sellPrice
    });

    console.log(`✅ Created Order #${order.orderId} for $${order.totalAmount}`);

    // 4. Verify Retrieval
    const retrieved = await db.query.orders.findFirst({
        where: eq(orders.orderId, order.orderId),
        with: { items: true }
    });

    if (retrieved && retrieved.items.length === 1) {
        console.log("✅ Verified Order Items.");
    } else {
        console.error("❌ Order items mismatch.");
    }

    // 5. Cleanup
    console.log("🧹 Cleaning up...");
    await db.delete(orderItems).where(eq(orderItems.orderId, order.orderId));
    await db.delete(orders).where(eq(orders.orderId, order.orderId));
    await db.delete(customers).where(eq(customers.customerId, customer.customerId));
    console.log("✅ Cleanup complete.");
}

main();
