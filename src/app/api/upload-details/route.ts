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

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { batchCode, timestamp, sessionId, specs, operator } = body;

        if (!batchCode) {
            const res = NextResponse.json({ error: 'Missing batchCode' }, { status: 400 });
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
                operator VARCHAR(255),
                specs JSONB
            )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_qc_device_specs_batch_code ON qc_device_specs(batch_code)`;

        // Check for duplicate serial number to prevent duplicate entries
        const serialNumber = specs?.serialNumber;
        if (serialNumber) {
            const existing = await sql`
                SELECT id FROM qc_device_specs 
                WHERE specs->>'serialNumber' = ${serialNumber}
            `;
            if (existing.length > 0) {
                const res = NextResponse.json(
                    { error: 'Device specifications with this Serial Number already exist in the database.' }, 
                    { status: 409 }
                );
                res.headers.set('Access-Control-Allow-Origin', '*');
                return res;
            }
        }

        // Insert details (parse timestamp as Date or use current time if invalid)
        const recordTimestamp = timestamp ? new Date(timestamp) : new Date();
        const specsJson = JSON.stringify(specs);

        await sql`
            INSERT INTO qc_device_specs (batch_code, session_id, timestamp, specs, operator)
            VALUES (${batchCode}, ${sessionId || null}, ${recordTimestamp}, ${specsJson}, ${operator || null})
        `;

        const res = NextResponse.json({ success: true, message: 'Hardware details saved successfully' });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    } catch (error: any) {
        console.error('[API upload-details] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
