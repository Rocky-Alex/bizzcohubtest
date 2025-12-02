import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
    try {
        // Create products table
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                brand VARCHAR(100),
                price DECIMAL(10, 2) NOT NULL,
                offer_price DECIMAL(10, 2),
                stock INTEGER DEFAULT 0,
                condition VARCHAR(50),
                discount INTEGER DEFAULT 0,
                type VARCHAR(50),
                category VARCHAR(100),
                processor VARCHAR(255),
                ram VARCHAR(50),
                storage VARCHAR(50),
                screen VARCHAR(50),
                graphics VARCHAR(255),
                graphics_storage VARCHAR(50),
                feature TEXT,
                about TEXT,
                features TEXT,
                badge VARCHAR(50),
                image TEXT,
                date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create users table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                role VARCHAR(20) DEFAULT 'user',
                status VARCHAR(20) DEFAULT 'pending',
                approval_status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Check if admin user exists
        const users = await sql`SELECT * FROM users WHERE username = 'admin'`;

        if (users.length === 0) {
            const passwordHash = createHash('sha256').update('Bizzcoshop@2025').digest('hex');
            await sql`
                INSERT INTO users (username, password_hash, role, status, approval_status)
                VALUES ('admin', ${passwordHash}, 'admin', 'active', 'approved')
            `;
            return NextResponse.json({ message: 'Database initialized and admin user created.' });
        }

        return NextResponse.json({ message: 'Database already initialized.' });
    } catch (error) {
        console.error('Database setup error:', error);
        return NextResponse.json({ error: 'Failed to setup database', details: error }, { status: 500 });
    }
}
