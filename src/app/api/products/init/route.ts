import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// POST /api/products/init - Initialize database tables
export async function POST(request: NextRequest) {
    try {
        // Drop existing table to recreate with new schema
        await sql`DROP TABLE IF EXISTS products CASCADE`;

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

        return NextResponse.json(
            { message: 'Database tables created successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error initializing database:', error);
        return NextResponse.json(
            { error: 'Failed to initialize database', details: error.message },
            { status: 500 }
        );
    }
}
