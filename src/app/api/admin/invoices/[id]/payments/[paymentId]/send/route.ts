import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import { Resend } from 'resend';
import path from 'path';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY); // Using same key as previous files

export async function POST(req: Request, { params }: { params: { id: string, paymentId: string } }) {
    try {
        const { id: invoiceId, paymentId } = params;

        // 1. Fetch Data
        const invoiceResult = await sql`SELECT * FROM invoices WHERE id = ${invoiceId}`;
        const paymentResult = await sql`SELECT * FROM invoice_payments WHERE id = ${paymentId}`;

        if (invoiceResult.length === 0 || paymentResult.length === 0) {
            return NextResponse.json({ error: 'Invoice or Payment not found' }, { status: 404 });
        }

        const invoice = invoiceResult[0];
        const payment = paymentResult[0];

        if (!invoice.customer_email) {
            return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
        }

        // 2. Generate PDF Buffer (Optional, for now just sending HTML email to be fast)
        // Or if we want to attach a PDF receipt, we'd need a ReceiptPDF component.
        // For simplicity as per prompt "Sent invoice to customer mail", let's send a nice HTML receipt.

        // 3. Send Email
        const { data, error } = await resend.emails.send({
            from: 'Bizz Co Hub <onboarding@resend.dev>',
            to: ['rishadpnpm@gmail.com'], // Restricted to verified email in Resend free tier
            // to: [invoice.customer_email], // PROD
            subject: `Payment Receipt for Invoice #${invoice.invoice_no}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #0c86eaff; margin: 0;">Payment Receipt</h2>
                        <p style="color: #666; font-size: 14px;">Bizz Co Hub</p>
                    </div>
                    
                    <p>Dear <strong>${invoice.customer_name}</strong>,</p>
                    <p>Thank you for your payment. We have received the following amount:</p>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666;">Payment Date:</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: 500;">${new Date(payment.payment_date).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;">Payment Method:</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: 500;">${payment.payment_method}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;">Reference:</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: 500;">${payment.notes || '-'}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; font-weight: 600; color: #111;">Amount Paid:</td>
                                <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #16a34a; font-size: 1.2em;">$${Number(payment.amount).toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <p style="margin: 5px 0; font-size: 14px;"><strong>Invoice Details:</strong></p>
                        <p style="margin: 2px 0; color: #666; font-size: 13px;">Invoice #: ${invoice.invoice_no}</p>
                        <p style="margin: 2px 0; color: #666; font-size: 13px;">Total Invoice Amount: $${Number(invoice.total_amount).toFixed(2)}</p>
                        <p style="margin: 2px 0; color: #666; font-size: 13px;">Total Paid So Far: $${Number(invoice.advance_received).toFixed(2)}</p>
                        <p style="margin: 2px 0; color: #dc2626; font-size: 13px;"><strong>Balance Due: $${(Number(invoice.total_amount) - Number(invoice.advance_received)).toFixed(2)}</strong></p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    
                    <p style="font-size: 13px; color: #999; text-align: center;">
                        This is a computer-generated receipt. Does not require a signature.<br/>
                        Bizz Co Hub | 123 Business Street | Tech City
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Email error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Receipt sent successfully' });

    } catch (error: any) {
        console.error('Error sending receipt:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
