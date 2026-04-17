import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'chart_of_accounts') {
            const data = await sql`SELECT * FROM chart_of_accounts ORDER BY category, account_name`;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'users') {
            // Check if authorized_accountants exists, otherwise return empty
            try {
                const data = await sql`SELECT id, username, user_id, has_access, created_at FROM authorized_accountants`;
                return NextResponse.json({ success: true, data });
            } catch (e) {
                // Table doesn't exist yet, that's fine
                return NextResponse.json({ success: true, data: [] });
            }
        }

        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'add_account') {
            const { name, type, category } = body;
            const res = await sql`
                INSERT INTO chart_of_accounts (account_name, account_type, category) 
                VALUES (${name}, ${type}, ${category}) 
                RETURNING account_id
            `;
            return NextResponse.json({ success: true, account_id: res[0]?.account_id });
        }

        if (action === 'grant_access') {
            const { username, user_id } = body;
            
            // Auto provision table if not exists since we skipped it previously for speed
            await sql`
                CREATE TABLE IF NOT EXISTS authorized_accountants (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER UNIQUE,
                    username VARCHAR(100) NOT NULL,
                    has_access BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Insert or update access
            await sql`
                INSERT INTO authorized_accountants (user_id, username, has_access)
                VALUES (${user_id}, ${username}, true)
                ON CONFLICT (user_id) DO UPDATE SET has_access = true, username = EXCLUDED.username
            `;
            return NextResponse.json({ success: true });
        }

        if (action === 'revoke_access') {
            const { user_id } = body;
            await sql`UPDATE authorized_accountants SET has_access = false WHERE user_id = ${user_id}`;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid operation' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
