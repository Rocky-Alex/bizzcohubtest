import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, company, email, category, message } = body;

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const htmlContent = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #4f46e5;">New Contact Request</h2>
                <p>You have received a new message from the Bizz Co Hub contact form.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">Name:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Company:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${company || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Category:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${category}</td>
                    </tr>
                </table>

                <div style="margin-top: 20px;">
                    <h3 style="color: #666;">Message:</h3>
                    <p style="background: #f9fafb; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</p>
                </div>
                
                <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
                    This email was sent from the Bizz Co Hub website.
                </p>
            </div>
        `;

        const result = await sendEmail(
            'bizzcohubllc@gmail.com',
            `New Contact Request: ${category || 'General'}`,
            htmlContent
        );

        if (!result.success) {
            console.error('Email sending failed:', result.error);
            return NextResponse.json({ error: 'Failed to send email. Ensure server email configuration is correct.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Contact API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
