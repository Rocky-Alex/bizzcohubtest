import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import { logActivity } from '@/lib/activity-logger';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/pdf/InvoicePDF';
import React from 'react';
import path from 'path';
import nodemailer from 'nodemailer';

// Initialize Resend with the provided API key
// In production, this should be in process.env.RESEND_API_KEY

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
            // Ensure no "as any" hides errors, but if it works it works
            pdfBuffer = await renderToBuffer(
                React.createElement(InvoicePDF, { invoice: invoice, items: itemsResult, logoUrl: logoUrl }) as any
            );
        } catch (pdfError: any) {
            console.error('PDF Generation Error:', pdfError);
            return NextResponse.json({ error: 'Failed to generate PDF invoice: ' + pdfError.message }, { status: 500 });
        }

        // 3. Send Email
        const targetEmail = invoice.customer_email.trim();
        const subject = `Invoice #${invoice.invoice_no} from Bizz Co Hub`;
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello ${invoice.customer_name},</h2>
                <p>Thank you for your business. Please find attached your invoice <strong>#${invoice.invoice_no}</strong>.</p>
                <p><strong>Amount Due:</strong> $${Number(invoice.total_amount).toFixed(2)}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>Bizz Co Hub Team</strong></p>
            </div>
        `;
        const attachments = [
            {
                filename: `Invoice-${invoice.invoice_no}.pdf`,
                content: pdfBuffer,
            },
        ];

        let sentResult;

        // Option A: Use Resend if configured
        if (process.env.RESEND_API_KEY) {
            console.log('Using Resend to send invoice...');
            const apiKey = process.env.RESEND_API_KEY.trim();
            const resend = new Resend(apiKey);

            // Note: 'from' address must be verified in Resend dashboard or use onboarding@resend.dev
            // If strictly using onboarding, we can only send to the registered admin email.
            const { data, error } = await resend.emails.send({
                from: 'Bizz Co Hub <onboarding@resend.dev>',
                to: targetEmail,
                subject: subject,
                html: htmlContent,
                attachments: attachments as any,
            });

            if (error) {
                console.error('Resend Error:', JSON.stringify(error, null, 2));
                // Do not throw immediately, allow fallback if we wanted, but here we just error out or try SMTP?
                // For now, let's treat Resend error as fatal for Resend path.
                throw new Error('Resend failed: ' + error.message);
            }
            sentResult = data;
        }
        // Option B: Use Nodemailer (SMTP/Gmail)
        else {
            console.log('Resend API key missing, attempting Nodemailer/SMTP...');

            // Try to find credentials in env
            const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
            const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
            // Use smtp.gmail.com as default if not specified but user/pass exist
            const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
            const smtpPort = Number(process.env.SMTP_PORT) || 587;
            const smtpSecure = process.env.SMTP_SECURE === 'true';

            if (!smtpUser || !smtpPass) {
                return NextResponse.json({ error: 'Email configuration missing. Please set RESEND_API_KEY or SMTP_USER/PASS/GMAIL_USER.' }, { status: 500 });
            }

            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            await transporter.sendMail({
                from: `"Bizz Co Hub" <${smtpUser}>`,
                to: targetEmail,
                subject: subject,
                html: htmlContent,
                attachments: attachments,
            });

            sentResult = { message: 'Sent via SMTP' };
        }

        // 4. Update Invoice Status
        await sql`UPDATE invoices SET status = 'Sent' WHERE id = ${id}`;

        await logActivity(
            'Admin',
            'Send Invoice',
            `Invoice ${invoice.invoice_no} sent via email to ${targetEmail}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Email sent successfully', data: sentResult });

    } catch (error: any) {
        console.error('Error in POST /api/admin/invoices/[id]/send:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
