import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        // Get the operator username for this customer
        const qcUsers = await sql`
            SELECT username FROM qc_users WHERE customer_id = ${customerId}
        `;

        if (qcUsers.length === 0) {
            return NextResponse.json([]); // No operator configured, return empty list of batches
        }

        const operatorUsername = qcUsers[0].username;

        // Query database for distinct batches, counts, and latest update time
        const rows = await sql`
            SELECT 
                batch_code as "batchCode", 
                COUNT(*) as "deviceCount", 
                MAX(timestamp) as "lastUpdated"
            FROM qc_device_specs
            WHERE LOWER(operator) = LOWER(${operatorUsername})
            GROUP BY batch_code
            ORDER BY "lastUpdated" DESC
        `;

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('[API customer-qc-batches] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customerId, action, batchCode, oldBatchCode, newBatchCode } = body;

        if (!customerId || !action) {
            return NextResponse.json({ error: 'Missing customerId or action' }, { status: 400 });
        }

        // Get the operator username for this customer
        const qcUsers = await sql`
            SELECT username FROM qc_users WHERE customer_id = ${customerId}
        `;

        if (qcUsers.length === 0) {
            return NextResponse.json({ error: 'No QC operator configured for this customer account.' }, { status: 404 });
        }

        const operatorUsername = qcUsers[0].username;

        if (action === 'delete') {
            if (!batchCode) {
                return NextResponse.json({ error: 'batchCode is required for deletion.' }, { status: 400 });
            }

            // Delete all specs under this batch code for this operator
            await sql`
                DELETE FROM qc_device_specs 
                WHERE LOWER(batch_code) = LOWER(${batchCode}) AND LOWER(operator) = LOWER(${operatorUsername})
            `;

            return NextResponse.json({ success: true, message: `Batch ${batchCode} deleted successfully.` });

        } else if (action === 'rename') {
            if (!oldBatchCode || !newBatchCode) {
                return NextResponse.json({ error: 'oldBatchCode and newBatchCode are required for renaming.' }, { status: 400 });
            }

            const cleanNewCode = newBatchCode.trim();
            if (!cleanNewCode) {
                return NextResponse.json({ error: 'New Batch Code cannot be empty.' }, { status: 400 });
            }

            // Update all specs under old batch code for this operator
            await sql`
                UPDATE qc_device_specs 
                SET batch_code = ${cleanNewCode}
                WHERE LOWER(batch_code) = LOWER(${oldBatchCode}) AND LOWER(operator) = LOWER(${operatorUsername})
            `;

            return NextResponse.json({ success: true, message: `Batch renamed to ${cleanNewCode} successfully.` });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('[API customer-qc-batches POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
