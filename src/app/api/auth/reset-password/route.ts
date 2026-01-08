import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { token, type, password } = await request.json();

        if (!token || !password || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify Token
        const resets = await sql`
            SELECT email FROM password_resets 
            WHERE token = ${token} 
            AND type = ${type} 
            AND expires_at > NOW()
        `;

        if (resets.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        const email = resets[0].email;
        const passwordHash = createHash('sha256').update(password).digest('hex');

        // 2. Update Password
        if (type === 'admin') {
            await sql`
                UPDATE users 
                SET password_hash = ${passwordHash} 
                WHERE email = ${email}
            `;
        } else {
            // Customer
            await sql`
                UPDATE customers 
                SET password_hash = ${passwordHash} 
                WHERE email = ${email}
            `;
        }

        // 3. Delete Token (Consume it)
        await sql`
            DELETE FROM password_resets WHERE token = ${token}
        `;

        return NextResponse.json({ success: true, message: 'Password reset successfully' });

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
            return NextResponse.json({ valid: false }, { status: 400 });
        }

        const resets = await sql`
            SELECT email FROM password_resets 
            WHERE token = ${token} 
            AND type = ${type} 
            AND expires_at > NOW()
        `;

        if (resets.length === 0) {
            return NextResponse.json({ valid: false });
        }

        return NextResponse.json({ valid: true });

    } catch (error: any) {
        console.error('Verify Token Error:', error);
        return NextResponse.json({ valid: false }, { status: 500 });
    }
}
