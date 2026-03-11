import { NextResponse } from 'next/server';
import { invoiceSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const lastReceipt = await invoiceSql`
            SELECT id, receipt_no 
            FROM receipt_list 
            ORDER BY id DESC 
            LIMIT 1
        ` as unknown as { id: number, receipt_no: string }[];

        let nextId = 1;
        if (lastReceipt.length > 0) {
            nextId = lastReceipt[0].id + 1;
        }

        const nextReceiptNo = `REC-${nextId.toString().padStart(4, '0')}`;
        
        return NextResponse.json({ 
            nextNumber: nextId,
            nextReceiptNo: nextReceiptNo 
        });
    } catch (error) {
        console.error('Error fetching next receipt number:', error);
        return NextResponse.json({ error: 'Failed to fetch next receipt number' }, { status: 500 });
    }
}
