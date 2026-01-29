"use client";

import React, { useState, useEffect } from 'react';

export default function InvoicePage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            const res = await fetch(`/api/orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            }
        };
        fetchOrder();
    }, []);

    if (!order) return <div style={{ padding: '40px' }}>Loading Invoice...</div>;

    return (
        <div style={{ background: 'white', color: 'black', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>INVOICE</h1>
                    <div style={{ color: '#666' }}>Invoice #: INV-{order.orderId}</div>
                    <div style={{ color: '#666' }}>Date: {new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>Bizz Co Hub</h2>
                    <div style={{ color: '#666' }}>123 Tech Street</div>
                    <div style={{ color: '#666' }}>Silicon Valley, CA 94000</div>
                    <div style={{ color: '#666' }}>support@bizzco.com</div>
                </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: '50px' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Bill To:</h3>
                <div style={{ fontWeight: 'bold' }}>{order.customer?.name}</div>
                <div>{order.customer?.email}</div>
                <div>{order.customer?.phone}</div>
                <div style={{ maxWidth: '300px', marginTop: '5px' }}>{order.customer?.address}</div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                        <th style={{ padding: '15px', borderBottom: '2px solid #ddd' }}>Item Description</th>
                        <th style={{ padding: '15px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Quantity</th>
                        <th style={{ padding: '15px', borderBottom: '2px solid #ddd', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '15px', borderBottom: '2px solid #ddd', textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item: any) => (
                        <tr key={item.itemId}>
                            <td style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                                <div style={{ fontWeight: 'bold' }}>{item.product?.name}</div>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>SKU: {item.product?.sku}</div>
                                {item.serialId && <div style={{ fontSize: '0.8rem', color: '#888' }}>SN: {item.serialId}</div>}
                            </td>
                            <td style={{ padding: '15px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '15px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${parseFloat(item.unitPrice).toFixed(2)}</td>
                            <td style={{ padding: '15px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                        <span>Subtotal:</span>
                        <span>${order.totalAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                        <span>Tax (0%):</span>
                        <span>$0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        <span>Total:</span>
                        <span>${order.totalAmount}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '80px', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                <p>Thank you for your business!</p>
                <button
                    onClick={() => window.print()}
                    style={{ marginTop: '20px', padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    className="no-print"
                >
                    Print / Save as PDF
                </button>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
}
