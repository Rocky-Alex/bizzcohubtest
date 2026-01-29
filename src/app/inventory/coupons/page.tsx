"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage', // percentage or fixed
        discountValue: '',
        minOrderAmount: '0',
        usageLimit: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/coupons');
            if (res.ok) {
                const data = await res.json();
                setCoupons(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
            if (res.ok) fetchCoupons();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({
                    code: '',
                    discountType: 'percentage',
                    discountValue: '',
                    minOrderAmount: '0',
                    usageLimit: '',
                    startDate: '',
                    endDate: ''
                });
                fetchCoupons();
            } else {
                alert('Failed to create coupon');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Link href="/inventory" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                    <i className="fas fa-arrow-left"></i> Back to Inventory
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Coupons & Discounts</h1>
                        <p style={{ color: '#94a3b8' }}>Manage promotional codes and offers.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{ padding: '12px 24px', background: '#007aff', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        + Create Coupon
                    </button>
                </div>

                <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#334155', textAlign: 'left' }}>
                                <th style={{ padding: '16px' }}>Code</th>
                                <th style={{ padding: '16px' }}>Discount</th>
                                <th style={{ padding: '16px' }}>Min. Order</th>
                                <th style={{ padding: '16px' }}>Expiry</th>
                                <th style={{ padding: '16px' }}>Usage</th>
                                <th style={{ padding: '16px' }}>Status</th>
                                <th style={{ padding: '16px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>No coupons found.</td></tr>
                            ) : (
                                coupons.map(c => (
                                    <tr key={c.couponId} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{c.code}</td>
                                        <td style={{ padding: '16px' }}>
                                            {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                                        </td>
                                        <td style={{ padding: '16px' }}>${c.minOrderAmount}</td>
                                        <td style={{ padding: '16px' }}>{c.endDate ? new Date(c.endDate).toLocaleDateString() : 'No Expiry'}</td>
                                        <td style={{ padding: '16px' }}>{c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : ''}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem',
                                                background: c.status === 'Active' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                color: c.status === 'Active' ? '#4ade80' : '#94a3b8'
                                            }}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button
                                                onClick={() => handleDelete(c.couponId)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                        <h2 style={{ marginBottom: '20px' }}>Create New Coupon</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Coupon Code</label>
                                <input style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. SUMMERAG" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Type</label>
                                    <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Value</label>
                                    <input type="number" step="0.01" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} required value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Min Order Amount ($)</label>
                                <input type="number" step="0.01" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} value={formData.minOrderAmount} onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Usage Limit (Optional)</label>
                                    <input type="number" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} value={formData.usageLimit} onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>End Date (Optional)</label>
                                    <input type="date" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#007aff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create Coupon</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
