import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

// Inline schema migration helper
async function ensureTableExists() {
    await sql`
        CREATE TABLE IF NOT EXISTS qc_users (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_qc_users_customer_id ON qc_users(customer_id)`;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        await ensureTableExists();

        const qcUsers = await sql`
            SELECT username FROM qc_users WHERE customer_id = ${customerId}
        `;

        if (qcUsers.length === 0) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true, username: qcUsers[0].username });
    } catch (error: any) {
        console.error('QC User GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customerId, username, password } = body;

        if (!customerId || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await ensureTableExists();

        // Check if username is already taken by ANOTHER customer
        const existingUsername = await sql`
            SELECT id FROM qc_users 
            WHERE LOWER(username) = LOWER(${username}) AND customer_id != ${customerId}
        `;

        if (existingUsername.length > 0) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
        }

        const passwordHash = hashPassword(password);

        // Check if customer already has a QC User
        const existingCustomerUser = await sql`
            SELECT id FROM qc_users WHERE customer_id = ${customerId}
        `;

        if (existingCustomerUser.length > 0) {
            // Update
            await sql`
                UPDATE qc_users 
                SET username = ${username}, password_hash = ${passwordHash}, updated_at = NOW()
                WHERE customer_id = ${customerId}
            `;
            return NextResponse.json({ success: true, message: 'QC Operator credentials updated successfully.' });
        }

        // Insert
        await sql`
            INSERT INTO qc_users (customer_id, username, password_hash)
            VALUES (${customerId}, ${username}, ${passwordHash})
        `;

        return NextResponse.json({ success: true, message: 'QC Operator account created successfully.' });
    } catch (error: any) {
        console.error('QC User POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    // Treat PUT same as POST (upsert) for developer convenience
    return POST(request);
}
