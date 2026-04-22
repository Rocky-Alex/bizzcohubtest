import { NextResponse } from 'next/server';
import { quotationSql as sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import QuotationPDF from '@/components/pdf/QuotationPDF';
import React from 'react';
import path from 'path';
import nodemailer from 'nodemailer';

// Initialize Resend with the provided API key
// In production, this should be in process.env.RESEND_API_KEY

import fs from 'fs';

export async function POST(req: Request, context: any): Promise<NextResponse> {
    try {
        const params = await Promise.resolve(context.params);
        const { id  } = params;

        // 1. Fetch Quotation Data
        const quotationResult = await sql`SELECT * FROM quotations WHERE id = ${id}` as unknown as any[];
        if (quotationResult.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }
        const quotation = quotationResult[0];

        const itemsResult = await sql`SELECT * FROM quotation_items WHERE quotation_id = ${id}` as unknown as any[];

        if (!quotation.customer_email) {
            return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
        }

        // 2. Generate PDF
        const logoPath = path.join(process.cwd(), 'public', 'icon', 'nav-logo.png');
        let logoUrl = '';

        try {
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            } else {
                console.warn('Logo file not found at:', logoPath);
            }
        } catch (err: unknown) {
            console.error('Error reading logo file:', err);
            // Fallback or ignore if logo missing
        }

        let pdfBuffer: Buffer;
        try {
            // Ensure no "as any" hides errors, but if it works it works
            pdfBuffer = await renderToBuffer(
                React.createElement(QuotationPDF, { quotation: quotation, items: itemsResult, logoUrl: logoUrl }) as any
            );
        } catch (pdfError: unknown) {
            console.error('PDF Generation Error:', pdfError);
            const errorMessage = pdfError instanceof Error ? pdfError.message : 'An unknown error occurred';
            return NextResponse.json({ error: 'Failed to generate PDF quotation: ' + errorMessage }, { status: 500 });
        }

        // 3. Send Email
        const targetEmail = quotation.customer_email.trim();
        const subject = `Quotation #${quotation.quotation_no} from BIZZ CO HUB LLC`;
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello ${quotation.customer_name},</h2>
                <p>Thank you for your business. Please find attached your quotation <strong>#${quotation.quotation_no}</strong>.</p>
                <p><strong>Amount Due:</strong> $${Number(quotation.total_amount).toFixed(2)}</p>
                <p><strong>Due Date:</strong> ${new Date(quotation.due_date).toLocaleDateString()}</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>BIZZ CO HUB LLC Team</strong></p>
            </div>
        `;
        const attachments = [
            {
                filename: `Quotation-${quotation.quotation_no}.pdf`,
                content: pdfBuffer,
            },
        ];

        let sentResult: any;

        // Option A: Use Resend if configured
        if (process.env.RESEND_API_KEY) {
            console.log('Using Resend to send quotation...');
            const apiKey = process.env.RESEND_API_KEY.trim();
            const resend = new Resend(apiKey);

            // Note: 'from' address must be verified in Resend dashboard or use onboarding@resend.dev
            // If strictly using onboarding, we can only send to the registered admin email.
            const { data, error } = await resend.emails.send({
                from: 'BIZZ CO HUB LLC <onboarding@resend.dev>',
                to: targetEmail,
                subject: subject,
                html: htmlContent,
                attachments: attachments,
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
                from: `"BIZZ CO HUB LLC" <${smtpUser}>`,
                to: targetEmail,
                subject: subject,
                html: htmlContent,
                attachments: attachments,
            });

            sentResult = { message: 'Sent via SMTP' };
        }

        // 4. Update Quotation Status
        await sql`UPDATE quotations SET status = 'Sent' WHERE id = ${id}`;

        await logActivity(
            'Admin',
            'Send Quotation',
            `Quotation ${quotation.quotation_no} sent via email to ${targetEmail}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Email sent successfully', data: sentResult });

    } catch (error: unknown) {
        console.error('Error in POST /api/bch/quotations/[id]/send:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error: ' + errorMessage }, { status: 500 });
    }
}

