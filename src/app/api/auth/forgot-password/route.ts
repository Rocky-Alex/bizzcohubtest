import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, action } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Action: Lookup User
        if (action === 'lookup') {
            const customers = await sql`SELECT username, image_url, avatar FROM customers WHERE email = ${email}`;

            if (customers.length === 0) {
                return NextResponse.json({ found: false, message: 'No account found with this email' }, { status: 404 });
            }

            const user = customers[0];
            return NextResponse.json({
                found: true,
                user: {
                    username: user.username,
                    avatar: user.image_url || user.avatar
                }
            });
        }

        // 1. Check if customer exists
        const customers = await sql`SELECT id, name FROM customers WHERE email = ${email}`;
        if (customers.length === 0) {
            return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
        }

        const customer = customers[0];

        // 2. Generate Token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 90); // 1.5 minutes

        // 3. Store Token (Lazy Table Create)
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
            VALUES (${email}, ${token}, 'customer', ${expiresAt.toISOString()})
            ON CONFLICT (email, type) 
            DO UPDATE SET token = ${token}, expires_at = ${expiresAt.toISOString()}
        `;

        // 4. Send Email
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        const resetLink = `${baseUrl}/reset-password?token=${token}&type=customer`;

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${customer.name},</p>
                <p>We received a request to reset your password for your Bizz Co Hub account.</p>
                <div style="margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #007aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 1.5 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
            </div>
        `;

        let emailSent = false;

        // Try Resend first
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const { error } = await resend.emails.send({
                    from: 'Bizz Co Hub Security <security@resend.dev>',
                    to: [email],
                    subject: 'Reset Your Password',
                    html: emailHtml
                });

                if (!error) {
                    emailSent = true;
                    console.log('Email sent via Resend');
                } else {
                    console.error('Resend returned error:', error);
                }
            } catch (e) {
                console.error('Resend execution failed:', e);
            }
        }

        // Fallback to Nodemailer
        if (!emailSent) {
            console.log('Attempting Nodemailer fallback...');
            const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
            const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;

            if (smtpUser && smtpPass) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: smtpUser, pass: smtpPass }
                    });

                    await transporter.sendMail({
                        from: `"Bizz Co Hub" <${smtpUser}>`,
                        to: email,
                        subject: 'Reset Your Password',
                        html: emailHtml
                    });

                    emailSent = true;
                    console.log('Email sent via Nodemailer');
                } catch (e) {
                    console.error('Nodemailer failed:', e);
                }
            } else {
                console.log('SMTP credentials missing, cannot send email.');
            }
        }

        if (emailSent) {
            return NextResponse.json({ success: true, message: 'Reset link sent' });
        } else {
            // Even if failed, we might want to return success to user for security, but logging error is key.
            // For debugging now, we return 500 if both failed so I can see it.
            // But user sees "sent" likely because front-end just checks 200.
            // I'll return 500 if both fail to alert the user.
            return NextResponse.json({ error: 'Failed to send email. Server configuration error.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
