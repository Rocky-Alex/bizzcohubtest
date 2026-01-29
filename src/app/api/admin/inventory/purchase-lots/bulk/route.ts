import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseLots, purchaseLotItems } from '@/db/schema';

export async function POST(req: NextRequest) {
    try {
        const { lotMetadata, items } = await req.json();

        if (!lotMetadata || !items || !items.length) {
            return NextResponse.json({ error: 'Missing lot metadata or items' }, { status: 400 });
        }

        // 1. Create the Purchase Lot
        const [newLot] = await db.insert(purchaseLots).values({
            lotNumber: lotMetadata.lotNumber || null,
            supplierName: lotMetadata.supplierName,
            supplierId: lotMetadata.supplierId || null,
            invoiceDate: new Date(lotMetadata.invoiceDate).toISOString().split('T')[0], // Ensure YYYY-MM-DD
            invoiceNumber: lotMetadata.invoiceNumber,
            totalCost: lotMetadata.totalCost,
            notes: lotMetadata.notes,
        }).returning();

        const lotId = newLot.lotId;

        // 2. Create the Purchase Lot Items
        const itemsToInsert = items.map((item: any) => ({
            lotId: lotId,
            productType: item.productType || null,
            brand: item.brand || null,
            series: item.series || null,
            model: item.model || null,
            processor: item.processor || null,
            processorGen: item.processorGen || null,
            productName: item.productName,
            sku: item.sku || null,
            quantity: Number(item.quantity) || 0,
            unitCost: item.unitCost ? item.unitCost.toString() : null,
            totalCost: item.unitCost ? (Number(item.quantity) * Number(item.unitCost)).toString() : null,
            description: item.description || null,
            metadata: item.metadata ? JSON.stringify(item.metadata) : null,
        }));

        await db.insert(purchaseLotItems).values(itemsToInsert);

        return NextResponse.json({ success: true, lotId });
    } catch (error: any) {
        console.error('Error importing purchase lot:', error);
        return NextResponse.json({ error: error.message || 'Failed to import purchase lot' }, { status: 500 });
    }
}
