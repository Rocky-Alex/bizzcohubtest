"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Use next/navigation for router in app directory
import { toast } from 'sonner';

export default function PurchaseLotDetailsPage({ params }: { params: { id: string } }) {
    const [lot, setLot] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (params.id) {
            fetchLot();
        }
    }, [params.id]);

    const fetchLot = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/purchase-lots/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setLot(data.lot);
                setItems(data.items);
            } else {
                toast.error('Failed to load purchase lot');
                router.push('/inventory/purchase-lots');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this purchase lot? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/inventory/purchase-lots/${params.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Purchase lot deleted');
                router.push('/inventory/purchase-lots');
            } else {
                toast.error('Failed to delete lot');
            }
        } catch (e) {
            toast.error('Failed to delete lot');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p>Loading details...</p>
            </div>
        );
    }

    if (!lot) return null;

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link href="/inventory/purchase-lots" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '1.2rem' }}>←</span> Back
                        </Link>
                        <span style={{ color: '#334155' }}>/</span>
                        <span style={{ color: '#94a3b8' }}>{lot.invoiceNumber}</span>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '10px' }}>Lot Details</h1>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px', color: '#cbd5e1' }}>
                        <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>SUPPLIER</span>
                            <div style={{ fontWeight: 500 }}>{lot.supplierName}</div>
                        </div>
                        <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>INVOICE DATE</span>
                            <div style={{ fontWeight: 500 }}>{new Date(lot.invoiceDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>TOTAL COST</span>
                            <div style={{ fontWeight: 500, color: '#4ade80' }}>${Number(lot.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleDelete}
                    style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    Delete Lot
                </button>
            </div>

            {/* Items Table */}
            <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#334155', textAlign: 'left' }}>
                            <th style={{ padding: '16px' }}>Product Details</th>
                            <th style={{ padding: '16px' }}>SKU</th>
                            <th style={{ padding: '16px' }}>Qty</th>
                            <th style={{ padding: '16px' }}>Unit Cost</th>
                            <th style={{ padding: '16px' }}>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No items found in this lot.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.itemId} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '16px' }}>{item.productName}</td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace', color: '#cbd5e1' }}>{item.sku || '-'}</td>
                                    <td style={{ padding: '16px' }}>{item.quantity}</td>
                                    <td style={{ padding: '16px' }}>${Number(item.unitCost).toFixed(2)}</td>
                                    <td style={{ padding: '16px', color: '#4ade80' }}>${Number(item.totalCost).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
