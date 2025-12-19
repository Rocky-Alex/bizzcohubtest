import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
        `;

        return NextResponse.json({ payments }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();
        const { amount, date, method, notes } = body;

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // 1. Insert Payment
        await sql`
            INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_method, notes)
            VALUES (${id}, ${amount}, ${date || new Date().toISOString()}, ${method || 'Cash'}, ${notes})
        `;

        // 2. Recalculate Total Paid and Update Invoice
        // We sum up ALL payments in invoice_payments table + any initial advance that might not be in that table? 
        // Ideally, we should sync 'advance_received' to be the SUM of invoice_payments.
        // For simplicity and robustness, let's assume 'advance_received' stores the TOTAL PAID.
        // But if we have legacy 'advance_received' without payment records, we might double count if we aren't careful.
        // Strategy: We will update 'advance_received' by adding the NEW amount.

        // Fetch current invoice to get total and current advance
        const invResult = await sql`SELECT total_amount, advance_received FROM invoices WHERE id = ${id}`;
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

    } catch (error: any) {
        console.error('Error recording payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
