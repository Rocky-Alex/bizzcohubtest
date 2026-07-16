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
        const { oldBatchCode, newBatchCode } = body;

        if (!oldBatchCode || !newBatchCode) {
            const res = NextResponse.json({ error: 'Missing oldBatchCode or newBatchCode' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        const cleanNewCode = newBatchCode.trim();
        if (!cleanNewCode) {
            const res = NextResponse.json({ error: 'New Batch Code cannot be empty' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Check if new batch code already exists
        const existing = await sql`
            SELECT id FROM qc_batches
            WHERE LOWER(batch_code) = LOWER(${cleanNewCode})
        `;

        if (existing.length > 0) {
            const res = NextResponse.json(
                { error: `Batch code "${cleanNewCode}" already exists. Please choose a unique batch code.` },
                { status: 409 }
            );
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Update qc_batches
        await sql`
            UPDATE qc_batches
            SET batch_code = ${cleanNewCode}
            WHERE LOWER(batch_code) = LOWER(${oldBatchCode})
        `;

        // Update associated specs
        await sql`
            UPDATE qc_device_specs
            SET batch_code = ${cleanNewCode}
            WHERE LOWER(batch_code) = LOWER(${oldBatchCode})
        `;

        const res = NextResponse.json({
            success: true,
            message: `Batch renamed from "${oldBatchCode}" to "${cleanNewCode}" successfully.`
        });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;

    } catch (error: any) {
        console.error('[API rename-batch] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
