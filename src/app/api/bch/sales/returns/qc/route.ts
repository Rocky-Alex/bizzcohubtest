import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { returnId, status, notes, updatedBy } = body;

        if (!returnId || !status) {
            return NextResponse.json({ success: false, error: "returnId and status are required" }, { status: 400 });
        }

        // 1. Fetch the return record
        const returnQuery = await sql`
            SELECT * FROM sales_return_inventory WHERE id = ${returnId}
        ` as unknown as any[];

        if (!returnQuery || returnQuery.length === 0) {
            return NextResponse.json({ success: false, error: "Return record not found" }, { status: 404 });
        }

        const returnRecord = returnQuery[0];

        // 2. Update return status
        await sql`
            UPDATE sales_return_inventory 
            SET status = ${status}, 
                return_reason = ${notes ? (returnRecord.return_reason + ' | QC: ' + notes) : returnRecord.return_reason},
                updated_at = NOW()
            WHERE id = ${returnId}
        `;

        // 3. If Passed, mark the original sale as Returned so item reappears in Master Inventory
        if (status === 'QC Passed' || status === 'Restocked') {
            await sql`
                UPDATE sale_out 
                SET returned_at = NOW() 
                WHERE master_inventory_id = ${returnRecord.master_inventory_id} 
                AND returned_at IS NULL
            `;

            await logActivity(
                'Admin',
                'Return QC',
                `Item ${returnRecord.barcode} passed QC and was RESTOCKED into Master Inventory`,
                'success',
                updatedBy || 'Admin'
            );
        } else {
             await logActivity(
                'Admin',
                'Return QC',
                `Item ${returnRecord.barcode} FAILED return QC: ${notes}`,
                'failure',
                updatedBy || 'Admin'
            );
        }

        // Force revalidation of lists
        revalidatePath('/api/bch/inventory/qc');
        revalidatePath('/api/bch/dashboard/stats');

        return NextResponse.json({ success: true, message: status === 'QC Passed' ? 'Item restocked successfully' : 'Return status updated' });

    } catch (error: any) {
        console.error('Error processing return QC:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
