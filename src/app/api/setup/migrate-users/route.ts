import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // Add email column
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;

        // Add phone column
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`;

        // Add approval_status column with default 'approved'
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'`;

        // Add created_by column with default 'admin'
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(20) DEFAULT 'admin'`;

        // Add otp_code and otp_expires_at if they don't exist (covering the other migration too)
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP`;

        return NextResponse.json({ success: true, message: 'User table columns added successfully' });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
