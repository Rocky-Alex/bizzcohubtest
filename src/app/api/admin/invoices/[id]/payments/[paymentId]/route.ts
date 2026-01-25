import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

// PATCH: Update a specific payment
export async function PATCH(req: Request, { params }: { params: { id: string, paymentId: string } }) {
    try {
        const { id: invoiceId, paymentId } = params;
        const body = await req.json();
        const { amount, date, method, notes } = body;

        // 1. Fetch original payment to know the difference
        const existingPaymentResult = await sql`SELECT * FROM invoice_payments WHERE id = ${paymentId} AND invoice_id = ${invoiceId}`;
        if (existingPaymentResult.length === 0) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        const oldPayment = existingPaymentResult[0];
        const oldAmount = Number(oldPayment.amount);
        const newAmountVal = Number(amount);

        if (isNaN(newAmountVal) || newAmountVal <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // 2. Update Payment
        await sql`
            UPDATE invoice_payments 
            SET amount = ${newAmountVal}, payment_date = ${date}, payment_method = ${method}, notes = ${notes}
            WHERE id = ${paymentId}
        `;

        // 3. Update Invoice Totals
        // Fetch current invoice total paid
        const invResult = await sql`SELECT total_amount, advance_received FROM invoices WHERE id = ${invoiceId}`;
        const inv = invResult[0];
        const currentTotalPaid = Number(inv.advance_received || 0);

        // Calculate new total paid: (Current - OldPayment + NewPayment)
        const newTotalPaid = currentTotalPaid - oldAmount + newAmountVal;
        const totalAmount = Number(inv.total_amount);

        // Determine Status
        let newStatus = 'Partial';
        if (newTotalPaid >= totalAmount) {
            newStatus = 'Paid';
        } else if (newTotalPaid <= 0) {
            // Should theoretically be Pending if 0, but usually we just say Partial or Pending
            newStatus = newTotalPaid === 0 ? 'Pending' : 'Partial';
        }

        // Update Invoice
        await sql`
            UPDATE invoices 
            SET advance_received = ${newTotalPaid}, status = ${newStatus}
            WHERE id = ${invoiceId}
        `;

        return NextResponse.json({ message: 'Payment updated', newStatus, newPaid: newTotalPaid }, { status: 200 });

    } catch (error: any) {
        console.error('Error updating payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a specific payment
export async function DELETE(req: Request, { params }: { params: { id: string, paymentId: string } }) {
    try {
        const { id: invoiceId, paymentId } = params;

        // 1. Fetch payment to delete
        const existingPaymentResult = await sql`SELECT * FROM invoice_payments WHERE id = ${paymentId} AND invoice_id = ${invoiceId}`;
        if (existingPaymentResult.length === 0) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        const oldPayment = existingPaymentResult[0];
        const amountToDelete = Number(oldPayment.amount);

        // 2. Delete Payment
        await sql`DELETE FROM invoice_payments WHERE id = ${paymentId}`;

        // 3. Update Invoice Totals
        const invResult = await sql`SELECT total_amount, advance_received FROM invoices WHERE id = ${invoiceId}`;
        const inv = invResult[0];
        const currentTotalPaid = Number(inv.advance_received || 0);

        const newTotalPaid = currentTotalPaid - amountToDelete;
        const totalAmount = Number(inv.total_amount);

        // Determine Status
        let newStatus = 'Partial';
        if (newTotalPaid >= totalAmount) {
            newStatus = 'Paid';
        } else if (newTotalPaid <= 0) {
            newStatus = 'Pending';
        }

        // Update Invoice
        await sql`
            UPDATE invoices 
            SET advance_received = ${newTotalPaid < 0 ? 0 : newTotalPaid}, status = ${newStatus}
            WHERE id = ${invoiceId}
        `;

        return NextResponse.json({ message: 'Payment deleted', newStatus, newPaid: newTotalPaid < 0 ? 0 : newTotalPaid }, { status: 200 });

    } catch (error: any) {
        console.error('Error deleting payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
