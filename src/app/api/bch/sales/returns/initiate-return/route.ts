import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { salesOutId, returnReason, user } = body;

        if (!salesOutId) {
            return NextResponse.json({ success: false, error: 'Sales Out ID is required' }, { status: 400 });
        }

        // 0. Ensure tables exist
        await sql`
            CREATE TABLE IF NOT EXISTS sales_returns (
                id SERIAL PRIMARY KEY,
                sales_out_id INTEGER,
                inventory_id INTEGER,
                return_reason TEXT,
                qc_status TEXT DEFAULT 'Pending QC',
                initiated_by TEXT,
                initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                qc_confirmed_by TEXT,
                qc_confirmed_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Ensure sale_out has necessary columns
        try {
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
            await sql`ALTER TABLE sale_out ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Sold Out'`;
        } catch (e) {
            console.log('Migration note (sale_out):', e);
        }

        // 1. Verify Sales Out record
        const salesOutResult = await sql`
            SELECT * FROM sale_out WHERE id = ${salesOutId}
        ` as unknown as any[];

        if (salesOutResult.length === 0) {
            return NextResponse.json({ success: false, error: 'Sales record not found' }, { status: 404 });
        }

        const sale = salesOutResult[0];
        if (sale.status === 'Return Initiated') {
            return NextResponse.json({ success: false, error: 'Return already initiated' }, { status: 400 });
        }

        // 2. Insert into sales_returns
        await sql`
            INSERT INTO sales_returns (sales_out_id, inventory_id, return_reason, qc_status, initiated_by)
            VALUES (${salesOutId}, ${sale.inventory_id}, ${returnReason || 'Customer Return'}, 'Pending QC', ${user || 'Admin'})
        `;

        // 3. Update sale_out status
        await sql`
            UPDATE sale_out 
            SET status = 'Return Initiated', updated_at = NOW()
            WHERE id = ${salesOutId}
        `;

        await logActivity(
            user || 'Admin',
            'Sales Return',
            `Initiated return for Barcode ${sale.barcode} from Invoice ${sale.invoice_no}`,
            'pending',
            user || 'Admin'
        );

        return NextResponse.json({ success: true, message: 'Sales Return Initiated Successfully' });

    } catch (error: any) {
        console.error('Error initiating return:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
