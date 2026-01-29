import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const product = await db.query.products.findFirst({
            where: eq(products.productId, id),
            with: {
                serials: true, // Include serials if needed, or fetch separately
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["Super Admin", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const body = await req.json();

        // Remove fields that shouldn't be updated directly or are ID
        const { productId, createdAt, updatedAt, serials, ...updates } = body;

        // Note: isFeatured is allowed in updates, so no change needed here logic-wise if passed in body.
        // It's covered by ...updates. Explicitly comment for clarity.

        const updated = await db.update(products)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(products.productId, id))
            .returning();

        return NextResponse.json(updated[0]);
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Super Admin") {
            return NextResponse.json({ error: "Unauthorized. Only Super Admin can delete." }, { status: 401 });
        }

        const id = parseInt(params.id);

        // Check for dependencies (Order Items)
        // This is important to prevent orphan records.
        // For now, simple check or try/catch FK constraint error.

        try {
            await db.delete(products).where(eq(products.productId, id));
            return NextResponse.json({ success: true });
        } catch (fkError) {
            return NextResponse.json({ error: "Cannot delete product. It may be part of existing orders." }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
