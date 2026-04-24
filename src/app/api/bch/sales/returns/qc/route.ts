import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { returnId, user } = body;

        if (!returnId) {
            return NextResponse.json({ success: false, error: 'Return ID is required' }, { status: 400 });
        }

        // Migration: ensure columns exist
        try {
            await sql`ALTER TABLE sales_returns ADD COLUMN IF NOT EXISTS notes TEXT`;
            await sql`ALTER TABLE sales_returns ADD COLUMN IF NOT EXISTS qc_confirmed_by TEXT`;
            await sql`ALTER TABLE sales_returns ADD COLUMN IF NOT EXISTS qc_confirmed_at TIMESTAMP`;
        } catch (e) {}

        // Update status to 'Sent to Production'
        // This will make it visible in the Production QC Checking page
        await sql`
            UPDATE sales_returns 
            SET qc_status = 'Sent to Production', 
                qc_confirmed_by = ${user || 'Admin'},
                qc_confirmed_at = NOW(),
                updated_at = NOW()
            WHERE id = ${returnId}
        `;

        await logActivity(
            user || 'Admin',
            'Return Sent to Production QC',
            `Sales Return ID ${returnId} was transferred to Production QC for final checking.`,
            'success',
            user || 'Admin'
        );

        return NextResponse.json({ success: true, message: 'Transferred to Production QC successfully' });

    } catch (error: any) {
        console.error('Error transferring return to QC:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let query;
        if (status) {
            query = sql`
                SELECT sr.*, so.barcode, so.product_name, so.invoice_no, so.customer_name, so.unit_price, so.quantity,
                       COALESCE(so.ram, mi.ram) as ram,
                       COALESCE(so.storage, mi.storage) as ssd,
                       COALESCE(so.graphics, mi.graphics_card) as gpu,
                       COALESCE(so.processor_gen, mi.processor_gen) as generation,
                       mi.brand, mi.model, mi.processor
                FROM sales_returns sr
                LEFT JOIN sale_out so ON sr.sales_out_id = so.id
                LEFT JOIN master_inventory mi ON sr.inventory_id = mi.id
                WHERE sr.qc_status = ${status}
                ORDER BY sr.updated_at DESC
            `;
        } else {
            query = sql`
                SELECT sr.*, so.barcode, so.product_name, so.invoice_no, so.customer_name, so.unit_price, so.quantity,
                       COALESCE(so.ram, mi.ram) as ram,
                       COALESCE(so.storage, mi.storage) as ssd,
                       COALESCE(so.graphics, mi.graphics_card) as gpu,
                       COALESCE(so.processor_gen, mi.processor_gen) as generation,
                       mi.brand, mi.model, mi.processor
                FROM sales_returns sr
                LEFT JOIN sale_out so ON sr.sales_out_id = so.id
                LEFT JOIN master_inventory mi ON sr.inventory_id = mi.id
                ORDER BY sr.updated_at DESC
            `;
        }

        const returns = await query as unknown as any[];
        console.log(`[API] Found ${returns.length} sales returns`);
        return NextResponse.json({ success: true, returns });

    } catch (error: any) {
        console.error('Error fetching sales returns:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
