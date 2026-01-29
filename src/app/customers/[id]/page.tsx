"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [customer, setCustomer] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Customer
            // Requires a specific endpoint for single customer, creating ad-hoc here or need to add it to API
            // Let's assume /api/customers?id= or create new endpoint.
            // For now, I'll filter from the list or update the API. 
            // Better to update API or just fetch all and find (not efficient but works for MVP).
            // Actually, I should have created /api/customers/[id]. I didn't in the plan but I added it to implementation_plan.md.
            // Let's quickly create the API route first.

            // Wait, I didn't create /api/customers/[id] yet. I will rely on creating it in this same turn or next.
            // I'll assume it exists for this file code.
            const res = await fetch(`/api/customers/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCustomer(data.customer); // Assuming API returns { customer, orders }
                setOrders(data.orders);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading customer...</div>;
    if (!customer) return <div style={{ padding: '40px', color: 'white' }}>Customer not found.</div>;

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Link href="/customers" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                    <i className="fas fa-arrow-left"></i> Back to Customers
                </Link>

                <div style={{ background: '#1e293b', borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{customer.name}</h1>
                            <div style={{ color: '#94a3b8' }}>Customer ID: #{customer.customerId}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div>
                            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>Contact Info</h3>
                            <div style={{ marginBottom: '10px' }}><i className="fas fa-envelope" style={{ width: '25px', color: '#64748b' }}></i> {customer.email}</div>
                            <div style={{ marginBottom: '10px' }}><i className="fas fa-phone" style={{ width: '25px', color: '#64748b' }}></i> {customer.phone || 'N/A'}</div>
                        </div>
                        <div>
                            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>Address</h3>
                            <div style={{ lineHeight: '1.6', color: '#cbd5e1' }}>{customer.address || 'No address provided'}</div>
                        </div>
                    </div>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Order History</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {orders.length === 0 ? (
                        <div style={{ padding: '30px', background: '#1e293b', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>No orders found.</div>
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
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: 'bold' }}>Order #{order.orderId}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>${order.totalAmount}</div>
                                        <div style={{
                                            padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem',
                                            background: '#334155', color: '#cbd5e1'
                                        }}>
                                            {order.orderStatus}
                                        </div>
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
