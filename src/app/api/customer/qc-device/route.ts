import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');
        const serialNumber = searchParams.get('serialNumber');

        if (!customerId || !serialNumber) {
            return NextResponse.json({ error: 'customerId and serialNumber are required' }, { status: 400 });
        }

        // Get the operator username for this customer
        const qcUsers = await sql`
            SELECT username FROM qc_users WHERE customer_id = ${customerId}
        `;

        if (qcUsers.length === 0) {
            return NextResponse.json({ error: 'No operator account configured for this customer.' }, { status: 404 });
        }

        const operatorUsername = qcUsers[0].username;

        // Query database for spec matching serialNumber and operator
        const rows = await sql`
            SELECT id, timestamp, specs, session_id as "sessionId", batch_code as "batchCode", operator
            FROM qc_device_specs
            WHERE LOWER(specs->>'serialNumber') = LOWER(${serialNumber.trim()}) AND LOWER(operator) = LOWER(${operatorUsername})
            LIMIT 1
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Device specification record not found.' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error('[API customer-qc-device GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customerId, recordId, updatedSpecs, batchCode } = body;

        if (!customerId || !recordId || !updatedSpecs) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        // Validate operator ownership
        const qcUsers = await sql`
            SELECT username FROM qc_users WHERE customer_id = ${customerId}
        `;

        if (qcUsers.length === 0) {
            return NextResponse.json({ error: 'No operator account configured.' }, { status: 403 });
        }

        const operatorUsername = qcUsers[0].username;

        // Check if the record belongs to this operator
        const verifyRecord = await sql`
            SELECT id FROM qc_device_specs 
            WHERE id = ${recordId} AND LOWER(operator) = LOWER(${operatorUsername})
        `;

        if (verifyRecord.length === 0) {
            return NextResponse.json({ error: 'Unauthorized to modify this record.' }, { status: 403 });
        }

        // Update the specs and batch code
        await sql`
            UPDATE qc_device_specs
            SET specs = ${JSON.stringify(updatedSpecs)},
                batch_code = ${batchCode || ''}
            WHERE id = ${recordId}
        `;

        return NextResponse.json({ success: true, message: 'Device diagnostics successfully updated.' });
    } catch (error: any) {
        console.error('[API customer-qc-device POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
