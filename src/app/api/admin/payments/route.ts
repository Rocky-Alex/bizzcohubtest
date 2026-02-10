import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
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
        ` as unknown as any[];

        return NextResponse.json({ payments }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching all payments:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
