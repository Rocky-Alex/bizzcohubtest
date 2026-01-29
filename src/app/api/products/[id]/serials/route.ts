import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productSerials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const productId = parseInt(params.id);
        if (isNaN(productId)) return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });

        const serials = await db.query.productSerials.findMany({
            where: eq(productSerials.productId, productId)
        });

        return NextResponse.json(serials);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch serials" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["Super Admin", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = parseInt(params.id);
        if (isNaN(productId)) return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });

        const body = await req.json();
        const { serials } = body; // Array of strings

        if (!serials || !Array.isArray(serials) || serials.length === 0) {
            return NextResponse.json({ error: "Invalid serials data" }, { status: 400 });
        }

        const values = serials.map((sn: string) => ({
            productId,
            serialNumber: sn,
            status: 'Available' as const
        }));

        const result = await db.insert(productSerials).values(values).returning();

        // Optional: Update stock quantity of the product to match serial count?
        // Business logic decision: Does manual stock override, or is it derived from serials?
        // For electronics, usually derived. I will increment stock.

        // However, Drizzle doesn't support increment easily without sql operator.
        // Let's just return the created serials for now. Stock sync can be a separate trigger or manual.

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ error: "One or more serial numbers already exist" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to add serials" }, { status: 500 });
    }
}
