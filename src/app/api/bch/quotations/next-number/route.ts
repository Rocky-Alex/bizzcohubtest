import { NextResponse } from 'next/server';
import { invoiceSql, quotationSql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
    try {
        const currentYearStr = new Date().getFullYear().toString().slice(-2);
        
        // Fetch the latest invoice number
        const invoiceResult = await invoiceSql`
            SELECT id, invoice_no 
            FROM invoices 
            WHERE invoice_no LIKE 'INV%' 
            ORDER BY id DESC 
            LIMIT 1
        ` as unknown as { invoice_no: string }[];

        // Fetch the latest quotation number
        const quotationResult = await quotationSql`
            SELECT id, quotation_no 
            FROM quotations 
            WHERE quotation_no LIKE 'QTN%' 
            ORDER BY id DESC 
            LIMIT 1
        ` as unknown as { quotation_no: string }[];

        let maxSequence = 0;

        if (invoiceResult.length > 0) {
            const lastInvoiceNo = invoiceResult[0].invoice_no;
            const match = lastInvoiceNo.match(/^INV([0-9]{2})([0-9]+)$/);
            if (match && match[1] === currentYearStr) {
                const num = parseInt(match[2], 10);
                if (!isNaN(num) && num > maxSequence) {
                    maxSequence = num;
                }
            }
        }

        if (quotationResult.length > 0) {
            const lastQuotationNo = quotationResult[0].quotation_no;
            const match = lastQuotationNo.match(/^QTN([0-9]{2})([0-9]+)$/);
            if (match && match[1] === currentYearStr) {
                const num = parseInt(match[2], 10);
                if (!isNaN(num) && num > maxSequence) {
                    maxSequence = num;
                }
            }
        }

        const nextNum = maxSequence + 1;
        const nextSeq = nextNum.toString().padStart(2, '0');
        const nextQuotationNo = `QTN${currentYearStr}${nextSeq}`;

        return NextResponse.json({ nextQuotationNo });
    } catch (error: unknown) {
        console.error('Error fetching next quotation number:', error);
        return NextResponse.json({ error: 'Failed to fetch next quotation number' }, { status: 500 });
    }
}

