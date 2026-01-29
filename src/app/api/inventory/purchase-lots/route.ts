import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/db';
import { purchaseLots, purchaseLotItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        if (workbook.SheetNames.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Excel sheet has no data rows' }, { status: 400 });
        }

        // Parse Header / Common Info from the first row
        // Expected columns loosely based on: "Supplier Name", "Date", "Invoice Number", "Product Details", "Cost Value"
        const firstRow: any = rows[0];

        const supplierName = firstRow['Supplier Name'] || firstRow['Supplier'] || firstRow['supplier'] || 'Unknown Supplier';

        let invoiceDate = new Date();
        const dateVal = firstRow['Date'] || firstRow['Invoice Date'] || firstRow['date'];
        if (dateVal) {
            if (typeof dateVal === 'number') {
                // Excel serial date
                invoiceDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            } else {
                invoiceDate = new Date(dateVal);
            }
        }
        if (isNaN(invoiceDate.getTime())) invoiceDate = new Date();
        const dateStr = invoiceDate.toISOString().split('T')[0];

        const invoiceNumber = String(firstRow['Invoice Number'] || firstRow['Invoice No'] || firstRow['invoice'] || `INV-${Date.now()}`);

        // Create the Lot
        const [lot] = await db.insert(purchaseLots).values({
            supplierName,
            invoiceDate: dateStr,
            invoiceNumber,
            totalCost: '0'
        }).returning();

        let lotTotal = 0;

        // Insert Items
        for (const row of rows as any[]) {
            // "products details" might correspond to product name or description
            const productName = row['Product Details'] || row['Product Name'] || row['Details'] || row['Description'] || 'Unknown Product';
            const quantity = parseInt(row['Quantity'] || row['Qty'] || row['quantity'] || '1') || 1;
            const unitCost = parseFloat(row['Cost Value'] || row['Unit Cost'] || row['Cost'] || row['Price'] || '0') || 0;
            const totalCost = parseFloat(row['Total Cost'] || row['Amount'] || '0') || (quantity * unitCost);
            const sku = row['SKU'] || row['sku'] || null;

            lotTotal += totalCost;

            await db.insert(purchaseLotItems).values({
                lotId: lot.lotId,
                productName: String(productName),
                quantity,
                unitCost: unitCost.toFixed(2),
                totalCost: totalCost.toFixed(2),
                sku: sku ? String(sku) : null,
                metadata: JSON.stringify(row)
            });
        }

        // Update Total Cost of the Lot
        await db.update(purchaseLots)
            .set({ totalCost: lotTotal.toFixed(2) })
            .where(eq(purchaseLots.lotId, lot.lotId));

        return NextResponse.json({ success: true, lotId: lot.lotId, rowsProcessed: rows.length });

    } catch (error: any) {
        console.error('Purchase Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const lots = await db.select().from(purchaseLots).orderBy(purchaseLots.createdAt);
        return NextResponse.json(lots);
    } catch (error: any) {
        console.error('Fetch Lots Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
