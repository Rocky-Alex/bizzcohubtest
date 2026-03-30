import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/db';

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const number = searchParams.get('number');
        const type = searchParams.get('type') || 'invoice'; // 'invoice' or 'quotation'

        if (!number) {
            return NextResponse.json({ error: 'Number is required' }, { status: 400 });
        }

        let docResult: any[] = [];
        let itemsResult: any[] = [];

        if (type === 'invoice') {
            docResult = await sql`SELECT * FROM invoices WHERE invoice_no = ${number}` as unknown as any[];
            if (docResult.length > 0) {
                itemsResult = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${docResult[0].id}` as unknown as any[];
            }
        } else {
            docResult = await sql`SELECT * FROM quotations WHERE quotation_no = ${number}` as unknown as any[];
            if (docResult.length > 0) {
                itemsResult = await sql`SELECT * FROM quotation_items WHERE quotation_id = ${docResult[0].id}` as unknown as any[];
            }
        }

        if (docResult.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            document: docResult[0], 
            items: itemsResult.map(item => ({
                id: item.id,
                description: item.description,
                quantity: Number(item.quantity || item.qty),
                product_code: item.product_code
            }))
        }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error looking up document:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
