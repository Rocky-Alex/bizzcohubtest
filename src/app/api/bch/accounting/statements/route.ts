import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const report = searchParams.get('report'); // 'trial_balance', 'ledger', 'pnl'

        if (report === 'trial_balance') {
            const data = await sql`
                SELECT 
                    coa.account_id,
                    coa.account_name,
                    coa.account_type,
                    coa.category,
                    COALESCE(SUM(cb.debit), 0) as total_debit,
                    COALESCE(SUM(cb.credit), 0) as total_credit
                FROM chart_of_accounts coa
                JOIN cash_book cb ON coa.account_id = cb.account_id
                GROUP BY coa.account_id, coa.account_name, coa.account_type, coa.category
                ORDER BY coa.account_type, coa.account_name
            `;
            return NextResponse.json({ success: true, data });
        }

        if (report === 'pnl') {
            const data = await sql`
                SELECT 
                    coa.category,
                    coa.account_type,
                    coa.account_name,
                    COALESCE(SUM(cb.debit), 0) as total_debit,
                    COALESCE(SUM(cb.credit), 0) as total_credit
                FROM chart_of_accounts coa
                JOIN cash_book cb ON coa.account_id = cb.account_id
                WHERE coa.account_type IN ('income', 'expense')
                GROUP BY coa.category, coa.account_type, coa.account_name
                ORDER BY coa.account_type DESC, coa.category
            `;
            return NextResponse.json({ success: true, data });
        }

        if (report === 'ledger') {
            const accountId = searchParams.get('account_id');
            if (!accountId) {
                return NextResponse.json({ success: false, error: 'account_id required.' }, { status: 400 });
            }
            const data = await sql`
                SELECT date, voucher_no, description, transaction_type, debit, credit
                FROM cash_book
                WHERE account_id = ${accountId}
                ORDER BY date ASC, created_at ASC
            `;
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ success: false, error: 'Invalid report requested' }, { status: 400 });

    } catch (e: any) {
        console.error("Fetch statement failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
