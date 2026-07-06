import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function isAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    // Login route sets 'admin_user_role', but some parts might use 'user_role'
    const role = cookieStore.get('admin_user_role')?.value || cookieStore.get('user_role')?.value;
    console.log('[Database API] Auth Check. Role:', role);
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

// Reuse or import ALLOWED_TABLES to prevent SQL Injection
const ALLOWED_TABLES = [
    'orders', 'invoices', 'invoice_items', 'invoice_payments', 'quotations', 'quotation_items', 'quotation_payments', 'receipt_list',
    'users', 'roles', 'password_resets', 'admin_emails',
    'customers',
    'settings', 'drop_lists', 'activity_logs'
];

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tableName = searchParams.get('table');
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        if (!tableName || !ALLOWED_TABLES.includes(tableName)) {
            return NextResponse.json({ error: 'Invalid or missing table name' }, { status: 400 });
        }

        // Use the db wrapper to allow dynamic table names safely via the allowed list
        // Note: For Neon, we need to be careful with parameterized identifiers.
        // Since we already validated against ALLOWED_TABLES, we can use a raw string for the table name safely.
        
        const data = await sql(`SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`) as unknown as any[];
        const countResult = await sql(`SELECT COUNT(*) as total FROM ${tableName}`) as unknown as { total: string | number }[];

        console.log(`[Database API] Fetched ${data.length} rows`);
        const total = Number(countResult[0]?.total || 0);

        // Get columns from first row if exists, or query information_schema if empty (optional)
        // For simple view, if empty, we just show empty table.
        let columns: string[] = [];
        if (data.length > 0) {
            columns = Object.keys(data[0]);
        }

        return NextResponse.json({
            data,
            total,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit),
            columns
        });

    } catch (error: unknown) {
        console.error('Error fetching table data:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
