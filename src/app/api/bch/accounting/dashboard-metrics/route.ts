import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    noStore(); // Completely disable Data Cache for this request
    try {
        const today = new Date().toISOString().split('T')[0];

        // Overall Cash Calculation
        // Receipts log as Debit, Payments log as Credit.
        // Total Cash = Total Debits - Total Credits
        const totalRes = await sql`
            SELECT 
                COALESCE(SUM(debit), 0) as sum_debit, 
                COALESCE(SUM(credit), 0) as sum_credit 
            FROM cash_book
        `;
        
        const totalCash = parseFloat(totalRes[0].sum_debit) - parseFloat(totalRes[0].sum_credit);

        // Today's specific metrics using Postgres Native Time to prevent UTC desync
        const todayRes = await sql`
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type = 'receipt' THEN debit ELSE 0 END), 0) as today_receipts,
                COALESCE(SUM(CASE WHEN transaction_type = 'payment' THEN credit ELSE 0 END), 0) as today_payments
            FROM cash_book
            WHERE date::date = CURRENT_DATE
        `;
        
        const todayReceipts = parseFloat(todayRes[0].today_receipts);
        const todayPayments = parseFloat(todayRes[0].today_payments);
        const netBalance = todayReceipts - todayPayments;

        return NextResponse.json({ 
            success: true, 
            data: {
                totalCash: totalCash,
                todayReceipts: todayReceipts,
                todayPayments: todayPayments,
                netBalance: netBalance
            } 
        });

    } catch (e: any) {
        console.error("Fetch dashboard metrics failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
