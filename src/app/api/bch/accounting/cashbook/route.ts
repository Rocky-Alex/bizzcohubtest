import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 100;

        let query = sql`
            SELECT 
                cb.transaction_id, 
                cb.date, 
                cb.voucher_no, 
                cb.transaction_type, 
                cb.debit, 
                cb.credit, 
                cb.description, 
                cb.created_by,
                coa.account_name,
                coa.category,
                l.lot_name
            FROM cash_book cb
            LEFT JOIN chart_of_accounts coa ON cb.account_id = coa.account_id
            LEFT JOIN lots l ON cb.lot_id = l.lot_id
            WHERE 1=1
        `;

        if (startDate) {
            query = sql`${query} AND cb.date >= ${startDate}`;
        }
        if (endDate) {
            query = sql`${query} AND cb.date <= ${endDate}`;
        }

        const transactions = await sql`${query} ORDER BY cb.date DESC, cb.created_at DESC LIMIT ${limit}`;

        return NextResponse.json({ success: true, transactions });
    } catch (e: any) {
        console.error("Fetch cash book failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            date, 
            voucher_no, 
            account_id, 
            transaction_type, 
            amount, 
            lot_id, 
            description, 
            created_by 
        } = body;

        if (!date || !account_id || !transaction_type || amount === undefined) {
            return NextResponse.json({ success: false, error: "Missing mandatory fields" }, { status: 400 });
        }

        const numericAmount = parseFloat(amount || 0);

        // Validation for transaction_type
        if (!['receipt', 'payment'].includes(transaction_type)) {
            return NextResponse.json({ success: false, error: "Invalid transaction type" }, { status: 400 });
        }

        let debit = 0;
        let credit = 0;

        if (transaction_type === 'receipt') {
            debit = numericAmount;  // Cash comes IN (Asset increases via Debit)
            credit = 0;
        } else if (transaction_type === 'payment') {
            debit = 0;
            credit = numericAmount; // Cash goes OUT (Asset decreases via Credit)
        }

        const result = await sql`
            INSERT INTO cash_book (
                date, 
                voucher_no, 
                account_id, 
                transaction_type, 
                debit, 
                credit, 
                lot_id, 
                description, 
                created_by
            ) VALUES (
                ${date}, 
                ${voucher_no || null}, 
                ${account_id}, 
                ${transaction_type}, 
                ${debit}, 
                ${credit}, 
                ${lot_id || null}, 
                ${description || ''}, 
                ${created_by || 'system'}
            ) RETURNING transaction_id
        `;

        return NextResponse.json({ 
            success: true, 
            message: "Cash Book entry recorded successfully",
            transaction_id: result[0]?.transaction_id 
        });
    } catch (e: any) {
        console.error("Post cash book entry failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
