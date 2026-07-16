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
        const { batchCode, operator, description } = body;

        if (!batchCode) {
            const res = NextResponse.json({ error: 'Missing batchCode' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Ensure batches table exists
        await sql`
            CREATE TABLE IF NOT EXISTS qc_batches (
                id SERIAL PRIMARY KEY,
                batch_code VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                operator VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'active'
            )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_qc_batches_batch_code ON qc_batches(batch_code)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_qc_batches_status ON qc_batches(status)`;

        // Check if batch code already exists
        const existing = await sql`
            SELECT id, batch_code, created_at, operator FROM qc_batches
            WHERE batch_code = ${batchCode}
        `;

        if (existing.length > 0) {
            const res = NextResponse.json(
                { error: `Batch code "${batchCode}" already exists. Please choose a unique batch code.` },
                { status: 409 }
            );
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        // Insert new batch record
        const result = await sql`
            INSERT INTO qc_batches (batch_code, description, operator, status)
            VALUES (${batchCode}, ${description || null}, ${operator || null}, 'active')
            RETURNING id, batch_code, created_at, status
        `;

        const newBatch = result[0];

        const res = NextResponse.json({
            success: true,
            message: `Batch "${batchCode}" created successfully.`,
            batch: {
                id: newBatch.id,
                batchCode: newBatch.batch_code,
                createdAt: newBatch.created_at,
                status: newBatch.status,
                operator: operator || null,
            }
        });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;

    } catch (error: any) {
        console.error('[API create-batch] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
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

        // Ensure table exists before querying
        await sql`
            CREATE TABLE IF NOT EXISTS qc_batches (
                id SERIAL PRIMARY KEY,
                batch_code VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                operator VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'active'
            )
        `;

        const batches = await sql`
            SELECT 
                b.id,
                b.batch_code AS "batchCode",
                b.description,
                b.operator,
                b.created_at AS "createdAt",
                b.status,
                COUNT(d.id)::int AS "deviceCount"
            FROM qc_batches b
            LEFT JOIN qc_device_specs d ON d.batch_code = b.batch_code
            GROUP BY b.id, b.batch_code, b.description, b.operator, b.created_at, b.status
            ORDER BY b.created_at DESC
        `;

        const res = NextResponse.json({ success: true, batches });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;

    } catch (error: any) {
        console.error('[API create-batch GET] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
