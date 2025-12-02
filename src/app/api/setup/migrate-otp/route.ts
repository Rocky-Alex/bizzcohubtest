// import { NextRequest, NextResponse } from 'next/server';
// import { sql } from '@/lib/db';

// export async function POST(request: NextRequest) {
//     try {
//         await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10)`;
//         await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP`;

//         return NextResponse.json({ success: true, message: 'OTP columns added' });
//     } catch (error) {
//         return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
//     }
// }
