import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { sql } from '@/lib/db';
import { OAuth2Client } from 'google-auth-library';

export const dynamic = 'force-dynamic';

// Initialize the Google OAuth Client
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'DUMMY_CLIENT_ID_REPLACE_ME';
const client = new OAuth2Client(clientId);

// Reuse the existing session token logic from /api/auth/customer
function generateSessionToken(): string {
    return createHash('sha256')
        .update(`${Date.now()}-${Math.random()}`)
        .digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { credential } = body;

        if (!credential) {
            return NextResponse.json({ success: false, message: 'Google credential token is missing.' }, { status: 400 });
        }

        // 1. Verify the Google JWT Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, message: 'Invalid Google token payload.' }, { status: 400 });
        }

        const email = payload.email.toLowerCase();
        const firstName = payload.given_name || 'Google';
        const lastName = payload.family_name || 'User';
        const avatarUrl = payload.picture || null;

        // 2. Database Action: Find or Create Customer
        let users = await sql`SELECT * FROM customers WHERE email = ${email}`;
        let user;

        if (users.length > 0) {
            // User exists, log them in
            user = users[0];

            if (user.status !== 'Active') {
                return NextResponse.json(
                    { success: false, message: 'Account is deactivated. Please contact support.' },
                    { status: 403 }
                );
            }

            // Optionally update the avatar if it's missing but provided by Google
            if (!user.avatar_url && avatarUrl) {
                await sql`UPDATE customers SET avatar = ${avatarUrl}, image_url = ${avatarUrl} WHERE id = ${user.id}`;
                user.avatar = avatarUrl;
                user.image_url = avatarUrl;
            }

        } else {
            // User does NOT exist, Auto-Create Account
            const generatedUsername = `g_${email.split('@')[0]}_${Math.floor(Math.random() * 1000)}`;
            const generatedPasswordHash = createHash('sha256').update(generateSessionToken()).digest('hex'); // Random secure dummy password

            const newUsers = await sql`
                INSERT INTO customers (name, username, email, password_hash, avatar, image_url, status)
                VALUES (${firstName + ' ' + lastName}, ${generatedUsername}, ${email}, ${generatedPasswordHash}, ${avatarUrl}, ${avatarUrl}, 'Active')
                RETURNING *
            `;

            user = newUsers[0];
        }

        // 3. Generate Custom BizzCoHub Session (Mirroring /api/auth/customer)
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

        // Set secure HTTP-only cookie matching standard login
        cookies().set('customer_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expiresAt,
            path: '/'
        });

        // 4. Return success response
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: 'customer',
                avatar: user.avatar || user.image_url
            }
        });

    } catch (error: any) {
        console.error('Google Auth Error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
