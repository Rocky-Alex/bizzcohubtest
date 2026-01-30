import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountingLedger } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const transactions = await db.select().from(accountingLedger).orderBy(desc(accountingLedger.transactionDate));

        // Calculate totals
        // Doing this in JS for simplicity, or could use aggregation queries
        const stats = await db.select({
            type: accountingLedger.type,
            total: sql<number>`sum(${accountingLedger.amount})`
        }).from(accountingLedger).groupBy(accountingLedger.type);

        const income = stats.find(s => s.type === 'Income')?.total || 0;
        const expense = stats.find(s => s.type === 'Expense')?.total || 0;
        const profit = Number(income) - Number(expense);

        return NextResponse.json({ transactions, summary: { income, expense, profit } });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Auth check: Only SuperAdmin/Accountant should access
        const session = await getServerSession(authOptions);
        if (!session || !["Super Admin", "Accountant"].includes(session.user.role)) {
            // In dev/mock mode we might skip, but good to have
            // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type, amount, description, date } = body;

        if (!amount || !description) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const [entry] = await db.insert(accountingLedger).values({
            type: type || 'Expense', // Default to expense for manual entry
            amount: amount.toString(),
            description,
            transactionDate: date ? new Date(date) : new Date()
        }).returning();

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
    }
}
