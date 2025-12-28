import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Ensure table exists (in case it hasn't been created yet)
        await sql`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_name TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                status TEXT,
                role TEXT,
                ip TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const data = await sql`
            SELECT 
                id, 
                user_name, 
                action, 
                details, 
                status, 
                role, 
                ip, 
                to_char(timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as timestamp
            FROM activity_logs 
            ORDER BY timestamp DESC
            LIMIT 500
        `;

        // Map database fields to frontend interface
        const logs = data.map((log: any) => ({
            id: log.id,
            user: log.user_name,
            action: log.action,
            details: log.details || '',
            status: log.status,
            role: log.role,
            ip: log.ip,
            timestamp: log.timestamp || new Date().toISOString(),
            // Avatar is not stored in logs, would ideally come from a user join or default
            avatar: null
        }));

        // Log view removed as requested to avoid clutter

        return NextResponse.json(logs, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, details, status, role, user_name } = body;

        // Basic validation
        if (!action || !user_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await logActivity(
            user_name,
            action,
            details || '',
            status || 'success',
            role || 'User'
        );

        return NextResponse.json({ message: 'Activity logged successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Error logging activity:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
        }

        const result = await sql`
            DELETE FROM activity_logs WHERE id = ${id} RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Log deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting log:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
