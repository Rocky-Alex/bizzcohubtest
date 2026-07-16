import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

function generateSessionToken(): string {
    return createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex');
}

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(`${origin}/login?error=google_cancelled`);
    }

    try {
        // 1. Exchange auth code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: `${origin}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.id_token) {
            console.error('[Google Callback] Token exchange failed:', tokenData);
            return NextResponse.redirect(`${origin}/login?error=google_token_failed`);
        }

        // 2. Decode the ID token payload (JWT middle part — no library needed)
        const [, payloadB64] = tokenData.id_token.split('.');
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));

        const email = (payload.email as string)?.toLowerCase();
        const firstName = (payload.given_name as string) || 'Google';
        const lastName = (payload.family_name as string) || 'User';
        const avatarUrl = (payload.picture as string) || null;

        if (!email) {
            return NextResponse.redirect(`${origin}/login?error=google_no_email`);
        }

        // 3. Find or create customer
        let users = await sql`SELECT * FROM customers WHERE email = ${email}`;
        let user;

        if (users.length > 0) {
            user = users[0];

            if (user.status !== 'Active') {
                return NextResponse.redirect(`${origin}/login?error=account_deactivated`);
            }

            // Update avatar if missing
            if (!user.avatar && avatarUrl) {
                await sql`UPDATE customers SET avatar = ${avatarUrl}, image_url = ${avatarUrl} WHERE id = ${user.id}`;
                user.avatar = avatarUrl;
            }
        } else {
            // Auto-create account
            const generatedUsername = `g_${email.split('@')[0]}_${Math.floor(Math.random() * 1000)}`;
            const dummyHash = createHash('sha256').update(generateSessionToken()).digest('hex');

            const newUsers = await sql`
                INSERT INTO customers (name, username, email, password_hash, avatar, image_url, status)
                VALUES (${firstName + ' ' + lastName}, ${generatedUsername}, ${email}, ${dummyHash}, ${avatarUrl}, ${avatarUrl}, 'Active')
                RETURNING *
            `;
            user = newUsers[0];
        }

        // 4. Set session cookie
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        cookies().set('customer_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expiresAt,
            path: '/',
        });

        // 5. Pass user data to client via URL param (safe subset), then redirect
        const userData = encodeURIComponent(JSON.stringify({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: 'customer',
            avatar: user.avatar || user.image_url,
        }));

        return NextResponse.redirect(`${origin}/auth/callback?user=${userData}`);

    } catch (err: any) {
        console.error('[Google Callback] Error:', err);
        return NextResponse.redirect(`${origin}/login?error=google_server_error`);
    }
}
