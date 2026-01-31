import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ success: false, error: 'Valid ID required' }, { status: 400 });
        }

        const lotQuery = await sql`
            SELECT id as "lotId", lot_number as "lotNumber", supplier_name as "supplierName", 
                   invoice_date as "invoiceDate", invoice_number as "invoiceNumber", 
                   total_cost as "totalCost", status, notes, created_at as "createdAt"
            FROM purchase_lots 
            WHERE id = ${id}
        `;

        if (lotQuery.length === 0) {
            return NextResponse.json({ success: false, error: 'Lot not found' }, { status: 404 });
        }

        const lot = lotQuery[0];

        // Fetch QC counts per item
        const itemsQuery = await sql`
            SELECT pli.id as "itemId", pli.product_name as "productName", pli.sku, 
                   pli.quantity, pli.unit_cost as "unitCost", 
                   pli.brand, pli.model, pli.series, 
                   pli.processor, pli.processor_gen as "processorGen",
                   COUNT(iqc.id) as "qcCount"
            FROM purchase_lot_items pli
            LEFT JOIN inventory_qc iqc ON pli.id = iqc.purchase_lot_item_id
            WHERE pli.lot_id = ${id}
            GROUP BY pli.id
            ORDER BY pli.id ASC
        `;

        return NextResponse.json({
            success: true,
            lot: {
                ...lot,
                items: itemsQuery.map((item: any) => ({
                    ...item,
                    qcCount: parseInt(item.qcCount) // Ensure number
                }))
            }
        });

    } catch (error: any) {
        console.error('Error fetching lot details:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
