import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lotId = searchParams.get('lot_id');

        if (!lotId) {
            // Aggregate all lots
            const data = await sql`
                SELECT 
                    l.lot_id, 
                    l.lot_name, 
                    l.total_units,
                    COALESCE(SUM(cb.debit), 0) as total_expense
                FROM lots l
                LEFT JOIN cash_book cb ON l.lot_id = cb.lot_id AND cb.transaction_type = 'payment'
                GROUP BY l.lot_id, l.lot_name, l.total_units
                ORDER BY l.created_at DESC
            `;
            return NextResponse.json({ success: true, data });
        }

        // Specific lot details
        const details = await sql`
            SELECT cb.date, cb.voucher_no, cb.description, cb.debit as expense_amount, coa.account_name
            FROM cash_book cb
            JOIN chart_of_accounts coa ON cb.account_id = coa.account_id
            WHERE cb.lot_id = ${lotId} AND cb.transaction_type = 'payment'
            ORDER BY cb.date DESC, cb.created_at DESC
        `;

        const lotInfo = await sql`SELECT * FROM lots WHERE lot_id = ${lotId}`;

        return NextResponse.json({ 
            success: true, 
            data: {
                lot: lotInfo[0],
                expenses: details
            }
        });

    } catch (e: any) {
        console.error("Fetch lots report failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
