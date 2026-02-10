import { NextResponse } from 'next/server';
import { invoiceSql as sql } from '@/lib/invoice-db';
import { logActivity } from '@/lib/activity-logger';
import { Quotation, QuotationItem } from '@/types';

export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;

        const quotationResult = await sql`
            SELECT * FROM quotations WHERE id = ${id}
        ` as unknown as Quotation[];

        if (quotationResult.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        const itemsResult = await sql`
            SELECT * FROM quotation_items WHERE quotation_id = ${id}
        ` as unknown as QuotationItem[];

        return NextResponse.json({ quotation: quotationResult[0], items: itemsResult }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching quotation details:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const result = await sql`
            UPDATE quotations
            SET status = ${status}
            WHERE id = ${id}
            RETURNING id, status
        ` as unknown as { id: number, status: string }[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        await logActivity(
            'Admin',
            'Update Quotation Status',
            `Quotation #${id} status updated to ${status}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Status updated successfully', quotation: result[0] }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error updating quotation status:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;
        const body = await req.json();
        const {
            quotationNo, customerId, customerName, customerAddress, customerEmail, customerPhone,
            createdDate, dueDate, subTotal, discountTotal, taxRate, taxAmount, totalAmount,
            paymentType, status, isTaxable, isDiscountable, advanceReceived, items
        } = body;

        if (!quotationNo || !customerName || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await sql`
            UPDATE quotations SET
                quotation_no = ${quotationNo},
                customer_id = ${customerId || null},
                customer_name = ${customerName},
                customer_address = ${customerAddress},
                customer_email = ${customerEmail},
                customer_phone = ${customerPhone},
                created_date = ${createdDate},
                due_date = ${dueDate},
                sub_total = ${subTotal},
                discount_total = ${discountTotal},
                tax_rate = ${taxRate},
                tax_amount = ${taxAmount},
                total_amount = ${totalAmount},
                payment_type = ${paymentType},
                status = ${status || 'Pending'},
                is_taxable = ${isTaxable},
                is_discountable = ${isDiscountable},
                advance_received = ${advanceReceived || 0}
            WHERE id = ${id}
            RETURNING id
        ` as unknown as { id: number }[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        await sql`DELETE FROM quotation_items WHERE quotation_id = ${id}`;

        for (const item of items) {
            await sql`
                INSERT INTO quotation_items (
                    quotation_id, description, quantity, unit_price, discount, total
                ) VALUES (
                    ${id}, ${item.description}, ${item.qty}, ${item.cost}, ${item.discount}, ${item.total}
                )
            `;
        }

        await logActivity(
            customerName || 'Admin',
            'Update Quotation',
            `Quotation #${quotationNo} updated. Total: ${totalAmount}`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Quotation updated successfully' }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error updating quotation:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { id } = params;

        const result = await sql`
            DELETE FROM quotations
            WHERE id = ${id}
            RETURNING id
        ` as unknown as { id: number }[];

        if (result.length === 0) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        await logActivity(
            'Admin',
            'Delete Quotation',
            `Quotation #${id} deleted`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Quotation deleted successfully' }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error deleting quotation:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
