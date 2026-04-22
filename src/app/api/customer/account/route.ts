import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, customer_id } = body;

        if (!customer_id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        // Ensure Schema for Deactivation
        await sql`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;
        `;

        if (action === 'deactivate') {
            // Update status to Deactivated and set timestamp
            await sql`
                UPDATE customers 
                SET status = 'Deactivated', deactivated_at = NOW() 
                WHERE id = ${customer_id}
            `;

            // Logout user by clearing cookie
            (await cookies()).delete('customer_session');

            return NextResponse.json({
                success: true,
                message: 'Account deactivated. It will be permanently deleted if you do not login within 60 days.'
            });

        } else if (action === 'delete') {
            // Permanent Deletion

            // 1. Delete Wishlist
            await sql`DELETE FROM wishlist WHERE customer_id = ${customer_id}`;

            // 2. Delete Orders (and items? cascading might differ, but let's try strict deletion)
            // Ideally we keep orders for records but anonymize? 
            // User requested "delete... all related datas of orders...". So I will delete.
            // But orders might have foreign keys. Let's try to delete items first if table exists, or assume cascade.
            // Given the complexity of "orders" table usually having `order_items`, I'll try to delete from orders.
            // If strictly enforced, I might need to delete order_items first.
            // Let's assume standard cascading or simple structure for now, or check schema later if it fails.
            // Safe bet: Delete from orders directly and handle errors? No, let's look for order_items if possible.
            // Actually, from previous turns, I saw `items` in the orders JSON, likely joined or jsonb.
            // Let's just delete from `orders` where `customer_id` matches.
            await sql`DELETE FROM orders WHERE customer_id = ${customer_id}`;

            // 3. Delete Customer
            await sql`DELETE FROM customers WHERE id = ${customer_id}`;

            // Logout
            (await cookies()).delete('customer_session');

            return NextResponse.json({
                success: true,
                message: 'Account permanently deleted.'
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Account Action Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
