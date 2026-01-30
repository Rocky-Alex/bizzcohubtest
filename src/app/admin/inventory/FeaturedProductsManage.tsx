"use client";
import React, { useEffect, useState } from 'react';

export default function FeaturedProductsManage() {
    const [slots, setSlots] = useState<any[]>(
        Array(10).fill(null).map((_, i) => ({ slot_number: i + 1, product_code: '' }))
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/featured-products');
            if (res.ok) {
                const data = await res.json();
                const newSlots = Array(10).fill(null).map((_, i) => ({ slot_number: i + 1, product_code: '' }));
                if (data.slots) {
                    data.slots.forEach((s: any) => {
                        if (s.slot_number >= 1 && s.slot_number <= 10) {
                            newSlots[s.slot_number - 1] = {
                                ...newSlots[s.slot_number - 1],
                                ...s, // details from DB join
                                product_code: s.product_code // Ensure code is set
                            };
                        }
                    });
                }
                setSlots(newSlots);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedSlots = slots) => {
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/admin/featured-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slots: updatedSlots })
            });

            if (res.ok) {
                setMessage('Configuration Saved Successfully!');
                setTimeout(() => setMessage(''), 3000);
                // Refresh to get details if just typed
                fetchConfig();
            } else {
                setMessage('Failed to save.');
            }
        } catch (e) {
            setMessage('Error saving.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index: number, val: string) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], product_code: val };
        setSlots(newSlots);
    };

    const handleClearSlot = (index: number) => {
        const newSlots = [...slots];
        newSlots[index] = { slot_number: index + 1, product_code: '' }; // Reset
        setSlots(newSlots);
        // Auto save when deleting from delete button
        handleSave(newSlots);
    };

    // Filter slots to show only filled ones in table
    const filledSlots = slots.filter(s => s.product_code && s.product_code.trim() !== '');

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Featured Products Management</h2>
                <p style={{ color: '#666' }}>
                    Enter Product Codes (e.g., BCH-LP-1001) in the slots below and click <b>Save Configuration</b> to update the table and the website.
                </p>
            </div>

            {/* Input Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {slots.map((slot, idx) => (
                    <div key={slot.slot_number} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label style={{ fontWeight: 500, fontSize: '0.9rem', color: '#555' }}>Slot {slot.slot_number}</label>
                            {slot.product_code && (
                                <button onClick={() => handleClearSlot(idx)} style={{ border: 'none', background: 'transparent', color: 'red', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={slot.product_code}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            placeholder={`Code...`}
                            style={{
                                padding: '0.6rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                width: '100%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Save Button Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <button
                    onClick={() => handleSave()}
                    disabled={loading}
                    style={{
                        padding: '0.75rem 2rem',
                        background: 'black',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'wait' : 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Configuration</>}
                </button>
                {message && <span style={{ color: message.includes('Failed') ? 'red' : 'green', fontWeight: 500 }}>{message}</span>}
            </div>

            {/* Active Products Table */}
            <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active Featured Products</h3>
                {filledSlots.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>No featured products configured yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Slot</th>
                                    <th style={{ padding: '12px' }}>Image</th>
                                    <th style={{ padding: '12px' }}>Product Info</th>
                                    <th style={{ padding: '12px' }}>Code</th>
                                    <th style={{ padding: '12px' }}>Price</th>
                                    <th style={{ padding: '12px' }}>Stock</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filledSlots.map((slot) => (
                                    <tr key={slot.slot_number} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>#{slot.slot_number}</td>
                                        <td style={{ padding: '12px' }}>
                                            {slot.primary_image_url ? (
                                                <img src={slot.primary_image_url} alt="Product" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eee' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px' }}></div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 500 }}>{slot.product_name || <span style={{ color: 'orange' }}>Product not found (check code)</span>}</div>
                                        </td>
                                        <td style={{ padding: '12px', color: '#666' }}>{slot.product_code}</td>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>${slot.price || slot.offer_price || 0}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                background: (slot.stock_quantity > 0) ? '#dcfce7' : '#fee2e2',
                                                color: (slot.stock_quantity > 0) ? '#166534' : '#991b1b',
                                                fontSize: '0.85rem'
                                            }}>
                                                {slot.stock_quantity > 0 ? `${slot.stock_quantity} in stock` : 'Out of stock'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleClearSlot(slot.slot_number - 1)}
                                                style={{
                                                    background: '#fee2e2',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 500
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
