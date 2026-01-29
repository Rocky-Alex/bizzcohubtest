import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, id)
        });

        if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

        const customerOrders = await db.query.orders.findMany({
            where: eq(orders.customerId, id),
            orderBy: [desc(orders.createdAt)]
        });

        return NextResponse.json({ customer, orders: customerOrders });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
    }
}
