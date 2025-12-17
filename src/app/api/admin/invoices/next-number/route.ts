import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function GET() {
    try {
        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS invoices (
                id SERIAL PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL
            )
        `;

        // Find the last invoice number that follows the INV format (inclusive)
        const result = await sql`
            SELECT invoice_no 
            FROM invoices 
            WHERE invoice_no ~* 'INV.*[0-9]+'
            ORDER BY CAST(REGEXP_REPLACE(invoice_no, '\D', '', 'g') AS INTEGER) DESC
            LIMIT 1
        `;

        let lastInvoiceNo = null;
        let nextNum = 1;

        if (result.length > 0) {
            lastInvoiceNo = result[0].invoice_no;
            // Remove non-digits
            const numPart = lastInvoiceNo.replace(/\D/g, '');
            const parsed = parseInt(numPart, 10);
            if (!isNaN(parsed)) {
                nextNum = parsed + 1;
            }
        }

        // Format as INV000X
        const nextInvoiceNo = `INV${nextNum.toString().padStart(4, '0')}`;

        return NextResponse.json({ nextInvoiceNo, lastInvoiceNo });

    } catch (error: any) {
        console.error('Error generating invoice number:', error);
        // Fallback
        return NextResponse.json({ nextInvoiceNo: 'INV0001' });
    }
}
