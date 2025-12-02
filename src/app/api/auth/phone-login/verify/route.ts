import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json(
                { success: false, message: 'Phone and OTP are required' },
                { status: 400 }
            );
        }

        // Verify user exists and check OTP
        const users = await sql`
            SELECT * FROM users 
            WHERE phone = ${phone} 
            AND otp_code = ${otp} 
            AND otp_expires_at > NOW()
        `;

        if (users.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid OTP or expired' },
                { status: 400 }
            );
        }

        const user = users[0];

        if (user.status !== 'active' || user.approval_status !== 'approved') {
            return NextResponse.json(
                { success: false, message: 'Account is not active or pending approval' },
                { status: 403 }
            );
        }

        // Clear OTP after successful login
        await sql`
            UPDATE users 
            SET otp_code = NULL, otp_expires_at = NULL 
            WHERE id = ${user.id}
        `;

        // Session token generator
        const generateSessionToken = () => {
            return createHash('sha256')
                .update(`${Date.now()}-${Math.random()}`)
                .digest('hex');
        };

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
        console.error('Phone verify error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
