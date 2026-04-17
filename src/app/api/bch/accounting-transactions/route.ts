import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query = sql`
            SELECT id, 
                   transaction_date as date, 
                   particular, 
                   notes,
                   dr_cash, 
                   dr_bank, 
                   cr_cash, 
                   cr_bank,
                   created_at
            FROM accounting_transactions
            WHERE 1=1
        `;

        if (startDate) {
            query = sql`${query} AND transaction_date >= ${startDate}`;
        }
        if (endDate) {
            query = sql`${query} AND transaction_date <= ${endDate}`;
        }

        const transactions = await sql`${query} ORDER BY transaction_date DESC, created_at DESC`;

        return NextResponse.json({ success: true, transactions });
    } catch (e: any) {
        console.error("Fetch transactions failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, particular, amount, type, account, notes, sessionId, accountantName } = body;

        const val = parseFloat(amount || 0);
        let dr_cash = 0, dr_bank = 0, cr_cash = 0, cr_bank = 0;

        if (type === 'income') {
            if (account === 'cash') dr_cash = val; else dr_bank = val;
        } else {
            if (account === 'cash') cr_cash = val; else cr_bank = val;
        }

        const result = await sql`
            INSERT INTO accounting_transactions (
                transaction_date, particular, notes, dr_cash, dr_bank, cr_cash, cr_bank, session_id, created_by
            ) VALUES (
                ${date}, ${particular}, ${notes}, ${dr_cash}, ${dr_bank}, ${cr_cash}, ${cr_bank}, ${sessionId}, ${accountantName}
            ) RETURNING id
        `;

        return NextResponse.json({ 
            success: true, 
            message: "Transaction recorded successfully",
            id: result[0]?.id 
        });
    } catch (e: any) {
        console.error("Post transaction failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
