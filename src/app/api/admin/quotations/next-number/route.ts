import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
    try {
        const result = await sql`
            SELECT quotation_no 
            FROM quotations 
            WHERE quotation_no LIKE 'QTN%' 
            ORDER BY LENGTH(quotation_no) DESC, quotation_no DESC 
            LIMIT 1
        ` as unknown as { quotation_no: string }[];

        let nextNumber = 1;

        if (result.length > 0) {
            const lastQuotationNo = result[0].quotation_no;
            const match = lastQuotationNo.match(/^QTN(\d+)$/);
            if (match && match[1]) {
                const currentNum = parseInt(match[1], 10);
                if (!isNaN(currentNum)) {
                    nextNumber = currentNum + 1;
                }
            }
        }

        const nextQuotationNo = `QTN${nextNumber.toString().padStart(4, '0')}`;

        return NextResponse.json({ nextQuotationNo });
    } catch (error: unknown) {
        console.error('Error fetching next quotation number:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to fetch next quotation number', details: errorMessage }, { status: 500 });
    }
}
