import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Store OTPs temporarily (in production, use Redis or database)
// We can reuse the same store or mechanism, but for separation let's keep it simple here
// In a real app, you'd integrate with an SMS provider like Twilio
const phoneOtpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { success: false, message: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Check if user exists with this phone number
        const users = await sql`
            SELECT id, username, status, approval_status FROM users 
            WHERE phone = ${phone}
        `;

        if (users.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Phone number not found' },
                { status: 404 }
            );
        }

        const user = users[0];

        if (user.status !== 'active' || user.approval_status !== 'approved') {
            return NextResponse.json(
                { success: false, message: 'Account is not active or pending approval' },
                { status: 403 }
            );
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in database (valid for 5 minutes)
        await sql`
            UPDATE users 
            SET otp_code = ${otp}, 
                otp_expires_at = NOW() + INTERVAL '5 minutes'
            WHERE phone = ${phone}
        `;

        // In production: Send SMS via Twilio/etc.
        // For demo: Return OTP in response
        console.log(`OTP for ${phone}: ${otp}`);

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            showOtpInAlert: true, // For demo purposes
            otp: otp
        });

    } catch (error) {
        console.error('Phone login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Clean up expired OTPs
setInterval(() => {
    const now = Date.now();
    Array.from(phoneOtpStore.entries()).forEach(([phone, data]) => {
        if (now > data.expiresAt) {
            phoneOtpStore.delete(phone);
        }
    });
}, 5 * 60 * 1000);
