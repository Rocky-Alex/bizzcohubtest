"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, []);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            } else {
                alert('Order not found');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderStatus: newStatus })
            });
            if (res.ok) fetchOrder();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading order...</div>;
    if (!order) return <div style={{ padding: '40px', color: 'white' }}>Order not found.</div>;

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Link href="/orders" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                    <i className="fas fa-arrow-left"></i> Back to Orders
                </Link>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Order #{order.orderId}</h1>
                        <p style={{ color: '#94a3b8' }}>Placed on {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {order.orderStatus !== 'Cancelled' && (
                            <select
                                value={order.orderStatus}
                                onChange={(e) => updateStatus(e.target.value)}
                                style={{ padding: '10px 16px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        )}
                        <Link href={`/orders/${id}/invoice`} target="_blank">
                            <button style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                Print Invoice
                            </button>
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                    {/* Items */}
                    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px' }}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Order Items</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {order.items.map((item: any) => (
                                <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {item.product?.imageUrl && (
                                            <img src={item.product?.imageUrl} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.product?.name || 'Unknown Product'}</div>
                                            <div style={{ color: '#94a3b8' }}>Qty: {item.quantity} × ${item.unitPrice}</div>
                                            {item.serialId && <div style={{ color: '#fbbf24', fontSize: '0.9rem' }}>Serial ID: {item.serialId}</div>}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8' }}>Total Amount</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${order.totalAmount}</span>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px' }}>
                            <h3 style={{ marginBottom: '15px', color: '#94a3b8' }}>Customer</h3>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>{order.customer?.name}</div>
                            <div style={{ color: '#cbd5e1', marginBottom: '5px' }}>{order.customer?.email}</div>
                            <div style={{ color: '#cbd5e1' }}>{order.customer?.phone}</div>
                        </div>

                        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px' }}>
                            <h3 style={{ marginBottom: '15px', color: '#94a3b8' }}>Shipping Address</h3>
                            <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>
                                {order.customer?.address || 'No address provided'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
