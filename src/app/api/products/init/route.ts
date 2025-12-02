import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createProductsTable } from '@/lib/schema';

// POST /api/products/init - Initialize database tables
export async function POST(request: NextRequest) {
    try {
        // Drop existing table to recreate with new schema
        await sql`DROP TABLE IF EXISTS products CASCADE`;

        await createProductsTable(sql);

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
