import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name') || 'default_label';

        const rows = await sql`
            SELECT config FROM label_settings WHERE name = ${name}
        `;

        if (rows.length > 0) {
            return NextResponse.json({ success: true, config: rows[0].config });
        } else {
            return NextResponse.json({ success: false, message: 'Settings not found' });
        }
    } catch (error) {
        console.error('Error fetching label settings:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { config, name = 'default_label' } = body;

        await sql`
            INSERT INTO label_settings (name, config, updated_at)
            VALUES (${name}, ${config}, NOW())
            ON CONFLICT (name) 
            DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving label settings:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
