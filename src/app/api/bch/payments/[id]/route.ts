import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/db';

interface Payment {
    id: number | string;
    amount: number;
    payment_date: string;
    payment_method: string;
    notes: string;
    staff_name: string;
    customer_name: string;
}

// PATCH: Update a specific receipt
export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;
        const body = await req.json();
        const { amount, date, method, notes, staff_name, customer_name } = body;

        // 1. Fetch original payment
        const existingPaymentResult = await sql`SELECT * FROM receipt_list WHERE id = ${id}` as unknown as Payment[];
        if (existingPaymentResult.length === 0) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        
        const oldPayment = existingPaymentResult[0];

        // 2. Update Payment
        await sql`
            UPDATE receipt_list 
            SET 
                amount = ${amount || oldPayment.amount}, 
                payment_date = ${date || oldPayment.payment_date}, 
                payment_method = ${method || oldPayment.payment_method}, 
                notes = ${notes !== undefined ? notes : oldPayment.notes}, 
                staff_name = ${staff_name || oldPayment.staff_name},
                customer_name = ${customer_name || oldPayment.customer_name}
            WHERE id = ${id}
        `;

        return NextResponse.json({ message: 'Direct payment updated successfully' }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error updating direct payment:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// DELETE: Remove a direct payment
export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        await sql`
            DELETE FROM receipt_list WHERE id = ${id}
        `;

        return NextResponse.json({ message: 'Direct payment deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting direct payment:', error);
        return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
    }
}
