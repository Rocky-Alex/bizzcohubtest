import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type');

        if (type === 'accounts') {
            const accounts = await sql`
                SELECT account_id, account_name, account_type, category 
                FROM chart_of_accounts
                ORDER BY category, account_name
            `;
            return NextResponse.json({ success: true, data: accounts });
        }

        if (type === 'lots') {
            const lots = await sql`
                SELECT lot_id, lot_name, total_units, status 
                FROM lots
                WHERE status = 'active'
                ORDER BY created_at DESC
            `;
            return NextResponse.json({ success: true, data: lots });
        }

        return NextResponse.json({ success: false, error: 'Invalid reference type requested' }, { status: 400 });

    } catch (e: any) {
        console.error("Fetch reference data failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
