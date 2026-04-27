import { NextResponse } from 'next/server';
import { invoiceSql, quotationSql } from '@/lib/db';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { billIds } = body; // billIds: Array of { id, type }

        if (!billIds || !Array.isArray(billIds)) {
            return NextResponse.json({ success: false, error: 'billIds array is required' }, { status: 400 });
        }

        const invoiceIds = billIds.filter(b => b.type === 'invoice').map(b => b.id);
        const quotationIds = billIds.filter(b => b.type === 'quotation').map(b => b.id);

        let allInvoices: any[] = [];
        let allInvoiceItems: any[] = [];
        let allQuotations: any[] = [];
        let allQuotationItems: any[] = [];

        if (invoiceIds.length > 0) {
            allInvoices = await invoiceSql`SELECT * FROM invoices WHERE id = ANY(${invoiceIds})`;
            allInvoiceItems = await invoiceSql`SELECT * FROM invoice_items WHERE invoice_id = ANY(${invoiceIds})`;
        }

        if (quotationIds.length > 0) {
            allQuotations = await quotationSql`SELECT * FROM quotations WHERE id = ANY(${quotationIds})`;
            allQuotationItems = await quotationSql`SELECT * FROM quotation_items WHERE quotation_id = ANY(${quotationIds})`;
        }

        // Combine data
        const data = [
            ...allInvoices.map(inv => ({
                ...inv,
                documentType: 'invoice',
                items: allInvoiceItems.filter(item => item.invoice_id === inv.id)
            })),
            ...allQuotations.map(q => ({
                ...q,
                documentType: 'quotation',
                items: allQuotationItems.filter(item => item.quotation_id === q.id)
            }))
        ];

        // Sort by date (descending) as in the list view
        data.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Export API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
