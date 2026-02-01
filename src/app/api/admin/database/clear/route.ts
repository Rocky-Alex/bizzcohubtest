import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';

// Helper to check if current user is admin
function isAdmin() {
    const role = cookies().get('admin_user_role')?.value;
    // Allow 'admin' and 'superadmin'
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

const ALLOWED_TABLES = [
    'products',
    'featured_products_config',
    'orders',
    'customers',
    'users',
    'invoices',
    'quotations',
    'invoice_payments',
    'wishlist',
    'activity_logs'
];

export async function POST(request: NextRequest) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { tableName } = body;

        if (!tableName || !ALLOWED_TABLES.includes(tableName)) {
            return NextResponse.json({ error: 'Invalid or missing table name' }, { status: 400 });
        }

        console.log(`[Database API] Request to clear table: ${tableName}`);

        if (tableName === 'users') {
            // Special handling for users table to prevent locking out
            // We'll keep the superadmin and the current user if possible, 
            // but for a "Clear Database" feature, usually it means wiping everything.
            // However, to be safe, let's try to keep 'superadmin' and 'admin' roles if we can identify them?
            // Or just 'superadmin' username.

            // Let's protect 'superadmin' username and the user making the request (if we had their ID easily)
            // For now, simpler safety: don't delete 'superadmin'

            await sql`DELETE FROM users WHERE username != 'superadmin'`;

            // Also ensure we don't delete the hardcoded admin if it exists in DB differently? 
            // Often there's an initial seed. 
            // But if user requested clear, they probably want to clear everyone else.
        } else {
            // Use unsafe string injection CAREFULLY only after validation against ALLOWED_TABLES
            // sql`DELETE FROM ${sql(tableName)}` is the safe way if the library supports identifier escaping
            // But usually parameterized queries don't support table names.
            // Since we validated against a strict allowlist, we can construct the query.

            // Note: neon-serverless sql tag template literal might not support dynamic table names directly 
            // in all versions without specific helper. 
            // If it supports it: await sql`DELETE FROM ${sql(tableName)}`;
            // If not, we might need a workaround or if the drive handles it. 
            // Let's assume standard behavior: identifiers usually need distinct handling or trusting valid input.

            switch (tableName) {
                case 'products':
                    await sql`DELETE FROM products`;
                    break;
                case 'featured_products_config':
                    await sql`DELETE FROM featured_products_config`;
                    break;
                case 'orders':
                    await sql`DELETE FROM orders`;
                    break;
                case 'customers':
                    await sql`DELETE FROM customers`;
                    break;
                case 'invoices':
                    await sql`DELETE FROM invoices`;
                    // Also clear invoice items via cascade usually, but if not:
                    await sql`DELETE FROM invoice_items`;
                    break;
                case 'quotations':
                    await sql`DELETE FROM quotations`;
                    await sql`DELETE FROM quotation_items`;
                    break;
                case 'invoice_payments':
                    await sql`DELETE FROM invoice_payments`;
                    break;
                case 'wishlist':
                    await sql`DELETE FROM wishlist`;
                    break;
                case 'activity_logs':
                    await sql`DELETE FROM activity_logs`;
                    break;
                default:
                    throw new Error('Table not mapped for deletion');
            }
        }

        await logActivity(
            'Admin',
            'Clear Database',
            `Cleared all data from table: ${tableName}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: `Table ${tableName} cleared successfully` });
    } catch (error: any) {
        console.error('[Database API] Error clearing table:', error);
        return NextResponse.json({ error: 'Failed to clear table', details: error.message }, { status: 500 });
    }
}
