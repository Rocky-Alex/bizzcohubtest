import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, customers, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let query = db.query.orders.findMany({
            with: {
                customer: true,
                items: true
            },
            orderBy: [desc(orders.createdAt)],
            ...(status && status !== 'All' ? {
                where: eq(orders.orderStatus, status as any)
            } : {})
        });

        const data = await query;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId, items, status } = body;
        // items: { productId, quantity, unitPrice, serialId? }[]

        if (!customerId || !items || items.length === 0) {
            return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
        }

        // Calculate total
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

        // Transaction
        const newOrder = await db.transaction(async (tx) => {
            // 1. Create Order
            const [order] = await tx.insert(orders).values({
                customerId,
                totalAmount: totalAmount.toString(),
                orderStatus: status || 'Pending',
                paymentStatus: 'Unpaid'
            }).returning();

            // 2. Create Order Items
            for (const item of items) {
                await tx.insert(orderItems).values({
                    orderId: order.orderId,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice.toString(),
                    serialId: item.serialId || null
                });

                // 3. Update Stock (Simple decrement)
                // Ideally this should check stock availability first
                // const [product] = await tx.select().from(products).where(eq(products.productId, item.productId));
                // await tx.update(products).set({ stockQuantity: product.stockQuantity - item.quantity }).where(...)
            }

            return order;
        });

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
