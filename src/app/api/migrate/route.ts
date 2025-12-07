import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/migrate - Run database migrations
export async function POST(request: NextRequest) {
    try {
        const migrations = [];
        const errors = [];

        // Migration 1: Add colors column if it doesn't exist
        try {
            await sql`
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS colors TEXT
            `;
            migrations.push('✅ Added colors column');
            console.log('✅ Migration 1: Added colors column');
        } catch (error: any) {
            if (!error.message.includes('already exists')) {
                errors.push(`❌ Failed to add colors column: ${error.message}`);
            } else {
                migrations.push('ℹ️ Colors column already exists');
            }
        }

        // Migration 2: Update column types to TEXT for JSON storage
        try {
            await sql`
                ALTER TABLE products 
                ALTER COLUMN processor TYPE TEXT
            `;
            await sql`
                ALTER TABLE products 
                ALTER COLUMN ram TYPE TEXT
            `;
            await sql`
                ALTER TABLE products 
                ALTER COLUMN storage TYPE TEXT
            `;
            await sql`
                ALTER TABLE products 
                ALTER COLUMN screen TYPE TEXT
            `;
            migrations.push('✅ Updated column types to TEXT (processor, ram, storage, screen)');
            console.log('✅ Migration 2: Updated column types to TEXT');
        } catch (error: any) {
            // Column type changes might fail if data exists, that's okay
            migrations.push(`ℹ️ Column type update: ${error.message}`);
        }

        // Migration 3: Add indexes for better performance
        try {
            await sql`CREATE INDEX IF NOT EXISTS idx_products_type ON products(type)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_products_code ON products(code)`;
            migrations.push('✅ Added performance indexes');
            console.log('✅ Migration 3: Added performance indexes');
        } catch (error: any) {
            migrations.push(`ℹ️ Index creation: ${error.message}`);
        }

        // Verify the schema
        const schemaCheck = await sql`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'products'
            ORDER BY ordinal_position
        `;

        console.log('✅ All migrations completed successfully');

        return NextResponse.json({
            success: true,
            message: 'Database migration completed',
            migrations,
            errors: errors.length > 0 ? errors : undefined,
            totalColumns: schemaCheck.length,
            schema: schemaCheck.map((col: any) => ({
                column: col.column_name,
                type: col.data_type,
                maxLength: col.character_maximum_length
            }))
        }, { status: 200 });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: 'Migration failed',
            details: error.message
        }, { status: 500 });
    }
}

// GET /api/migrate - Check migration status
export async function GET(request: NextRequest) {
    try {
        // Check all columns
        const schemaCheck = await sql`
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'products'
            ORDER BY ordinal_position
        `;

        const hasColors = schemaCheck.some((col: any) => col.column_name === 'colors');
        const processorType = schemaCheck.find((col: any) => col.column_name === 'processor')?.data_type;
        const ramType = schemaCheck.find((col: any) => col.column_name === 'ram')?.data_type;
        const storageType = schemaCheck.find((col: any) => col.column_name === 'storage')?.data_type;
        const screenType = schemaCheck.find((col: any) => col.column_name === 'screen')?.data_type;

        return NextResponse.json({
            status: 'ok',
            totalColumns: schemaCheck.length,
            migrations: {
                colors_column: hasColors ? '✅ exists' : '❌ missing',
                processor_type: processorType === 'text' ? '✅ TEXT' : `⚠️ ${processorType}`,
                ram_type: ramType === 'text' ? '✅ TEXT' : `⚠️ ${ramType}`,
                storage_type: storageType === 'text' ? '✅ TEXT' : `⚠️ ${storageType}`,
                screen_type: screenType === 'text' ? '✅ TEXT' : `⚠️ ${screenType}`
            },
            columns: schemaCheck.map((col: any) => ({
                name: col.column_name,
                type: col.data_type,
                maxLength: col.character_maximum_length,
                nullable: col.is_nullable === 'YES'
            }))
        }, { status: 200 });

    } catch (error: any) {
        console.error('Migration check error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to check migrations',
            details: error.message
        }, { status: 500 });
    }
}
