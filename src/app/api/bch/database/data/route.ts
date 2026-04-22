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
    'products',
    'featured_products_config',
    'orders',
    'customers',
    'users',
    'settings',
    'admin_emails',

    'purchase_lots',
    'purchase_lot_items',
    'invoice_items',
    'quotation_items',
    'roles',
    'quotations',
    'invoice_payments',
    'wishlist',
    'activity_logs',
    'invoices'
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

        // Fetch Data
        console.log(`[Database API] Fetching data for ${tableName} (Limit: ${limit}, Offset: ${offset})`);

        let data: any[] = [];
        let countResult: { total: string | number }[] = [{ total: 0 }];

        switch (tableName) {
            case 'products':
                data = await sql`SELECT * FROM products LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM products` as unknown as { total: string | number }[];
                break;
            case 'featured_products_config':
                data = await sql`SELECT * FROM featured_products_config LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM featured_products_config` as unknown as { total: string | number }[];
                break;
            case 'orders':
                data = await sql`SELECT * FROM orders LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM orders` as unknown as { total: string | number }[];
                break;
            case 'customers':
                data = await sql`SELECT * FROM customers LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM customers` as unknown as { total: string | number }[];
                break;
            case 'users':
                data = await sql`SELECT * FROM users LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM users` as unknown as { total: string | number }[];
                break;
            case 'settings':
                data = await sql`SELECT * FROM settings LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM settings` as unknown as { total: string | number }[];
                break;
            case 'admin_emails':
                data = await sql`SELECT * FROM admin_emails LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM admin_emails` as unknown as { total: string | number }[];
                break;
            case 'inventory_qc':
                data = await sql`SELECT * FROM inventory_qc LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM inventory_qc` as unknown as { total: string | number }[];
                break;
            case 'purchase_lots':
                data = await sql`SELECT * FROM purchase_lots LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM purchase_lots` as unknown as { total: string | number }[];
                break;
            case 'purchase_lot_items':
                data = await sql`SELECT * FROM purchase_lot_items LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM purchase_lot_items` as unknown as { total: string | number }[];
                break;
            case 'invoice_items':
                data = await sql`SELECT * FROM invoice_items LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM invoice_items` as unknown as { total: string | number }[];
                break;
            case 'quotation_items':
                data = await sql`SELECT * FROM quotation_items LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM quotation_items` as unknown as { total: string | number }[];
                break;
            case 'roles':
                data = await sql`SELECT * FROM roles LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM roles` as unknown as { total: string | number }[];
                break;
            case 'quotations':
                data = await sql`SELECT * FROM quotations LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM quotations` as unknown as { total: string | number }[];
                break;
            case 'invoice_payments':
                data = await sql`SELECT * FROM invoice_payments LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM invoice_payments` as unknown as { total: string | number }[];
                break;
            case 'wishlist':
                data = await sql`SELECT * FROM wishlist LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM wishlist` as unknown as { total: string | number }[];
                break;
            case 'activity_logs':
                data = await sql`SELECT * FROM activity_logs LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM activity_logs` as unknown as { total: string | number }[];
                break;
            case 'invoices':
                data = await sql`SELECT * FROM invoices LIMIT ${limit} OFFSET ${offset}` as unknown as any[];
                countResult = await sql`SELECT COUNT(*) as total FROM invoices` as unknown as { total: string | number }[];
                break;
            default:
                throw new Error(`Table ${tableName} is not supported`);
        }

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
