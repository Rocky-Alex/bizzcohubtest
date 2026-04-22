import { NextResponse } from 'next/server';
import { quotationSql as sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ensureTableExists = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS quotation_payments (
            id SERIAL PRIMARY KEY,
            quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
            receipt_no VARCHAR(50),
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

    // Add receipt_no column
    await sql`
        ALTER TABLE quotation_payments 
        ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(50)
    `;
};

export async function GET(req: Request, context: any): Promise<NextResponse> {
    try {
        const id = (await Promise.resolve(context.params)).id;
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

export async function POST(req: Request, context: any): Promise<NextResponse> {
    try {
        const id = (await Promise.resolve(context.params)).id;
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid Quotation ID' }, { status: 400 });
        }

        const body = await req.json();
        const { amount, date, method, notes, staff_name } = body;

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        console.log("Ensuring table exists...");
        await ensureTableExists();

        const [lastP] = await sql`SELECT id FROM quotation_payments ORDER BY id DESC LIMIT 1` as unknown as any[];
        const nextId = lastP ? Number(lastP.id) + 1 : 1;
        const receiptNo = `REC-Q${nextId.toString().padStart(4, '0')}`;

        // 1. Insert Payment
        const paymentDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const result = await sql`
            INSERT INTO quotation_payments (quotation_id, receipt_no, amount, payment_date, payment_method, notes, staff_name)
            VALUES (${id}, ${receiptNo}, ${Number(amount)}, ${paymentDate}, ${method || 'Cash'}, ${notes || null}, ${staff_name || null})
            RETURNING id, receipt_no
        ` as unknown as any[];

        // 2. Recalculate Total Paid and Update Quotation
        const qtnResult = await sql`SELECT total_amount, advance_received FROM quotations WHERE id = ${id}` as unknown as any[];
        if (qtnResult.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        const qtn = qtnResult[0];
        const currentPaid = Number(qtn.advance_received || 0);
        const newPaid = currentPaid + Number(amount);
        const totalAmount = Number(qtn.total_amount);

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
            newPaid,
            paymentId: result[0].id,
            receiptNo: result[0].receipt_no
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error recording payment:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

