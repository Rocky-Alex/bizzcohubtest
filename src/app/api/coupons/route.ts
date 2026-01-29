import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
    try {
        const _coupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
        return NextResponse.json(_coupons);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["Super Admin", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { code, discountType, discountValue, minOrderAmount, startDate, endDate, usageLimit } = body;

        if (!code || !discountType || !discountValue) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newCoupon = await db.insert(coupons).values({
            code: code.toUpperCase(),
            discountType,
            discountValue: discountValue.toString(),
            minPurchase: minOrderAmount ? minOrderAmount.toString() : '0',
            startDate: startDate ? new Date(startDate) : new Date(),
            expiryDate: endDate ? new Date(endDate) : null,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            status: 'active'
        }).returning();

        return NextResponse.json(newCoupon[0], { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
    }
}
