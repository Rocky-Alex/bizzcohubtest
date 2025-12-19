import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch all payments joined with invoice data
        const payments = await sql`
            SELECT 
                p.*,
                i.invoice_no,
                i.customer_name,
                i.customer_email
            FROM invoice_payments p
            JOIN invoices i ON p.invoice_id = i.id
            ORDER BY p.payment_date DESC, p.created_at DESC
        `;

        return NextResponse.json({ payments }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching all payments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
