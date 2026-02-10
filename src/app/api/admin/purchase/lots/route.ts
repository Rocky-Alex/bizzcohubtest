import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'active';

        // Fetch lots and count items for each
        const lots = await sql`
            SELECT 
                l.id, 
                l.lot_id as "lotId",
                l.lot_number as "lotNumber", 
                l.supplier_name as "supplierName", 
                l.invoice_date as "invoiceDate", 
                l.invoice_number as "invoiceNumber", 
                l.total_cost as "totalCost", 
                l.status,
                l.notes,
                l.created_by as "createdBy",
                l.created_at as "createdAt",
                (SELECT COUNT(*) FROM purchase_lot_items WHERE lot_id = l.id) as "totalItems"
            FROM purchase_lots l
            WHERE LOWER(COALESCE(l.status, 'Active')) = LOWER(${status})
            ORDER BY l.created_at DESC
        ` as unknown as any[];

        return NextResponse.json({ success: true, lots });
    } catch (error: unknown) {
        console.error('Error fetching purchase lots:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        const currentUser = session?.user?.name || 'Admin';

        const body = await req.json();
        const {
            lot_number,
            supplier_name,
            invoice_number,
            invoice_date,
            total_cost,
            status,
            notes
        } = body;

        // 1. Generate Auto-Increment Lot ID (LOT-01, LOT-02...)
        const lastLotResult = await sql`
            SELECT lot_id FROM purchase_lots 
            ORDER BY id DESC 
            LIMIT 1
        ` as unknown as { lot_id: string }[];

        let nextLotId = 'LOT-01';
        if (lastLotResult.length > 0 && lastLotResult[0].lot_id) {
            const lastIdStr = lastLotResult[0].lot_id;
            const parts = lastIdStr.split('-');
            if (parts.length === 2) {
                const num = parseInt(parts[1], 10);
                if (!isNaN(num)) {
                    nextLotId = `LOT-${String(num + 1).padStart(2, '0')}`;
                }
            }
        }

        // 2. Insert New Lot
        const result = await sql`
            INSERT INTO purchase_lots (
                lot_id, 
                lot_number, 
                supplier_name, 
                invoice_number, 
                invoice_date, 
                total_cost, 
                status, 
                notes, 
                created_by
            )
            VALUES (
                ${nextLotId}, 
                ${lot_number}, 
                ${supplier_name}, 
                ${invoice_number}, 
                ${invoice_date}, 
                ${total_cost || 0}, 
                ${status || 'Active'}, 
                ${notes}, 
                ${currentUser}
            )
            RETURNING *
        `;

        return NextResponse.json({ success: true, lot: result[0] });

    } catch (error: unknown) {
        console.error('Error creating purchase lot:', error);
        return NextResponse.json({ success: false, error: 'Failed to create lot' }, { status: 500 });
    }
}

// ONE-TIME MIGRATION / RESET ENDPOINT (To be triggered manually or once)
// You can call this by sending a DELETE request to /api/admin/purchase/lots
export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        // DROP EXISTING TABLES
        await sql`DROP TABLE IF EXISTS inventory_qc CASCADE`;
        await sql`DROP TABLE IF EXISTS purchase_lot_items CASCADE`;
        await sql`DROP TABLE IF EXISTS purchase_lots CASCADE`;

        // RECREATE purchase_lots
        await sql`
            CREATE TABLE purchase_lots (
                id SERIAL PRIMARY KEY,
                lot_id TEXT UNIQUE,
                lot_number TEXT,
                supplier_name TEXT NOT NULL,
                supplier_id INTEGER,
                invoice_date DATE,
                invoice_number TEXT,
                notes TEXT,
                total_cost DECIMAL(12, 2) DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // RECREATE purchase_lot_items (Linked to new purchase_lots)
        await sql`
            CREATE TABLE purchase_lot_items (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id) ON DELETE CASCADE,
                product_type TEXT,
                product_name TEXT NOT NULL,
                brand TEXT,
                series TEXT,
                model TEXT,
                processor TEXT,
                processor_gen TEXT,
                sku TEXT,
                quantity INTEGER DEFAULT 1,
                unit_cost DECIMAL(12, 2) DEFAULT 0,
                qc_count INTEGER DEFAULT 0,
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // RECREATE inventory_qc
        await sql`
            CREATE TABLE inventory_qc (
                id SERIAL PRIMARY KEY,
                lot_id INTEGER REFERENCES purchase_lots(id) ON DELETE CASCADE,
                barcode TEXT,
                sku TEXT,
                product_name TEXT,
                brand TEXT,
                series TEXT,
                model TEXT,
                processor TEXT,
                processor_gen TEXT,
                ram TEXT,
                storage TEXT,
                graphics TEXT,
                screen_size TEXT,
                screen_resolution TEXT,
                keyboard_type TEXT,
                keyboard_backlit TEXT,
                condition_status TEXT,
                status TEXT,
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_by TEXT,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        `;

        return NextResponse.json({ success: true, message: 'Database reset and schema updated with inventory_qc' });
    } catch (error) {
        console.error('DB Reset Error:', error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
