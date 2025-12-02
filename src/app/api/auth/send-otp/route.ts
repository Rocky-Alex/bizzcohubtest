// import { NextRequest, NextResponse } from 'next/server';
// import { sql } from '@/lib/db';
// import { sendEmail, emailTemplates } from '@/lib/email';

// // Store OTPs temporarily (in production, use Redis or database)
// const otpStore = new Map<string, { otp: string; expiresAt: number; email: string }>();

// export async function POST(request: NextRequest) {
//     try {
//         const { username } = await request.json();

//         if (!username) {
//             return NextResponse.json(
//                 { success: false, message: 'Username is required' },
//                 { status: 400 }
//             );
//         }

//         // Check if user exists and get their email
//         const users = await sql`
//             SELECT username, email FROM users
//             WHERE username = ${username}
//         `;

//         if (users.length === 0) {
//             return NextResponse.json(
//                 { success: false, message: 'User not found' },
//                 { status: 404 }
//             );
//         }

//         const user = users[0];

//         // Check if user has an email
//         if (!user.email) {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     message: 'No email associated with this account. Please contact administrator.',
//                     showOtpInAlert: true // Flag to show OTP in alert for demo
//                 },
//                 { status: 400 }
//             );
//         }

//         // Generate 6-digit OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

//         // Store OTP
//         otpStore.set(username, { otp, expiresAt, email: user.email });

//         // Send email
//         const emailTemplate = emailTemplates.otp(otp, username);
//         const emailResult = await sendEmail(user.email, emailTemplate);

//         if (!emailResult.success) {
//             // If email fails, still return success but with flag to show OTP
//             console.error('Email failed, showing OTP in response for demo');
//             return NextResponse.json({
//                 success: true,
//                 message: 'OTP generated (email service unavailable)',
//                 showOtpInAlert: true,
//                 otp: otp, // Only for demo when email fails
//             });
//         }

//         return NextResponse.json({
//             success: true,
//             message: `OTP sent to ${user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`,
//             showOtpInAlert: false,
//         });

//     } catch (error) {
//         console.error('Send OTP error:', error);
//         return NextResponse.json(
//             { success: false, message: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// // Verify OTP endpoint
// export async function PUT(request: NextRequest) {
//     try {
//         const { username, otp } = await request.json();

//         if (!username || !otp) {
//             return NextResponse.json(
//                 { success: false, message: 'Username and OTP are required' },
//                 { status: 400 }
//             );
//         }

//         const storedData = otpStore.get(username);

//         if (!storedData) {
//             return NextResponse.json(
//                 { success: false, message: 'OTP not found or expired' },
//                 { status: 404 }
//             );
//         }

//         // Check if OTP is expired
//         if (Date.now() > storedData.expiresAt) {
//             otpStore.delete(username);
//             return NextResponse.json(
//                 { success: false, message: 'OTP has expired. Please request a new one.' },
//                 { status: 400 }
//             );
//         }

//         // Verify OTP
//         if (storedData.otp !== otp) {
//             return NextResponse.json(
//                 { success: false, message: 'Invalid OTP' },
//                 { status: 400 }
//             );
//         }

//         // OTP is valid - don't delete it yet, will be deleted after password reset
//         return NextResponse.json({
//             success: true,
//             message: 'OTP verified successfully',
//         });

//     } catch (error) {
//         console.error('Verify OTP error:', error);
//         return NextResponse.json(
//             { success: false, message: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// // Clean up expired OTPs periodically
// setInterval(() => {
//     const now = Date.now();
//     Array.from(otpStore.entries()).forEach(([username, data]) => {
//         if (now > data.expiresAt) {
//             otpStore.delete(username);
//         }
//     });
// }, 5 * 60 * 1000); // Clean up every 5 minutes
