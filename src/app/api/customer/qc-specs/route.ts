import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');
        const batchCode = searchParams.get('batchCode');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        if (!batchCode) {
            return NextResponse.json({ error: 'Batch Code is required' }, { status: 400 });
        }

        // Get the operator username for this customer
        const qcUsers = await sql`
            SELECT username FROM qc_users WHERE customer_id = ${customerId}
        `;

        if (qcUsers.length === 0) {
            return NextResponse.json([]); // No operator configured, return empty
        }

        const operatorUsername = qcUsers[0].username;

        // Query database for specs matching batchCode and operator
        const rows = await sql`
            SELECT timestamp, specs, session_id as "sessionId", batch_code as "batchCode", operator
            FROM qc_device_specs
            WHERE LOWER(batch_code) = LOWER(${batchCode}) AND LOWER(operator) = LOWER(${operatorUsername})
            ORDER BY timestamp DESC
        `;

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('[API customer-qc-specs] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
