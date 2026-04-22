import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';

// Helper to check if current user is admin
async function isAdmin(): Promise<boolean> {
    const role = (await cookies()).get('admin_user_role')?.value;
    // Allow 'admin' and 'superadmin'
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

const ALLOWED_TABLES = [
    'products',
    'featured_products_config',
    'orders',
    'customers',
    'users',
    'settings',
    'admin_emails',

    'purchase_lots',
    'purchase_lot_items',
    'invoices',
    'invoice_items',
    'quotation_items',
    'roles',
    'quotations',
    'invoice_payments',
    'wishlist',
    'activity_logs'
];

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { tableName, tables } = body;

        const tablesToClear = tables ? (tables as string[]) : (tableName ? [tableName as string] : []);

        if (tablesToClear.length === 0) {
            return NextResponse.json({ error: 'No tables specified' }, { status: 400 });
        }

        // Validate all tables
        for (const t of tablesToClear) {
            if (!ALLOWED_TABLES.includes(t)) {
                return NextResponse.json({ error: `Invalid table name: ${t}` }, { status: 400 });
            }
        }

        console.log(`[Database API] Clearing tables: ${tablesToClear.join(', ')}`);

        for (const t of tablesToClear) {
            if (t === 'users') {
                await sql`DELETE FROM users WHERE username != 'superadmin'`;
            } else {
                switch (t) {
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
                        await sql`DELETE FROM invoice_items`;
                        break;
                    case 'quotations':
                        await sql`DELETE FROM quotations`;
                        await sql`DELETE FROM quotation_items`;
                        break;
                    case 'purchase_lots':
                        await sql`DELETE FROM purchase_lots`;
                        try { await sql`DELETE FROM purchase_lot_items`; } catch (e: unknown) { }
                        break;
                    case 'purchase_lot_items':
                        await sql`DELETE FROM purchase_lot_items`;
                        break;
                    case 'inventory_qc':
                        await sql`DELETE FROM inventory_qc`;
                        break;
                    case 'admin_emails':
                        await sql`DELETE FROM admin_emails`;
                        break;
                    case 'settings':
                        await sql`DELETE FROM settings`;
                        break;
                    case 'roles':
                        await sql`DELETE FROM roles`;
                        break;
                    case 'invoice_items':
                        await sql`DELETE FROM invoice_items`;
                        break;
                    case 'quotation_items':
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
                        console.warn(`[Database API] Table ${t} not explicitly mapped in switch, skipping.`);
                        break;
                }
            }
        }

        await logActivity(
            'Admin',
            'Clear Database',
            `Cleared tables: ${tablesToClear.join(', ')}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: `Database tables cleared successfully` });
    } catch (error: unknown) {
        console.error('[Database API] Error clearing table:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to clear table', details: errorMessage }, { status: 500 });
    }
}
