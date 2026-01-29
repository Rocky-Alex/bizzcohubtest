import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const order = await db.query.orders.findFirst({
            where: eq(orders.orderId, id),
            with: {
                customer: true,
                items: {
                    with: {
                        product: true,
                        serial: true
                    }
                }
            }
        });

        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();

        await db.update(orders)
            .set(body) // Be careful with what can be updated
            .where(eq(orders.orderId, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
