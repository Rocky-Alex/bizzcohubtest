import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
    try {
        // Fetch all data
        const chart = await sql`SELECT * FROM chart_of_accounts`;
        const lots = await sql`SELECT * FROM lots`;
        const cashBook = await sql`SELECT * FROM cash_book`;

        const backupData = {
            timestamp: new Date().toISOString(),
            system: 'UAE Cash-Book Driven Accounting',
            version: '1.0',
            data: {
                chart_of_accounts: chart,
                lots: lots,
                cash_book: cashBook
            }
        };

        // Return as downloadable file headers
        return new NextResponse(JSON.stringify(backupData, null, 2), {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="accounting_backup_${new Date().toISOString().split('T')[0]}.json"`,
                'Content-Type': 'application/json',
            },
        });

    } catch (e: any) {
        console.error("Backup failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
