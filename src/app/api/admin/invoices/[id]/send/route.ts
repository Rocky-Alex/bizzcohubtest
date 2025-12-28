import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import { logActivity } from '@/lib/activity-logger';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/pdf/InvoicePDF';
import React from 'react';
import path from 'path';

// Initialize Resend with the provided API key
// In production, this should be in process.env.RESEND_API_KEY
// Resend initialized inside POST

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        // 1. Fetch Invoice Data
        const invoiceResult = await sql`SELECT * FROM invoices WHERE id = ${id}`;
        if (invoiceResult.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }
        const invoice = invoiceResult[0];

        const itemsResult = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${id}`;

        if (!invoice.customer_email) {
            return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
        }

        // 2. Generate PDF
        const logoPath = path.join(process.cwd(), 'public', 'icon', 'nav-logo.png');
        let logoUrl = '';

        try {
            const fs = require('fs');
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            } else {
                console.warn('Logo file not found at:', logoPath);
            }
        } catch (err) {
            console.error('Error reading logo file:', err);
            // Fallback or ignore if logo missing
        }

        let pdfBuffer;
        try {
            pdfBuffer = await renderToBuffer(
                React.createElement(InvoicePDF, { invoice: invoice, items: itemsResult, logoUrl: logoUrl }) as any
            );
        } catch (pdfError: any) {
            console.error('PDF Generation Error:', pdfError);
            return NextResponse.json({ error: 'Failed to generate PDF invoice: ' + pdfError.message }, { status: 500 });
        }

        // 3. Send Email with Attachment via Resend
        // Using the user-provided sender address
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: 'RESEND_API_KEY is missing' }, { status: 500 });
        }
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: 'Bizz Co Hub <onboarding@resend.dev>',
            to: 'rishadpnpm@gmail.com', // Restricted to verified email in Resend free tier
            subject: `Invoice #${invoice.invoice_no} from Bizz Co Hub`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Hello ${invoice.customer_name},</h2>
                    <p>Thank you for your business. Please find attached your invoice <strong>#${invoice.invoice_no}</strong>.</p>
                    <p><strong>Amount Due:</strong> $${Number(invoice.total_amount).toFixed(2)}</p>
                    <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
                    <br/>
                    <p>Best regards,</p>
                    <p><strong>Bizz Co Hub Team</strong></p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice-${invoice.invoice_no}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error('Invoice Email Resend Error:', error);
            return NextResponse.json({ error: 'Failed to send email: ' + error.message }, { status: 500 });
        }

        // 4. Update Invoice Status
        await sql`UPDATE invoices SET status = 'Sent' WHERE id = ${id}`;

        await logActivity(
            'Admin',
            'Send Invoice',
            `Invoice ${invoice.invoice_no} sent via email to ${invoice.customer_email}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Email sent successfully', data });

    } catch (error: any) {
        console.error('Error in POST /api/admin/invoices/[id]/send:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
