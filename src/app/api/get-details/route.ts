import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

        // Get query parameter
        const { searchParams } = new URL(request.url);
        const batchCode = searchParams.get('batchCode');

        if (!batchCode) {
            const res = NextResponse.json({ error: 'Missing batchCode parameter' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS qc_device_specs (
                id SERIAL PRIMARY KEY,
                batch_code VARCHAR(255) NOT NULL,
                session_id VARCHAR(255),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                specs JSONB
            )
        `;

        // Query database
        const rows = await sql`
            SELECT timestamp, specs, session_id as "sessionId", batch_code as "batchCode", operator
            FROM qc_device_specs
            WHERE batch_code = ${batchCode}
            ORDER BY timestamp DESC
        `;

        const res = NextResponse.json(rows);
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    } catch (error: any) {
        console.error('[API get-details] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
