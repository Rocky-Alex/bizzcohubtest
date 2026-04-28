import { NextResponse } from 'next/server';
import { invoiceSql, quotationSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ensureTableExists = async () => {
    // Basic table creation
    await invoiceSql`
        CREATE TABLE IF NOT EXISTS receipt_list (
            id SERIAL PRIMARY KEY,
            receipt_no VARCHAR(50),
            customer_name VARCHAR(255) NOT NULL,
            amount NUMERIC(15, 2) NOT NULL,
            payment_date DATE DEFAULT CURRENT_DATE,
            payment_method VARCHAR(50),
            notes TEXT,
            staff_name VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Ensure columns exist (fast)
    await invoiceSql`ALTER TABLE receipt_list ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255)`;
    await invoiceSql`ALTER TABLE receipt_list ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(50)`;
};

export async function GET() {
    try {
        await ensureTableExists();

        const [invoicePayments, quotationPayments, receiptListPayments] = await Promise.all([
            invoiceSql`
                SELECT 
                    ip.*, 
                    i.customer_name, 
                    i.invoice_no as doc_no, 
                    'invoice' as doc_type 
                FROM invoice_payments ip
                JOIN invoices i ON ip.invoice_id = i.id
            `,
            quotationSql`
                SELECT 
                    qp.*, 
                    q.customer_name, 
                    q.quotation_no as doc_no, 
                    'quotation' as doc_type 
                FROM quotation_payments qp
                JOIN quotations q ON qp.quotation_id = q.id
            `,
            invoiceSql`
                SELECT 
                    *, 
                    'DIRECT' as doc_no, 
                    'direct' as doc_type 
                FROM receipt_list
            `
        ]);

        const allPayments = [...invoicePayments, ...quotationPayments, ...receiptListPayments].sort((a, b) => {
            const dateA = new Date(a.payment_date).getTime();
            const dateB = new Date(b.payment_date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        return NextResponse.json({ payments: allPayments }, { status: 200 });
    } catch (error) {
        console.error('Error fetching combined payments:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch payments' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer_name, amount, date, method, notes, staff_name } = body;

        if (!customer_name || !amount) {
            return NextResponse.json({ error: 'Missing required fields (customer_name, amount)' }, { status: 400 });
        }

        await ensureTableExists();

        // Generate next receipt number
        const lastReceipt = await invoiceSql`
            SELECT id FROM receipt_list ORDER BY id DESC LIMIT 1
        ` as unknown as { id: number }[];
        const nextId = lastReceipt.length > 0 ? lastReceipt[0].id + 1 : 1;
        const generatedReceiptNo = `REC-${nextId.toString().padStart(4, '0')}`;

        // Format date to YYYY-MM-DD
        const paymentDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        const result = await invoiceSql`
            INSERT INTO receipt_list (receipt_no, customer_name, amount, payment_date, payment_method, notes, staff_name)
            VALUES (${generatedReceiptNo}, ${customer_name}, ${Number(amount)}, ${paymentDate}, ${method || 'Cash'}, ${notes || null}, ${staff_name || null})
            RETURNING id, receipt_no
        `;

        if (!result || result.length === 0) {
            throw new Error('No record returned from insertion');
        }

        return NextResponse.json({
            message: 'Direct payment recorded successfully',
            paymentId: result[0].id,
            receiptNo: result[0].receipt_no
        }, { status: 201 });
    } catch (error) {
        console.error('Error recording direct payment:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to record payment' 
        }, { status: 500 });
    }
}

