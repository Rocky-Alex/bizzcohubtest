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

        // Ensure sale_out has updated_at column
        try {
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
        } catch (e) {
            console.log('Migration note (sale_out):', e);
        }

        // 1. Get the return record
        const returnResult = await sql`
            SELECT sr.*, so.barcode 
            FROM sales_returns sr
            JOIN sale_out so ON sr.sales_out_id = so.id
            WHERE sr.id = ${returnId}
        ` as unknown as any[];

        if (returnResult.length === 0) {
            return NextResponse.json({ success: false, error: 'Return record not found' }, { status: 404 });
        }

        const ret = returnResult[0];
        if (ret.qc_status === 'Confirmed QC') {
            return NextResponse.json({ success: false, error: 'Return already confirmed' }, { status: 400 });
        }

        // 2. Update Return Status
        await sql`
            UPDATE sales_returns 
            SET qc_status = 'Confirmed QC', 
                qc_confirmed_by = ${user || 'Admin'}, 
                qc_confirmed_at = NOW(), 
                updated_at = NOW()
            WHERE id = ${returnId}
        `;

        // 3. Update sale_out Status
        await sql`
            UPDATE sale_out 
            SET status = 'Restocked', updated_at = NOW()
            WHERE id = ${ret.sales_out_id}
        `;

        // 4. Restock logic is now handled via the calculated balance in the UI.
        // We no longer update the physical quantity column to avoid double-counting.
        // The item is automatically added back to the "available" pool when its sale record 
        // is marked as returned or restocked.

        await logActivity(
            user || 'Admin',
            'Return Confirmed QC',
            `Sales Return ID ${returnId} confirmed. Restocked Barcode ${ret.barcode} to Master Inventory.`,
            'success',
            user || 'Admin'
        );

        return NextResponse.json({ success: true, message: 'QC Confirmed and Item Restocked' });

    } catch (error: any) {
        console.error('Error confirming return QC:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
