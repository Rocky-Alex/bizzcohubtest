import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

// Helper to check if current user is admin
async function isAdmin(): Promise<boolean> {
    const role = (await cookies()).get('admin_user_role')?.value;
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log('[Database Reset] Starting safe reset...');

        // 1. Sales & Billing
        await sql`DELETE FROM orders`;
        await sql`DELETE FROM invoice_items`; // Delete children first
        await sql`DELETE FROM invoice_payments`;
        await sql`DELETE FROM invoices`;
        await sql`DELETE FROM quotation_items`;
        await sql`DELETE FROM quotations`;
        await sql`DELETE FROM customers`;

        // 2. Logs
        await sql`DELETE FROM activity_logs`;
        await sql`DELETE FROM admin_emails`;

        // PRESERVED: users, roles, settings

        console.log('[Database Reset] Completed successfully.');

        return NextResponse.json({
            success: true,
            message: 'All business data has been cleared. User accounts preserved.'
        });

    } catch (error: any) {
        console.error('Reset Error:', error);
        return NextResponse.json(
            { error: 'Failed to reset database: ' + error.message },
            { status: 500 }
        );
    }
}
