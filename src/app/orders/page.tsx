"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');

    const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders?status=${statusFilter}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>Order Management</h1>
                <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Track and manage customer orders.</p>

                {/* Status Tabs */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '20px', borderBottom: '1px solid #334155', marginBottom: '30px' }}>
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '99px',
                                border: 'none',
                                background: statusFilter === status ? '#007aff' : '#1e293b',
                                color: statusFilter === status ? 'white' : '#94a3b8',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: 'bold'
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#1e293b', borderRadius: '12px', color: '#94a3b8' }}>No orders found for this status.</div>
                    ) : (
                        orders.map(order => (
                            <Link href={`/orders/${order.orderId}`} key={order.orderId} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    background: '#1e293b',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <h3 style={{ color: 'white', margin: 0 }}>Order #{order.orderId}</h3>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                                background: '#334155', color: '#cbd5e1'
                                            }}>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ color: '#94a3b8' }}>
                                            {order.customer?.name} ({order.customer?.email})
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>${order.totalAmount}</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                color: order.paymentStatus === 'Paid' ? '#4ade80' : '#facc15'
                                            }}>
                                                {order.paymentStatus}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            background:
                                                order.orderStatus === 'Pending' ? 'rgba(250, 204, 21, 0.2)' :
                                                    order.orderStatus === 'Shipped' ? 'rgba(56, 189, 248, 0.2)' :
                                                        order.orderStatus === 'Delivered' ? 'rgba(74, 222, 128, 0.2)' :
                                                            'rgba(148, 163, 184, 0.2)',
                                            color:
                                                order.orderStatus === 'Pending' ? '#facc15' :
                                                    order.orderStatus === 'Shipped' ? '#38bdf8' :
                                                        order.orderStatus === 'Delivered' ? '#4ade80' :
                                                            '#94a3b8',
                                            fontWeight: 'bold'
                                        }}>
                                            {order.orderStatus}
                                        </div>

                                        <i className="fas fa-chevron-right" style={{ color: '#64748b' }}></i>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
