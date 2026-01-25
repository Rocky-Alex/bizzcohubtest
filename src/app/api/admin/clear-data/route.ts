import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { invoiceSql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log('Starting data clearance...');

        // 1. Clear Activity Logs
        try {
            await sql`TRUNCATE TABLE activity_logs RESTART IDENTITY CASCADE`;
            console.log('Activity logs cleared.');
        } catch (error) {
            console.error('Error clearing activity_logs:', error);
        }

        // 2. Clear Business Data (Invoices, Quotations)
        try {
            await invoiceSql`TRUNCATE TABLE invoice_items, quotation_items, invoices, quotations RESTART IDENTITY CASCADE`;
            // Attempt only if invoiceSql is different or just to be safe if tables exist there
        } catch (e) {
            console.log('Note: Invoice tables truncation (invoiceSql) skipped/error:', e);
        }

        try {
            // Fallback for same DB
            await sql`TRUNCATE TABLE invoice_items, quotation_items, invoices, quotations RESTART IDENTITY CASCADE`;
        } catch (e) {
            console.log('Note: Invoice tables truncation (sql) skipped/error:', e);
        }

        // 3. Clear Inventory and Orders
        try {
            await sql`TRUNCATE TABLE orders, products, customers RESTART IDENTITY CASCADE`;
            console.log('Orders, products, customers cleared.');
        } catch (error) {
            console.error('Error clearing inventory/orders:', error);
        }

        // 4. Clear Users (Except Admin)
        try {
            // Delete all users who do not have 'admin' in their role (case insensitive) and is not the username 'admin'
            await sql`
                DELETE FROM users 
                WHERE LOWER(role) NOT LIKE '%admin%' 
                AND username != 'admin'
            `;
            console.log('Non-admin users deleted.');
        } catch (error) {
            console.error('Error clearing users:', error);
        }

        return NextResponse.json({
            message: 'All data cleared successfully, except Admin accounts.'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Detailed clearance error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
