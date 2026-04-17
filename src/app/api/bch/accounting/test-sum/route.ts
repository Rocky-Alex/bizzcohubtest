import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const totalRes = await sql`
            SELECT 
                COALESCE(SUM(debit), 0) as sum_debit, 
                COALESCE(SUM(credit), 0) as sum_credit 
            FROM cash_book
        `;
        
        const totalCash = parseFloat(totalRes[0].sum_debit) - parseFloat(totalRes[0].sum_credit);

        return NextResponse.json({ totalRes, totalCash });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
