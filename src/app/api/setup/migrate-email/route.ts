import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        // Add email column to users table
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255)
        `;

        // Create index for email lookups
        await sql`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
        `;

        // Update admin user with default email
        await sql`
            UPDATE users 
            SET email = 'bizzcohub@gmail.com' 
            WHERE username = 'admin' AND email IS NULL
        `;

        // Get updated users to verify
        const users = await sql`
            SELECT username, email, role, status 
            FROM users 
            ORDER BY created_at
        `;

        return NextResponse.json({
            success: true,
            message: 'Database schema updated successfully',
            users: users.map(u => ({
                username: u.username,
                email: u.email || 'Not set',
                role: u.role,
                status: u.status
            }))
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Migration failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
