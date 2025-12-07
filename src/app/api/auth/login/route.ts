import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { sql } from '@/lib/db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Session token generator
function generateSessionToken(): string {
    return createHash('sha256')
        .update(`${Date.now()}-${Math.random()}`)
        .digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Hash the provided password
        const passwordHash = createHash('sha256').update(password).digest('hex');

        // Query the database
        const users = await sql`
            SELECT * FROM users 
            WHERE username = ${username} 
            AND password_hash = ${passwordHash}
        `;

        if (users.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const user = users[0];

        if (user.status !== 'active') {
            return NextResponse.json(
                { success: false, message: 'Account is inactive. Please contact administrator.' },
                { status: 403 }
            );
        }

        // Generate session token
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Set HTTP-only cookies
        cookies().set('admin_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expiresAt,
            path: '/',
        });

        // Set user role cookie (not httpOnly so frontend can read it if needed, or just keep it httpOnly and expose via API)
        // For security, let's keep it httpOnly and use the session API to get user details
        cookies().set('user_role', user.role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expiresAt,
            path: '/',
        });

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
