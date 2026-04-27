import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { salesOutId, returnReason, user, quantity: returnQuantity } = body;
        const qtyToReturn = parseInt(returnQuantity) || 1;

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
                quantity INTEGER DEFAULT 1,
                qc_count INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Migration: Ensure quantity column exists for existing tables
        try {
            await sql`ALTER TABLE sales_returns ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1`;
            await sql`ALTER TABLE sales_returns ADD COLUMN IF NOT EXISTS qc_count INTEGER DEFAULT 0`;
            // Backfill quantity from sale_out if it's currently null
            await sql`
                UPDATE sales_returns sr
                SET quantity = COALESCE(so.quantity, 1)
                FROM sale_out so
                WHERE sr.sales_out_id = so.id AND sr.quantity IS NULL
            `;
        } catch (e) {
            console.log('Migration note (sales_returns):', e);
        }

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
        const currentQty = sale.quantity || 1;

        if (qtyToReturn > currentQty) {
            return NextResponse.json({ success: false, error: `Cannot return more than sold (${currentQty})` }, { status: 400 });
        }

        // 2. Logic for partial vs full return
        if (qtyToReturn === currentQty) {
            // Full Return
            await sql`
                UPDATE sale_out 
                SET status = 'Returned', updated_at = NOW()
                WHERE id = ${salesOutId}
            `;
        } else {
            // Partial Return
            await sql`
                UPDATE sale_out 
                SET quantity = quantity - ${qtyToReturn}, updated_at = NOW()
                WHERE id = ${salesOutId}
            `;
        }

        // 3. Insert into sales_returns
        await sql`
            INSERT INTO sales_returns (sales_out_id, inventory_id, return_reason, qc_status, initiated_by, quantity, qc_count)
            VALUES (${salesOutId}, ${sale.inventory_id}, ${returnReason || 'Customer Return'}, 'Pending QC', ${user || 'Admin'}, ${qtyToReturn}, 0)
        `;

        await logActivity(
            user || 'Admin',
            'Sales Return',
            `Initiated return for ${qtyToReturn} units of Barcode ${sale.barcode} from Invoice ${sale.invoice_no}`,
            'pending',
            user || 'Admin'
        );

        return NextResponse.json({ success: true, message: `Sales Return of ${qtyToReturn} units Initiated Successfully` });

    } catch (error: any) {
        console.error('Error initiating return:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
