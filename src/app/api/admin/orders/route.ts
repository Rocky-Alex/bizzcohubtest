import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // DDL removed for performance


        const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;

        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const orderNumber = `ORD-${Date.now()}`;

        // DDL removed for performance


        const newOrder = await sql`
            INSERT INTO orders (
                order_number,
                customer_name,
                email,
                phone,
                address,
                city,
                zip,
                country,
                items,
                subtotal,
                tax,
                shipping_cost,
                total,
                payment_method,
                status,
                customer_id
            ) VALUES (
                ${orderNumber},
                ${body.firstName + ' ' + body.lastName},
                ${body.email},
                ${body.phone},
                ${body.address},
                ${body.city},
                ${body.zip},
                ${body.country},
                ${JSON.stringify(body.items)},
                ${body.subtotal},
                ${body.tax},
                ${body.shipping},
                ${body.total},
                ${body.paymentMethod || 'COD'},
                'Pending',
                ${body.customerId || null}
            )
            RETURNING *
        `;

        return NextResponse.json({ order: newOrder[0] });
    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, ...updateFields } = body;

        console.log(`[Orders API] Updating order ID: ${id}`);

        if (!id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // DDL removed for performance


        let updatedOrder;

        if (status && Object.keys(updateFields).length === 0) {
            // Just status update
            updatedOrder = await sql`
                UPDATE orders 
                SET status = ${status}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;
        } else {
            // Full Update
            // Note: For simplicity, we are updating the main fields. 
            // In a real app, you might want more granular control or separate endpoints.
            updatedOrder = await sql`
                UPDATE orders 
                SET 
                    customer_name = ${body.firstName + ' ' + body.lastName},
                    email = ${body.email},
                    phone = ${body.phone},
                    address = ${body.address},
                    items = ${JSON.stringify(body.items)},
                    subtotal = ${body.subtotal},
                    tax = ${body.tax},
                    shipping_cost = ${body.shipping},
                    total = ${body.total},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;
        }

        if (updatedOrder.length === 0) {
            console.error(`[Orders API] Order ${id} not found`);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order: updatedOrder[0] });
    } catch (error: any) {
        console.error('[Orders API] Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const result = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Order deleted successfully', id });
    } catch (error: any) {
        console.error('Error deleting order:', error);
        return NextResponse.json({ error: 'Failed to delete order', details: error.message }, { status: 500 });
    }
}
