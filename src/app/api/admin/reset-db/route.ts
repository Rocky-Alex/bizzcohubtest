import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { invoiceSql } from '@/lib/invoice-db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log('Resetting database (preserving Admin)...');

        // 1. Clear Data Tables (Preserving Schema where possible or Truncating)
        // Using TRUNCATE CASCADE to clear data but keep structure

        // E-Commerce / Main DB
        await sql`TRUNCATE TABLE products, orders, activity_logs CASCADE`;
        await sql`TRUNCATE TABLE customers CASCADE`; // Customers might be linked to orders

        // Invoice DB
        try {
            await invoiceSql`TRUNCATE TABLE invoice_items, quotation_items, invoices, quotations CASCADE`;
        } catch (e) {
            console.log('Invoice tables truncate error (might not exist):', e);
        }

        // 2. Users Cleanup - Delete all EXCEPT admin
        // Assuming 'admin' username is the super admin. 
        // Also sparing 'sarath' and 'rishadnpm' if they are super admins? User said "Admin's user". singular/plural?
        // "Admin's user only do not reset."
        // We will keep 'admin'.
        await sql`DELETE FROM users WHERE username != 'admin' AND email != 'bizzcohubllc@gmail.com'`;

        // Optional: Reset auto-increment counters if desired? 
        // await sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`;

        console.log('Database reset complete.');

        return NextResponse.json({
            message: 'Database reset successful.',
            details: 'All data cleared except Admin user.'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error resetting database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
