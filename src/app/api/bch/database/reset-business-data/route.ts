import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

// Helper to check if current user is admin
function isAdmin(): boolean {
    const role = cookies().get('admin_user_role')?.value;
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log('[Database Reset] Starting safe reset...');

        // 1. Inventory & Products
        await sql`DELETE FROM master_inventory`;
        await sql`DELETE FROM products`;
        await sql`DELETE FROM featured_products_config`;

        // 2. Sales
        await sql`DELETE FROM orders`;
        await sql`DELETE FROM invoice_items`; // Delete children first
        await sql`DELETE FROM invoice_payments`;
        await sql`DELETE FROM invoices`;
        await sql`DELETE FROM quotation_items`;
        await sql`DELETE FROM quotations`;
        await sql`DELETE FROM customers`;
        await sql`DELETE FROM wishlist`;

        // 3. Purchase & Production
        await sql`DELETE FROM purchase_lot_items`;
        await sql`DELETE FROM purchase_lots`;
        // Try deleting packing tables if they exist
        try { await sql`DELETE FROM packed_items`; } catch (e) { }
        try { await sql`DELETE FROM packing_boxes`; } catch (e) { }

        // 4. Logs
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
