import { NextResponse } from 'next/server';
import { quotationSql as sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ensureTableExists = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS quotation_payments (
            id SERIAL PRIMARY KEY,
            quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
            amount NUMERIC(15, 2) NOT NULL,
            payment_date DATE DEFAULT CURRENT_DATE,
            payment_method VARCHAR(50),
            notes TEXT,
            staff_name VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Migration: ensure staff_name column exists if table was created earlier without it
    await sql`
        ALTER TABLE quotation_payments 
        ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255)
    `;
};

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid Quotation ID' }, { status: 400 });
        }

        await ensureTableExists();

        const payments = await sql`
            SELECT * FROM quotation_payments WHERE quotation_id = ${id} ORDER BY payment_date DESC, created_at DESC
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
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid Quotation ID' }, { status: 400 });
        }

        const body = await req.json();
        const { amount, date, method, notes, staff_name } = body;

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        await ensureTableExists();

        // 1. Insert Payment
        // Format date to YYYY-MM-DD
        const paymentDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        await sql`
            INSERT INTO quotation_payments (quotation_id, amount, payment_date, payment_method, notes, staff_name)
            VALUES (${id}, ${Number(amount)}, ${paymentDate}, ${method || 'Cash'}, ${notes || null}, ${staff_name || null})
        `;

        // 2. Recalculate Total Paid and Update Quotation
        const invResult = await sql`SELECT total_amount, advance_received FROM quotations WHERE id = ${id}` as unknown as any[];
        if (invResult.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
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

        // Update Quotation
        await sql`
            UPDATE quotations 
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
        // Log stack trace for better debugging
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

