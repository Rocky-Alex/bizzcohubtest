import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

function generateSessionToken(): string {
    return createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // Ensure Schema Exists
        await sql`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        `;

        // Ensure email is unique (might fail if duplicates exist, so we use a safe index creation pattern if possible, or just ignore for now and rely on code)
        // For simplicity in this existing DB, we rely on application checks.

        if (action === 'signup') {
            const { fullName, username, email, phone, password } = body;

            if (!username || !password || !email) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            // Check if user exists
            const existing = await sql`
                SELECT id FROM customers WHERE username = ${username} OR email = ${email}
            `;

            if (existing.length > 0) {
                return NextResponse.json({ error: 'Username or Email already exists' }, { status: 409 });
            }

            const passwordHash = hashPassword(password);

            // Insert new customer
            const newCustomer = await sql`
                INSERT INTO customers (name, username, email, phone, password_hash, status)
                VALUES (${fullName}, ${username}, ${email}, ${phone}, ${passwordHash}, 'Active')
                RETURNING id, name, username, email
            `;

            return NextResponse.json({
                success: true,
                message: 'Account created successfully',
                user: newCustomer[0]
            });
        }

        else if (action === 'login') {
            const { identifier, password } = body; // identifier can be username or email

            if (!identifier || !password) {
                return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
            }

            const passwordHash = hashPassword(password);

            const users = await sql`
                SELECT * FROM customers 
                WHERE (username = ${identifier} OR email = ${identifier}) 
                AND password_hash = ${passwordHash}
            `;

            if (users.length === 0) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const user = users[0];

            // Set Session Cookie
            const sessionToken = generateSessionToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

            cookies().set('customer_session', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                expires: expiresAt,
                path: '/'
            });

            // Frontend might want some user info
            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email
                }
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
