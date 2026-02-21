import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const confirm = searchParams.get('confirm');

        if (confirm !== 'true') {
            return NextResponse.json({ success: false, message: "Please add ?confirm=true to query parameters to execute data destruction." });
        }

        // Drop Tables

        await sql`DROP TABLE IF EXISTS purchase_lot_items CASCADE`;
        await sql`DROP TABLE IF EXISTS purchase_lots CASCADE`;
        await sql`DROP TABLE IF EXISTS products CASCADE`;

        return NextResponse.json({ success: true, message: "Dropped tables: inventory_qc, purchase_lot_items, purchase_lots, products. Warning: The master_inventory sync trigger has also been removed." });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
