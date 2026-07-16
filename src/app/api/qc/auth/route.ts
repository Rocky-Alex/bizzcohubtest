import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            const res = NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        const passwordHash = hashPassword(password);

        // Find operator in qc_users table
        const qcUsers = await sql`
            SELECT q.username, c.name as customer_name
            FROM qc_users q
            JOIN customers c ON q.customer_id = c.id
            WHERE LOWER(q.username) = LOWER(${username}) AND q.password_hash = ${passwordHash}
        `;

        if (qcUsers.length === 0) {
            const res = NextResponse.json({ error: 'Invalid operator credentials' }, { status: 401 });
            res.headers.set('Access-Control-Allow-Origin', '*');
            return res;
        }

        const res = NextResponse.json({ 
            success: true, 
            operator: qcUsers[0].username, 
            customerName: qcUsers[0].customer_name 
        });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    } catch (error: any) {
        console.error('[API qc-auth] Error:', error);
        const res = NextResponse.json({ error: error.message }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}
