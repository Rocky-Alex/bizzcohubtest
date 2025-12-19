import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const orders = await sql`
            SELECT * FROM orders 
            WHERE customer_id = ${customerId} 
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error('Error fetching customer orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { order_id, action, customer_id } = body;

        console.log(`[Customer Orders API] Order: ${order_id}, Action: ${action}, Customer: ${customer_id}`);

        if (!order_id || !action || !customer_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify ownership (optional but recommended basic check)
        const orderCheck = await sql`SELECT id, status FROM orders WHERE id = ${order_id} AND customer_id = ${customer_id}`;

        if (orderCheck.length === 0) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        const currentStatus = orderCheck[0].status;
        let newStatus = '';

        if (action === 'cancel') {
            if (['Pending', 'Processing'].includes(currentStatus)) {
                newStatus = 'Cancelled';
            } else {
                return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 });
            }
        } else if (action === 'return') {
            if (currentStatus === 'Delivered') {
                newStatus = 'Return Requested';
            } else {
                return NextResponse.json({ error: 'Return can only be requested for delivered items' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updatedOrder = await sql`
            UPDATE orders 
            SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${order_id}
            RETURNING *
        `;

        return NextResponse.json({ success: true, order: updatedOrder[0] });

    } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order', details: error.message }, { status: 500 });
    }
}
