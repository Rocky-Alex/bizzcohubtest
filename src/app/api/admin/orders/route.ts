import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { Resend } from 'resend';

// Resend initialized inside POST

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

        await logActivity(
            'Admin',
            'Create Order',
            `Order created: ${orderNumber} for ${body.firstName} ${body.lastName}`,
            'success',
            'Admin'
        );

        // Send Order Confirmation Email
        try {
            if (process.env.RESEND_API_KEY) {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'Bizz Co Hub <onboarding@resend.dev>',
                    to: ['rishadpnpm@gmail.com'], // Restricted to verified email in Resend free tier
                    subject: `New Order Received: ${orderNumber}`,
                    html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #4f46e5;">New Order Received!</h2>
                        <p>Order <strong>${orderNumber}</strong> has been placed by <strong>${body.firstName} ${body.lastName}</strong>.</p>
                        
                        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                ${body.items.map((item: any) => `
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                            ${item.name} x ${item.quantity}
                                        </td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
                                            $${(item.price * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                `).join('')}
                                <tr>
                                    <td style="padding: 12px 0; font-weight: bold;">Total</td>
                                    <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 1.1em;">
                                        $${Number(body.total).toFixed(2)}
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin-top: 20px;">
                            <p><strong>Shipping to:</strong></p>
                            <p style="color: #666;">
                                ${body.address}, ${body.city}, ${body.state}, ${body.zip}<br/>
                                ${body.country}
                            </p>
                        </div>
                        
                        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
                            View order details in the Admin Dashboard.
                        </p>
                    </div>
                `
                });
            }
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Continue without failing the request, as the order is created
        }

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

        await logActivity(
            'Admin',
            'Update Order',
            `Order ${id} updated${status ? ` to status: ${status}` : ''}`,
            'success',
            'Admin'
        );

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

        await logActivity(
            'Admin',
            'Delete Order',
            `Order ${id} deleted`,
            'success',
            'Admin'
        );

        return NextResponse.json({ message: 'Order deleted successfully', id });
    } catch (error: any) {
        console.error('Error deleting order:', error);
        return NextResponse.json({ error: 'Failed to delete order', details: error.message }, { status: 500 });
    }
}
