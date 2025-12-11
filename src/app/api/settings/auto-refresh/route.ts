import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { sql } from '@/lib/db';

// GET /api/settings/auto-refresh - Get auto-refresh settings
export async function GET(request: NextRequest) {
    try {
        // Try to get settings from database
        const result = await sql`
            SELECT * FROM settings WHERE key = 'auto_refresh' LIMIT 1
        `;

        if (result.length > 0) {
            const settings = JSON.parse(result[0].value);
            return NextResponse.json({ settings }, { status: 200 });
        }

        // Return default settings if not found
        return NextResponse.json({
            settings: {
                enabled: false,
                hours: 0,
                minutes: 1,
                seconds: 0
            }
        }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching auto-refresh settings:', error);

        // If table doesn't exist, return default settings
        if (error.message && error.message.includes('relation "settings" does not exist')) {
            console.warn('⚠️ Settings table does not exist. Creating it...');
            try {
                // Create settings table
                await sql`
                    CREATE TABLE IF NOT EXISTS settings (
                        id SERIAL PRIMARY KEY,
                        key VARCHAR(255) UNIQUE NOT NULL,
                        value TEXT NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `;
                console.log('✅ Settings table created successfully');

                // Return default settings
                return NextResponse.json({
                    settings: {
                        enabled: false,
                        hours: 0,
                        minutes: 1,
                        seconds: 0
                    }
                }, { status: 200 });
            } catch (createError: any) {
                console.error('Error creating settings table:', createError);
                return NextResponse.json(
                    { error: 'Failed to create settings table', details: createError.message },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to fetch settings', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/settings/auto-refresh - Save auto-refresh settings
export async function POST(request: NextRequest) {
    try {
        const { enabled, hours, minutes, seconds } = await request.json();

        // Validate input
        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 });
        }

        const settingsValue = JSON.stringify({
            enabled,
            hours: parseInt(hours) || 0,
            minutes: parseInt(minutes) || 0,
            seconds: parseInt(seconds) || 0
        });

        // Ensure settings table exists
        await sql`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Insert or update settings
        const result = await sql`
            INSERT INTO settings (key, value, updated_at)
            VALUES ('auto_refresh', ${settingsValue}, CURRENT_TIMESTAMP)
            ON CONFLICT (key) 
            DO UPDATE SET value = ${settingsValue}, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        return NextResponse.json({
            message: 'Settings saved successfully',
            settings: JSON.parse(result[0].value)
        }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving auto-refresh settings:', error);
        return NextResponse.json(
            { error: 'Failed to save settings', details: error.message },
            { status: 500 }
        );
    }
}
