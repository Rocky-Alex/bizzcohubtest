import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { purchaseLotItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const itemId = parseInt(params.id);
        const body = await req.json();

        // Calculate updated total cost based on new quantity/unitCost
        const quantity = Number(body.quantity);
        const unitCost = Number(body.unitCost);
        const totalCost = (quantity * unitCost).toFixed(2);

        // Prepare update data
        // We rely on the body containing keys matching the schema or what we edit
        await db.update(purchaseLotItems)
            .set({
                productType: body.productType,
                brand: body.brand,
                model: body.model,
                series: body.series,
                processor: body.processor,
                processorGen: body.processorGen,
                quantity: quantity,
                unitCost: unitCost.toString(),
                totalCost: totalCost,
                // Update productName if provided, otherwise keep it (or update if brand/model changed?)
                // For now, we update it if explicit, user can edit it
                ...(body.productName ? { productName: body.productName } : {})
            })
            .where(eq(purchaseLotItems.itemId, itemId));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating purchase lot item:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const itemId = parseInt(params.id);
        await db.delete(purchaseLotItems).where(eq(purchaseLotItems.itemId, itemId));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting purchase lot item:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
