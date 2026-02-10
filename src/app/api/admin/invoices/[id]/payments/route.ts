import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const id = params.id;

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS invoice_payments (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
                amount NUMERIC(15, 2) NOT NULL,
                payment_date DATE DEFAULT CURRENT_DATE,
                payment_method VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const payments = await sql`
            SELECT * FROM invoice_payments WHERE invoice_id = ${id} ORDER BY payment_date DESC, created_at DESC
        ` as unknown as any[];

        return NextResponse.json({ payments }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error fetching payments:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const id = params.id;
        const body = await req.json();
        const { amount, date, method, notes } = body;

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // 1. Insert Payment
        await sql`
            INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_method, notes)
            VALUES (${id}, ${amount}, ${date || new Date().toISOString()}, ${method || 'Cash'}, ${notes})
        `;

        // 2. Recalculate Total Paid and Update Invoice
        // Fetch current invoice to get total and current advance
        const invResult = await sql`SELECT total_amount, advance_received FROM invoices WHERE id = ${id}` as unknown as any[];
        if (invResult.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }
        const inv = invResult[0];
        const currentPaid = Number(inv.advance_received || 0);
        const newPaid = currentPaid + Number(amount);
        const totalAmount = Number(inv.total_amount);

        // Determine Status
        let newStatus = 'Partial';
        if (newPaid >= totalAmount) {
            newStatus = 'Paid';
        }

        // Update Invoice
        await sql`
            UPDATE invoices 
            SET advance_received = ${newPaid}, status = ${newStatus}
            WHERE id = ${id}
        `;

        return NextResponse.json({
            message: 'Payment recorded successfully',
            newStatus,
            newPaid
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error recording payment:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
