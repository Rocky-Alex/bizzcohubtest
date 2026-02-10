
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// EMAILS TO SEND OTP TO
// TODO: Update these emails to the actual admin emails
const EMAIL_1 = "rishadpnpm@gmail.com";
const EMAIL_2 = "bizzcohubllc@gmail.com";

const SECRET = process.env.NEXTAUTH_SECRET || "temp-secret-key-change-me";

export async function POST(_req: Request): Promise<NextResponse> {
    try {
        console.log("Debug Env:", {
            user: process.env.EMAIL_USER ? 'Is Set' : 'NOT SET',
            pass: process.env.EMAIL_PASS ? 'Is Set' : 'NOT SET'
        });

        // Generate two 6-digit OTPs
        const otp1 = Math.floor(100000 + Math.random() * 900000).toString();
        const otp2 = Math.floor(100000 + Math.random() * 900000).toString();

        console.log("Sending OTPs:", otp1, otp2); // Logic log

        // Send Emails in parallel
        // Use HTML for better formatting
        const p1 = sendEmail(EMAIL_1, "Security Check - OTP 1",
            `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Security Verification</h2>
                <p>Your OTP Code 1 is:</p>
                <h1 style="color: #4f46e5; letter-spacing: 5px;">${otp1}</h1>
                <p>This code expires in 90 seconds.</p>
            </div>`
        );

        const p2 = sendEmail(EMAIL_2, "Security Check - OTP 2",
            `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Security Verification</h2>
                <p>Your OTP Code 2 is:</p>
                <h1 style="color: #4f46e5; letter-spacing: 5px;">${otp2}</h1>
                <p>This code expires in 90 seconds.</p>
            </div>`
        );

        const results = await Promise.all([p1, p2]) as { success: boolean, error?: string }[];

        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            console.error("Failed to send OTPs. Errors:", failed.map(f => f.error));
            return NextResponse.json({
                success: false,
                message: "Failed to send emails. Check server terminal for error details."
            }, { status: 500 });
        }

        // Create a signed hash of the OTPs + Expiry
        // Validity: 90 seconds from now
        const expiry = Date.now() + 90 * 1000;

        // Data to sign
        const data = `${otp1}.${otp2}.${expiry}`;

        // HMAC Signature
        const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');

        return NextResponse.json({
            success: true,
            signature,
            expiry
        });

    } catch (error: unknown) {
        console.error("OTP Generation Error:", error);
        return NextResponse.json({ success: false, message: "Failed to send OTPs" }, { status: 500 });
    }
}
