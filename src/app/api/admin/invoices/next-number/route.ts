
import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Query to find the latest invoice number
        // We look for invoice_no starting with 'INV' 
        // Switching to Sort by ID as it's more reliable for "latest" creation
        const result = await sql`
            SELECT id, invoice_no 
            FROM invoices 
            WHERE invoice_no LIKE 'INV%' 
            ORDER BY id DESC 
            LIMIT 1
        `;

        let nextInvoiceNo = 'INV0001';

        if (result.length > 0) {
            const lastInvoiceNo = result[0].invoice_no;
            // Match INV followed by anything (separator) and then digits
            // e.g. INV001, INV-001, INV_001, INV 001
            const match = lastInvoiceNo.match(/^INV(.*?)([0-9]+)$/);

            if (match) {
                const separator = match[1]; // "" or "-" or " " etc.
                const numberPart = match[2];
                const currentNum = parseInt(numberPart, 10);

                if (!isNaN(currentNum)) {
                    const nextNum = currentNum + 1;
                    // Keep the same width as the previous number (unless it overflowed)
                    const width = numberPart.length;
                    nextInvoiceNo = `INV${separator}${nextNum.toString().padStart(width, '0')}`;
                }
            }
        }

        return NextResponse.json({ nextInvoiceNo });
    } catch (error: any) {
        console.error('Error fetching next invoice number:', error);
        return NextResponse.json({ error: 'Failed to fetch next invoice number' }, { status: 500 });
    }
}