import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { ActivityLog } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
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
        ` as unknown as Record<string, unknown>[];

        // Map database fields to frontend interface
        const logs: ActivityLog[] = data.map((log) => ({
            id: Number(log.id),
            user: String(log.user_name),
            action: String(log.action),
            details: String(log.details || ''),
            status: String(log.status),
            role: String(log.role),
            ip: log.ip ? String(log.ip) : null,
            timestamp: String(log.timestamp || new Date().toISOString()),
            // Avatar is not stored in logs, would ideally come from a user join or default
            avatar: null
        }));

        // Log view removed as requested to avoid clutter

        return NextResponse.json(logs, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching activity logs:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
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
    } catch (error: unknown) {
        console.error('Error logging activity:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const all = searchParams.get('all');
        const password = req.headers.get('x-admin-password');

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 401 });
        }

        // Verify password (Master Password)
        const MASTER_PASSWORD = 'bizzcohub@gmail.com@admin';

        if (password !== MASTER_PASSWORD) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        if (all === 'true') {
            await sql`TRUNCATE TABLE activity_logs RESTART IDENTITY CASCADE`;
            return NextResponse.json({ message: 'All logs cleared successfully' }, { status: 200 });
        }

        if (!id) {
            return NextResponse.json({ error: 'Log ID or all=true is required' }, { status: 400 });
        }

        const result = await sql`
            DELETE FROM activity_logs WHERE id = ${id} RETURNING id
        ` as unknown as { id: number }[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Log deleted successfully' }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error deleting log:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
