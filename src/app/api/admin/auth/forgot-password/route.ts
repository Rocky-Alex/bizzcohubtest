import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { email, action } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Action: Lookup User
        if (action === 'lookup') {
            const users = await sql`SELECT username, image_url, avatar FROM users WHERE email = ${email}` as unknown as any[];

            if (users.length === 0) {
                return NextResponse.json({ found: false, message: 'No admin account found with this email' }, { status: 404 });
            }

            const user = users[0];
            return NextResponse.json({
                found: true,
                user: {
                    username: user.username,
                    avatar: user.image_url || user.avatar
                }
            });
        }

        // 1. Check if Admin exists
        const admins = await sql`SELECT id, username, first_name FROM users WHERE email = ${email}` as unknown as any[];

        if (admins.length === 0) {
            return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
        }

        const admin = admins[0];
        const name = admin.first_name || admin.username;

        // 2. Generate Token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 90); // 1.5 minutes

        // 3. Upsert Token
        await sql`
            CREATE TABLE IF NOT EXISTS password_resets (
                email TEXT NOT NULL,
                token TEXT NOT NULL,
                type TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                PRIMARY KEY (email, type)
            )
        `;

        await sql`
            INSERT INTO password_resets (email, token, type, expires_at)
            VALUES (${email}, ${token}, 'admin', ${expiresAt.toISOString()})
            ON CONFLICT (email, type) 
            DO UPDATE SET token = ${token}, expires_at = ${expiresAt.toISOString()}
        `;

        // 4. Send Email
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        const resetLink = `${baseUrl}/reset-password?token=${token}&type=admin`;

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #ef4444;">Admin Password Reset</h2>
                <p>Hello ${name},</p>
                <p>You have requested to reset your Admin password.</p>
                <div style="margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Admin Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 1.5 minutes.</p>
            </div>
        `;

        let emailSent = false;

        // Try Resend
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const { error } = await resend.emails.send({
                    from: 'Bizz Co Hub Security <security@resend.dev>',
                    to: [email],
                    subject: 'Admin Password Reset',
                    html: emailHtml
                });

                if (!error) {
                    emailSent = true;
                    console.log('Admin reset email sent via Resend');
                }
            } catch (e: unknown) {
                console.error('Resend execution failed:', e);
            }
        }

        // Fallback Nodemailer
        if (!emailSent) {
            console.log('Attempting Nodemailer fallback for Admin...');
            const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
            const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;

            if (smtpUser && smtpPass) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: smtpUser, pass: smtpPass }
                    });

                    await transporter.sendMail({
                        from: `"Bizz Co Hub Admin" <${smtpUser}>`,
                        to: email,
                        subject: 'Admin Password Reset',
                        html: emailHtml
                    });

                    emailSent = true;
                    console.log('Admin reset email sent via Nodemailer');
                } catch (e: unknown) {
                    console.error('Nodemailer failed:', e);
                }
            }
        }

        if (emailSent) {
            return NextResponse.json({ success: true, message: 'Reset link sent' });
        } else {
            return NextResponse.json({ error: 'Failed to send email. Server configuration error.' }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('Admin Forgot Password Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
