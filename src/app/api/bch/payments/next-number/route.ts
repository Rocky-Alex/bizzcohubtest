import { NextResponse } from 'next/server';
import { invoiceSql, quotationSql, invoiceUrl } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'direct';

        let nextId = 1;
        let prefix = 'REC-';

        if (type === 'invoice') {
            const result = await invoiceSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM invoice_payments`;
            nextId = result[0].next_id;
            prefix = 'REC-I';
        } else if (type === 'quotation') {
            const result = await quotationSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM quotation_payments`;
            nextId = result[0].next_id;
            prefix = 'REC-Q';
        } else {
            const result = await invoiceSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM receipt_list`;
            nextId = result[0].next_id;
        }

        const nextReceiptNo = `${prefix}${nextId.toString().padStart(4, '0')}`;
        
        return NextResponse.json({ 
            nextNumber: nextId,
            nextReceiptNo: nextReceiptNo 
        });
    } catch (error: any) {
        console.error('Error fetching next receipt number:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch next receipt number', 
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
