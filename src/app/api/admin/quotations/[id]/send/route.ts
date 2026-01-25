import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import QuotationPDF from '@/components/pdf/QuotationPDF';
import React from 'react';
import path from 'path';

// Initialize Resend with the provided API Key
// Resend initialized inside POST

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;

        // 1. Fetch Quotation Data
        const quotationResult = await sql`SELECT * FROM quotations WHERE id = ${id}`;
        if (quotationResult.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }
        const quote = quotationResult[0];

        if (!quote.customer_email) {
            return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
        }

        const itemsResult = await sql`SELECT * FROM quotation_items WHERE quotation_id = ${id}`;

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
        }

        let pdfBuffer;
        try {
            pdfBuffer = await renderToBuffer(
                React.createElement(QuotationPDF, { quotation: quote, items: itemsResult, logoUrl: logoUrl }) as any
            );
        } catch (pdfError: any) {
            console.error('PDF Generation Error:', pdfError);
            return NextResponse.json({ error: 'Failed to generate PDF: ' + pdfError.message }, { status: 500 });
        }

        // 3. Send Email with Attachment
        // Using "Bizz Co Hub <onboarding@resend.dev>" as sender to ensure free-tier delivery
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: 'RESEND_API_KEY is missing' }, { status: 500 });
        }
        const resend = new Resend(process.env.RESEND_API_KEY!.trim());

        const { data, error } = await resend.emails.send({
            from: 'Bizz Co Hub <onboarding@resend.dev>',
            to: [quote.customer_email], // Send to customer email
            subject: `Quotation #${quote.quotation_no} from Bizz Co Hub`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Hello ${quote.customer_name},</h2>
                    <p>Please find attached your quotation <strong>#${quote.quotation_no}</strong>.</p>
                    <p><strong>Total Amount:</strong> $${Number(quote.total_amount).toFixed(2)}</p>
                    <p><strong>Valid Until:</strong> ${new Date(quote.due_date).toLocaleDateString()}</p>
                    <br/>
                    <p>Best regards,</p>
                    <p><strong>Bizz Co Hub Team</strong></p>
                </div>
            `,
            attachments: [
                {
                    filename: `Quotation-${quote.quotation_no}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error('Resend API Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully via Resend', id: data?.id }, { status: 200 });

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
