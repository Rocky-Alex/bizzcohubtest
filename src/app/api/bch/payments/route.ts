import { NextResponse } from 'next/server';
import { invoiceSql, quotationSql } from '@/lib/db';

export async function GET() {
    try {
        // Ensure receipt_list table exists
        await invoiceSql`
            CREATE TABLE IF NOT EXISTS receipt_list (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                payment_date DATE DEFAULT CURRENT_DATE,
                payment_method VARCHAR(50),
                notes TEXT,
                staff_name VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

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
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer_name, amount, date, method, notes, staff_name } = body;

        if (!customer_name || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure table exists
        await invoiceSql`
            CREATE TABLE IF NOT EXISTS receipt_list (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                payment_date DATE DEFAULT CURRENT_DATE,
                payment_method VARCHAR(50),
                notes TEXT,
                staff_name VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const result = await invoiceSql`
            INSERT INTO receipt_list (customer_name, amount, payment_date, payment_method, notes, staff_name)
            VALUES (${customer_name}, ${amount}, ${date || new Date().toISOString()}, ${method || 'Cash'}, ${notes}, ${staff_name})
            RETURNING id
        `;

        return NextResponse.json({
            message: 'Direct payment recorded successfully',
            paymentId: result[0].id
        }, { status: 201 });
    } catch (error) {
        console.error('Error recording direct payment:', error);
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }
}

