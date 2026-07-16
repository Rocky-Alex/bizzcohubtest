import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
        const { serialNumber, updatedSpecs, batchCode } = body;

        if (!serialNumber || !updatedSpecs) {
            const res = NextResponse.json({ error: 'Missing serialNumber or updatedSpecs parameter' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Check if the record exists
        const existing = await sql`
            SELECT id FROM qc_device_specs 
            WHERE LOWER(specs->>'serialNumber') = LOWER(${serialNumber.trim()})
            LIMIT 1
        `;

        if (existing.length === 0) {
            const res = NextResponse.json({ error: 'Device specifications record not found.' }, { status: 404 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        const recordId = existing[0].id;

        // Update the specs and batch code
        await sql`
            UPDATE qc_device_specs
            SET specs = ${JSON.stringify(updatedSpecs)},
                batch_code = ${batchCode || ''}
            WHERE id = ${recordId}
        `;

        const res = NextResponse.json({ success: true, message: 'Device diagnostics successfully updated.' });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;

    } catch (error: any) {
        console.error('[API update-by-serial] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
