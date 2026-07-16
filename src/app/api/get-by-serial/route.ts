import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authHeader = request.headers.get('authorization');
        const token = authHeader ? authHeader.split(' ')[1] : null;
        const expectedToken = process.env.API_TOKEN || 'bch_live_secret_7742a';
        if (token !== expectedToken) {
            const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        const { searchParams } = new URL(request.url);
        const serialNumber = searchParams.get('serialNumber');

        if (!serialNumber) {
            const res = NextResponse.json({ error: 'Missing serialNumber parameter' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Query database
        const rows = await sql`
            SELECT id, timestamp, specs, session_id as "sessionId", batch_code as "batchCode", operator
            FROM qc_device_specs
            WHERE LOWER(specs->>'serialNumber') = LOWER(${serialNumber.trim()})
            LIMIT 1
        `;

        if (rows.length === 0) {
            const res = NextResponse.json({ error: 'Device specifications not found.' }, { status: 404 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        const res = NextResponse.json({ success: true, device: rows[0] });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;

    } catch (error: any) {
        console.error('[API get-by-serial] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
