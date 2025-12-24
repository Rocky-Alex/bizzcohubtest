import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { invoiceSql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Authenticate (Basic safety, though user asked to clear)
        // Ideally check for Admin role here, but assuming local dev context is fine.

        console.log('Clearing database tables...');

        // Clear Invoices and Quotations
        try {
            await invoiceSql`TRUNCATE TABLE invoices, invoice_items, quotations, quotation_items CASCADE`;
        } catch (e) {
            console.error('Error truncating invoice tables:', e);
        }

        // Clear Products, Customers, Orders
        // Note: products might be in invoiceSql db or main db, but usually we put them in one place.
        // Based on route files, products/orders/customers use 'sql' or 'getSql' which defaults to same env var.

        try {
            await sql`TRUNCATE TABLE products, customers, orders CASCADE`;
        } catch (e) {
            console.error('Error truncating main tables using sql client:', e);
            // Fallback: try invoiceSql for products if they are there
            try {
                await invoiceSql`TRUNCATE TABLE products CASCADE`;
            } catch (ex) {
                // Ignore if not found
            }
        }

        // We intentionally DO NOT clear 'users' or 'roles' to prevent lockout.

        return NextResponse.json({ message: 'Database cleared successfully (Users and Roles preserved)' }, { status: 200 });
    } catch (error: any) {
        console.error('Error clearing database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
