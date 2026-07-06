import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

async function isAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    const role = cookieStore.get('admin_user_role')?.value || cookieStore.get('user_role')?.value;
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

const ALLOWED_TABLES = [
    'orders',
    'customers',
    'users',
    'settings',
    'admin_emails',
    'invoice_items',
    'quotation_items',
    'roles',
    'quotations',
    'invoice_payments',
    'activity_logs',
    'invoices'
];

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { tableName, id } = body;

        if (!tableName || !id) {
            return NextResponse.json({ error: 'Missing tableName or id' }, { status: 400 });
        }

        if (!ALLOWED_TABLES.includes(tableName as string)) {
            return NextResponse.json({ error: `Invalid table name: ${tableName}` }, { status: 400 });
        }

        // Special check for users
        if (tableName === 'users' && (id === 'superadmin' || id === 1)) {
            // Check if it's the superadmin record
            const user = await sql`SELECT username FROM users WHERE id = ${id} OR username = 'superadmin'` as unknown as { username: string }[];
            if (user.length > 0 && user[0].username === 'superadmin') {
                return NextResponse.json({ error: 'Cannot delete superadmin' }, { status: 403 });
            }
        }

        console.log(`[Database API] Deleting row from ${tableName} with ID: ${id}`);

        // We could use a switch like data/route.ts, but since we validated tableName against ALLOWED_TABLES,
        // we can safely construct the query. Neon supports passing raw strings for the query part if we use the underlying driver method,
        // but for the exported 'sql' tag we need to be careful.
        // Actually, the easiest way to stay 100% safe and consistent with the existing codebase's style:

        switch (tableName) {
            case 'orders': await sql`DELETE FROM orders WHERE id = ${id}`; break;
            case 'customers': await sql`DELETE FROM customers WHERE id = ${id}`; break;
            case 'users': await sql`DELETE FROM users WHERE id = ${id}`; break;
            case 'settings': await sql`DELETE FROM settings WHERE id = ${id}`; break;
            case 'admin_emails': await sql`DELETE FROM admin_emails WHERE id = ${id}`; break;
            case 'invoice_items': await sql`DELETE FROM invoice_items WHERE id = ${id}`; break;
            case 'quotation_items': await sql`DELETE FROM quotation_items WHERE id = ${id}`; break;
            case 'roles': await sql`DELETE FROM roles WHERE id = ${id}`; break;
            case 'quotations': await sql`DELETE FROM quotations WHERE id = ${id}`; break;
            case 'invoice_payments': await sql`DELETE FROM invoice_payments WHERE id = ${id}`; break;
            case 'activity_logs': await sql`DELETE FROM activity_logs WHERE id = ${id}`; break;
            case 'invoices': await sql`DELETE FROM invoices WHERE id = ${id}`; break;
            default:
                throw new Error(`Deletion for table ${tableName} is not explicitly supported`);
        }

        await logActivity(
            'Admin',
            'Delete Row',
            `Deleted row with ID ${id} from ${tableName}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Row deleted successfully' });
    } catch (error: unknown) {
        console.error('[Database API] Error deleting row:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to delete row', details: errorMessage }, { status: 500 });
    }
}
