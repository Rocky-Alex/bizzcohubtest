
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || "temp-secret-key-change-me";

export async function POST(req: Request) {
    try {
        const { otp1, otp2, signature, expiry } = await req.json();

        if (!otp1 || !otp2 || !signature || !expiry) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        // Check Expiry
        if (Date.now() > expiry) {
            return NextResponse.json({ success: false, message: "OTP has expired" }, { status: 400 });
        }

        // Reconstruct data
        const data = `${otp1}.${otp2}.${expiry}`;

        // Recompute Signature
        const expectedSignature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');

        if (signature === expectedSignature) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: "Invalid OTPs" }, { status: 400 });
        }

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return NextResponse.json({ success: false, message: "Verification failed" }, { status: 500 });
    }
}
