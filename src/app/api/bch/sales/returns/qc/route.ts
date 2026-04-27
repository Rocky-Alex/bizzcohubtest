import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { returnId, user, quantity: sendQuantity } = body;
        const qtyToSend = parseInt(sendQuantity) || 1;

        if (!returnId) {
            return NextResponse.json({ success: false, error: 'Return ID is required' }, { status: 400 });
        }

        // 1. Fetch current return record
        const returnResult = await sql`
            SELECT * FROM sales_returns WHERE id = ${returnId}
        ` as unknown as any[];

        if (returnResult.length === 0) {
            return NextResponse.json({ success: false, error: 'Return record not found' }, { status: 404 });
        }

        const ret = returnResult[0];
        const currentQty = ret.quantity || 1;

        if (qtyToSend > currentQty) {
            return NextResponse.json({ success: false, error: `Cannot send more than returned (${currentQty})` }, { status: 400 });
        }

        // 2. Logic for partial vs full transfer
        if (qtyToSend === currentQty) {
            // Full Transfer
            await sql`
                UPDATE sales_returns 
                SET qc_status = 'Sent to Production', 
                    qc_confirmed_by = ${user || 'Admin'},
                    qc_confirmed_at = NOW(),
                    updated_at = NOW()
                WHERE id = ${returnId}
            `;
        } else {
            // Partial Transfer: Split the record
            // Decrease current record quantity
            await sql`
                UPDATE sales_returns 
                SET quantity = quantity - ${qtyToSend}, updated_at = NOW()
                WHERE id = ${returnId}
            `;
            
            // Create a NEW record for the quantity sent to production
            await sql`
                INSERT INTO sales_returns (
                    sales_out_id, inventory_id, return_reason, qc_status, 
                    initiated_by, initiated_at, qc_confirmed_by, qc_confirmed_at, 
                    quantity, qc_count
                )
                VALUES (
                    ${ret.sales_out_id}, ${ret.inventory_id}, ${ret.return_reason}, 'Sent to Production',
                    ${ret.initiated_by}, ${ret.initiated_at}, ${user || 'Admin'}, NOW(),
                    ${qtyToSend}, 0
                )
            `;
        }

        await logActivity(
            user || 'Admin',
            'Return Sent to Production QC',
            `Sales Return ID ${returnId} (${qtyToSend} units) was transferred to Production QC.`,
            'success',
            user || 'Admin'
        );

        return NextResponse.json({ success: true, message: `Transferred ${qtyToSend} units to Production QC successfully` });

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
