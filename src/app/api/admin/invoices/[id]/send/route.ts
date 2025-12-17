import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import nodemailer from 'nodemailer';

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

        // 2. Configure Transporter
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpUser || !smtpPass) {
            console.error('SMTP Credentials missing. User:', smtpUser ? 'Set' : 'Missing', 'Pass:', smtpPass ? 'Set' : 'Missing');
            return NextResponse.json({ error: 'Server misconfiguration: SMTP credentials missing in .env. Please restart the server.' }, { status: 500 });
        }

        // Note: User must configure these env vars
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 3. Generate HTML Content (simplified version of print layout for email)
        // Emails need inline styles and simple structure
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 3px solid #0c86ea;">
                    <h1 style="color: #0c86ea; margin: 0;">INVOICE</h1>
                    <p style="margin: 5px 0; color: #666;">#${invoice.invoice_no}</p>
                </div>
                
                <div style="padding: 20px;">
                    <p>Dear <strong>${invoice.customer_name}</strong>,</p>
                    <p>Please find attached the invoice for your recent purchase/service.</p>
                    
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Invoice Summary</h3>
                        <p><strong>Amount Due:</strong> <span style="color: #dc2626; font-size: 1.2em;">$${Number(invoice.total_amount).toFixed(2)}</span></p>
                        <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #e2e8f0;">
                                <th style="padding: 10px; text-align: left;">Description</th>
                                <th style="padding: 10px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsResult.map((item: any) => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px;">${item.description} <br><small style="color: #777;">(${item.quantity} x $${Number(item.unit_price).toFixed(2)})</small></td>
                                    <td style="padding: 10px; text-align: right;">$${Number(item.total).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                     <div style="text-align: right; margin-top: 20px;">
                        <p><strong>Total: $${Number(invoice.total_amount).toFixed(2)}</strong></p>
                    </div>

                    <p style="margin-top: 30px;">Thank you for your business!</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 0.8em; color: #888; text-align: center;">
                        Bizz Co Hub | Professional Solutions for Modern Business
                    </p>
                </div>
            </div>
        `;

        // 4. Send Email
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"BizzCo Hub" <no-reply@bizzcohub.com>',
            to: invoice.customer_email,
            subject: `Invoice #${invoice.invoice_no} from Bizz Co Hub`,
            html: htmlContent,
        });

        // 5. Update Invoice Status to 'Sent' (Optional but good practice)
        await sql`UPDATE invoices SET status = 'Sent' WHERE id = ${id}`;

        return NextResponse.json({ message: 'Email sent successfully' });

    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email: ' + error.message }, { status: 500 });
    }
}
