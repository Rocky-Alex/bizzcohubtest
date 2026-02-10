import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        const createdBy = session?.user?.name || 'Admin';

        const body = await req.json();
        const { lotMetadata, items } = body;

        // Ensure tables exist
        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lots (
                id SERIAL PRIMARY KEY,
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

        // Ensure supplier_id exists (it might be missing if table was created before it was added)
        await sql`ALTER TABLE purchase_lots ADD COLUMN IF NOT EXISTS supplier_id INTEGER`;
        await sql`ALTER TABLE purchase_lots ADD COLUMN IF NOT EXISTS created_by TEXT`;

        await sql`
            CREATE TABLE IF NOT EXISTS purchase_lot_items (
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

        // 2. Insert Lot Metadata
        const lotResult = await sql`
            INSERT INTO purchase_lots (
                lot_id, lot_number, supplier_name, supplier_id, invoice_date, invoice_number, notes, total_cost, created_by
            )
            VALUES (
                ${nextLotId},
                ${lotMetadata.lotNumber || null}, 
                ${lotMetadata.supplierName}, 
                ${lotMetadata.supplierId || null}, 
                ${lotMetadata.invoiceDate}, 
                ${lotMetadata.invoiceNumber}, 
                ${lotMetadata.notes || null},
                ${lotMetadata.totalCost || 0},
                ${createdBy}
            )
            RETURNING id, lot_id
        ` as unknown as { id: number, lot_id: string }[];

        const lotId = lotResult[0].id;
        const lotIdStr = lotResult[0].lot_id;

        // 2. Insert Items
        for (const item of items) {
            await sql`
                INSERT INTO purchase_lot_items (
                    lot_id, product_type, product_name, brand, series, model, 
                    processor, processor_gen, sku, quantity, unit_cost, created_by
                )
                VALUES (
                    ${lotId}, ${item.productType}, ${item.productName}, ${item.brand || null}, 
                    ${item.series || null}, ${item.model || null}, ${item.processor || null}, 
                    ${item.processorGen || null}, ${item.sku || null}, ${item.quantity || 1}, 
                    ${item.unitCost || 0}, ${createdBy}
                )
            `;
        }

        await logActivity(
            createdBy,
            'Import Purchase Lot',
            `Imported lot ${lotMetadata.lotNumber || lotMetadata.invoiceNumber} with ${items.length} items from ${lotMetadata.supplierName}`,
            'success',
            createdBy
        );

        return NextResponse.json({ success: true, lotId });
    } catch (error: unknown) {
        console.error('Error importing purchase lot bulk:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
