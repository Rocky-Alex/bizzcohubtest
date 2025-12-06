import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/migrate - Run database migrations
export async function POST(request: NextRequest) {
    try {
        // Add colors column if it doesn't exist
        await sql`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS colors TEXT
        `;

        console.log('✅ Migration completed: Added colors column');

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully',
            migrations: ['Added colors column to products table']
        }, { status: 200 });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: 'Migration failed', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/migrate - Check migration status
export async function GET(request: NextRequest) {
    try {
        // Check if colors column exists
        const result = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'colors'
        `;

        const colorsColumnExists = result.length > 0;

        return NextResponse.json({
            status: 'ok',
            migrations: {
                colors_column: colorsColumnExists ? 'exists' : 'missing'
            }
        }, { status: 200 });
    } catch (error: any) {
        console.error('Migration check error:', error);
        return NextResponse.json(
            { error: 'Failed to check migrations', details: error.message },
            { status: 500 }
        );
    }
}
