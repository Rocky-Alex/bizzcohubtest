import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Query to find the latest invoice number
        // We look for invoice_no starting with 'INV' and sort them to find the max
        const result = await sql`
            SELECT invoice_no 
            FROM invoices 
            WHERE invoice_no LIKE 'INV%' 
            ORDER BY LENGTH(invoice_no) DESC, invoice_no DESC 
            LIMIT 1
        `;

        let nextNumber = 1;

        if (result.length > 0) {
            const lastInvoiceNo = result[0].invoice_no;
            // Expecting format INV0001
            const match = lastInvoiceNo.match(/^INV(\d+)$/);
            if (match && match[1]) {
                const currentNum = parseInt(match[1], 10);
                if (!isNaN(currentNum)) {
                    nextNumber = currentNum + 1;
                }
            }
        }

        // Format as INVXXXX (4 digits)
        const nextInvoiceNo = `INV${nextNumber.toString().padStart(4, '0')}`;

        return NextResponse.json({ nextInvoiceNo });
    } catch (error: any) {
        console.error('Error fetching next invoice number:', error);
        return NextResponse.json({ error: 'Failed to fetch next invoice number' }, { status: 500 });
    }
}
