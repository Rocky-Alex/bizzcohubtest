import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const result = await sql`
                SELECT * FROM purchase_lots WHERE id = ${id}
            ` as unknown as any[];
            return NextResponse.json({ success: true, lot: result[0] || null });
        } else {
            const lots = await sql`
                SELECT 
                    id, 
                    lot_number as "lotId", 
                    lot_number as "lotNumber", 
                    supplier_name as "supplierName", 
                    invoice_number as "invoiceNumber", 
                    invoice_date as "invoiceDate", 
                    total_cost as "totalCost", 
                    status, 
                    notes, 
                    created_by as "createdBy", 
                    created_at as "createdAt",
                    (SELECT COUNT(*) FROM purchase_lot_items WHERE lot_id = purchase_lots.id) as "totalItems"
                FROM purchase_lots 
                ORDER BY created_at DESC
            ` as unknown as any[];
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
