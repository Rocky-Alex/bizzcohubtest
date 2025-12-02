import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createUsersTable, createProductsTable } from '@/lib/schema';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
    try {
        // Create tables
        await createProductsTable(sql);
        await createUsersTable(sql);

        // Check if admin user exists
        const users = await sql`SELECT * FROM users WHERE username = 'admin'`;

        if (users.length === 0) {
            const passwordHash = createHash('sha256').update('Bizzcoshop@2025').digest('hex');
            await sql`
                INSERT INTO users (username, password_hash, role, status)
                VALUES ('admin', ${passwordHash}, 'admin', 'active')
            `;
            return NextResponse.json({ message: 'Database initialized and admin user created.' });
        }

        return NextResponse.json({ message: 'Database already initialized.' });
    } catch (error) {
        console.error('Database setup error:', error);
        return NextResponse.json({ error: 'Failed to setup database', details: error }, { status: 500 });
    }
}
