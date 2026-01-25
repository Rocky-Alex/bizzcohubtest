import { sql } from '@/lib/db';

export async function logActivity(
    user: string,
    action: string,
    details: string,
    status: 'success' | 'failure' | 'pending' = 'success',
    role: string = 'User',
    ip?: string
) {
    try {
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

        await sql`
            INSERT INTO activity_logs (user_name, action, details, status, role, ip)
            VALUES (${user}, ${action}, ${details}, ${status}, ${role}, ${ip || null})
        `;
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}
