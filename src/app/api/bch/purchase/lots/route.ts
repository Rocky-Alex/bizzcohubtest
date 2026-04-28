import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const statusFilter = searchParams.get('status'); // 'active' or 'completed'

        if (id) {
            const result = await sql`
                SELECT * FROM purchase_lots WHERE id = ${id}
            ` as unknown as any[];
            return NextResponse.json({ success: true, lot: result[0] || null });
        } else {
            const lots = await sql`
                SELECT 
                    id,
                    'LOT-' || LPAD(id::text, 4, '0') as "lotId", 
                    lot_number as "lotNumber", 
                    supplier_name as "supplierName", 
                    invoice_number as "invoiceNumber", 
                    invoice_date as "invoiceDate", 
                    total_cost as "totalCost", 
                    status, 
                    notes, 
                    created_by as "createdBy", 
                    created_at as "createdAt",
                    (SELECT COUNT(*) FROM purchase_lot_items WHERE lot_id = purchase_lots.id) as "totalItems",
                    (SELECT COALESCE(SUM(quantity), 0) FROM purchase_lot_items WHERE lot_id = purchase_lots.id) as "totalQty"
                FROM purchase_lots 
                WHERE 
                    (${statusFilter} = 'completed' AND UPPER(TRIM(status)) = 'COMPLETED') OR
                    (${statusFilter} != 'completed' AND (status IS NULL OR UPPER(TRIM(status)) != 'COMPLETED'))
                ORDER BY created_at DESC
            ` as unknown as any[];

            // Inject virtual lot for Customer Returns
            const returnsCountResult = await sql`SELECT COUNT(*) FROM sales_returns WHERE qc_status = 'Sent to Production'` as any[];
            const returnsCount = parseInt(returnsCountResult[0].count);

            if (returnsCount > 0 && statusFilter !== 'completed') {
                lots.unshift({
                    id: -1, // Special ID for returns
                    lotId: 'RETURNS',
                    lotNumber: '🔄 Customer Returns Queue',
                    supplierName: 'Sales Return Dept',
                    invoiceNumber: 'RET-INTERNAL',
                    invoiceDate: new Date().toISOString(),
                    totalItems: returnsCount,
                    totalQty: returnsCount,
                    status: 'Active'
                });
            }

            return NextResponse.json({ success: true, lots });
        }
    } catch (error: unknown) {
        console.error('Error fetching purchase lots:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    return NextResponse.json({
        success: false,
        error: "Lot creation is now handled via the Import Full Purchase flow directly into Master Inventory."
    }, { status: 400 });
}
