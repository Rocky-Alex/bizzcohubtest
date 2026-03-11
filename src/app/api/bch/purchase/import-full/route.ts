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
        const { lots } = body;

        // If 'lots' is missing or empty
        if (!lots || !Array.isArray(lots) || lots.length === 0) {
            return NextResponse.json({ success: false, error: 'No lot data provided' }, { status: 400 });
        }

        const results = [];

        for (const lotData of lots) {
            const { metadata, items } = lotData;

            // Generate Lot Number if missing (or use provided)
            let lotNumber = metadata.lotNumber;
            if (!lotNumber) {
                // Simple auto-inc logic acting on master_inventory distinct lots
                // We fallback to a timestamp-based lot if DB check fails or returns null
                try {
                    const lastLotResult = await sql`
                        SELECT lot_number FROM master_inventory 
                        WHERE lot_number LIKE 'LOT-%'
                        ORDER BY created_at DESC 
                        LIMIT 1
                    ` as unknown as { lot_number: string }[];

                    let nextId = 1;
                    if (lastLotResult.length > 0 && lastLotResult[0].lot_number) {
                        const parts = lastLotResult[0].lot_number.split('-');
                        if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
                            nextId = parseInt(parts[1]) + 1;
                        }
                    }
                    lotNumber = `LOT-${String(nextId).padStart(3, '0')}`;
                } catch (e) {
                    lotNumber = `LOT-${Date.now()}`;
                }
            }

            // Get next seq for barcode (BCH-XXXX)
            // We need a way to track the global sequence. 
            // master_inventory.id is SERIAL, so we can use that after insert.
            // But we need to insert rows first.

            for (const item of items) {
                const qty = parseInt(item.quantity) || 1;

                // Expand Quantity into individual rows
                for (let i = 0; i < qty; i++) {
                    const insertResult = await sql`
                        INSERT INTO master_inventory (
                            lot_number, lot_notes,
                            supplier_name, invoice_number,
                            
                            product_name, brand, model, series, 
                            processor, processor_gen, ram, storage, graphics_card, 
                            screen_size, screen_resolution, 
                            category, type,
                            condition_status, qc_status,
                            
                            unit_cost, total_cost,
                            
                            qc_created_by, qc_created_at
                        )
                        VALUES (
                            ${lotNumber}, ${metadata.notes || ''},
                            ${metadata.supplierName}, ${metadata.invoiceNumber},
                            
                            ${item.productName}, ${item.brand || ''}, ${item.model || ''}, ${item.series || ''},
                            ${item.processor || ''}, ${item.processorGen || ''}, ${item.ram || ''}, ${item.storage || ''}, ${item.graphics || ''},
                            ${item.screenSize || ''}, ${item.screenResolution || ''},
                            ${item.productType || 'Laptop'}, ${item.productType || 'Laptop'},
                            ${item.conditionStatus || 'Unknown'}, 'Imported',
                            
                            ${item.unitCost || 0}, ${metadata.totalCost || 0},
                            
                            ${createdBy}, NOW()
                        )
                        RETURNING id
                    ` as unknown as { id: number }[];

                    if (insertResult && insertResult.length > 0) {
                        const newId = insertResult[0].id;
                        const barcode = `BCH-${1000 + newId}`; // Simple barcode logic

                        // Update with generated barcode and SKU
                        await sql`
                            UPDATE master_inventory 
                            SET barcode = ${barcode}, sku = ${item.sku || barcode}
                            WHERE id = ${newId}
                        `;
                    }
                }
            }
            results.push(lotNumber);
            await logActivity(createdBy, 'Full Import', `Imported Lot ${lotNumber} (${metadata.invoiceNumber})`, 'success', createdBy);
        }

        return NextResponse.json({ success: true, importedLots: results });

    } catch (error: any) {
        console.error('Error in full import:', error);
        return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
    }
}
