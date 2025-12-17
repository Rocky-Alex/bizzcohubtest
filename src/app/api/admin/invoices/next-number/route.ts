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

        // Find the last invoice number that follows the INV format
        // We use regex to find codes like INV0001, INV1234, etc.
        // We order by the numeric partdescending.
        const result = await sql`
            SELECT invoice_no 
            FROM invoices 
            WHERE invoice_no ~ '^INV\d+$'
            ORDER BY CAST(SUBSTRING(invoice_no FROM 4) AS INTEGER) DESC
            LIMIT 1
        `;

        let nextNum = 1;
        if (result.length > 0) {
            const lastNo = result[0].invoice_no;
            const updates = lastNo.replace('INV', '');
            if (!isNaN(parseInt(updates))) {
                nextNum = parseInt(updates) + 1;
            }
        }

        // Format as INV000X
        const nextInvoiceNo = `INV${nextNum.toString().padStart(4, '0')}`;

        return NextResponse.json({ nextInvoiceNo });

    } catch (error: any) {
        console.error('Error generating invoice number:', error);
        // Fallback
        return NextResponse.json({ nextInvoiceNo: 'INV0001' });
    }
}
