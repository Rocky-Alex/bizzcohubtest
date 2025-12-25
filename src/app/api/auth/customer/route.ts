import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';

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

        // DDL removed. Schema assumed to exist.


        if (action === 'signup') {
            const { firstName, lastName, username, email, phone, password, avatar } = body;

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
            const fullName = `${firstName} ${lastName}`.trim();

            // Insert new customer
            const newCustomer = await sql`
                INSERT INTO customers (name, username, email, phone, password_hash, status, avatar, image_url)
                VALUES (${fullName}, ${username}, ${email}, ${phone}, ${passwordHash}, 'Active', ${avatar || null}, ${avatar || null})
                RETURNING id, name, username, email, avatar, image_url
            `;

            await logActivity(username, 'Customer Signup', `New customer signed up: ${fullName} (${email})`, 'success', 'Customer');

            return NextResponse.json({
                success: true,
                message: 'Account created successfully',
                user: {
                    ...newCustomer[0],
                    image_url: newCustomer[0].image_url || newCustomer[0].avatar
                }
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
                await logActivity(identifier, 'Login Failed', `Failed login attempt for: ${identifier}`, 'failure', 'Customer');
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const user = users[0];

            // Check Deactivation Status
            if (user.status === 'Deactivated') {
                const deactivatedAt = user.deactivated_at ? new Date(user.deactivated_at) : new Date(0); // Default to old if missing
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - deactivatedAt.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 60) {
                    // Permanently Delete
                    await sql`DELETE FROM wishlist WHERE customer_id = ${user.id}`;
                    await sql`DELETE FROM orders WHERE customer_id = ${user.id}`;
                    await sql`DELETE FROM customers WHERE id = ${user.id}`;

                    return NextResponse.json({ error: 'Your account was permanently deleted due to inactivity of over 60 days.' }, { status: 410 }); // 410 Gone
                } else {
                    // Reactivate
                    await sql`UPDATE customers SET status = 'Active', deactivated_at = NULL WHERE id = ${user.id}`;
                    // Proceed to login
                }
            }

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

            await logActivity(user.username, 'Customer Login', `Customer logged in: ${user.name}`, 'success', 'Customer');

            // Frontend might want some user info
            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    image_url: user.image_url || user.avatar
                }
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
