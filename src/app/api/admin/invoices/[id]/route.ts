import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Update invoice status
        const result = await sql`
            UPDATE invoices
            SET status = ${status}
            WHERE id = ${id}
            RETURNING id, status
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Status updated successfully', invoice: result[0] }, { status: 200 });

    } catch (error: any) {
        console.error('Error updating invoice status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const result = await sql`
            DELETE FROM invoices
            WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
