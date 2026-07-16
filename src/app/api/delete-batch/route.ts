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
        const { batchCode } = body;

        if (!batchCode) {
            const res = NextResponse.json({ error: 'Missing batchCode' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Delete from qc_batches
        await sql`
            DELETE FROM qc_batches
            WHERE LOWER(batch_code) = LOWER(${batchCode})
        `;

        // Also delete associated specs
        await sql`
            DELETE FROM qc_device_specs
            WHERE LOWER(batch_code) = LOWER(${batchCode})
        `;

        const res = NextResponse.json({
            success: true,
            message: `Batch "${batchCode}" deleted successfully.`
        });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;

    } catch (error: any) {
        console.error('[API delete-batch] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
