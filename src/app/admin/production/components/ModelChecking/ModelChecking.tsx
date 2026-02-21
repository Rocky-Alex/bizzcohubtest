'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

interface MasterItem {
    id: number;
    product_name: string;
    brand: string;
    series: string;
    model: string;
    sku: string;
    serial_number: string;
    barcode: string;
    lot_number: string;
    processor: string;
    generation: string;
    condition_status: string;
    qc_status: string;
    unit_cost: number;
    selling_price: number;
    created_at: string;
}

interface PurchaseItem {
    id: number;
    product_name: string;
    quantity: number;
    qc_count: number;
    unit_cost: number;
    lot_number: string;
    supplier_name: string;
    lot_status: string;
    created_at: string;
}

export default function ModelChecking() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ master: MasterItem[], purchase: PurchaseItem[] } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/production/model-check?query=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                if (data.master.length === 0 && data.purchase.length === 0) {
                    toast.info('No results found');
                }
            } else {
                toast.error('Search failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error searching');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                    Model Checking
                </h2>
                <p style={{ color: '#6b7280' }}>Search across Inventory and Purchase Lots to verify stock status.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by Model, SKU, Serial, or Lot..."
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                        outline: 'none',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                    Search
                </button>
            </form>

            {/* Results */}
            {results && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Total Summary */}
                    {/* Total Summary */}
                    <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                        <h3 style={{ margin: 0, color: '#0369a1', fontSize: '1.2rem', fontWeight: 600 }}>Total Quantity Found</h3>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 800, color: '#0c4a6e' }}>
                            {results.master.length + results.purchase.reduce((acc, item) => acc + Number(item.quantity), 0)}
                        </p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#0284c7' }}>
                            ({results.master.length} in Active Inventory + {results.purchase.reduce((acc, item) => acc + Number(item.quantity), 0)} in Purchase Lots)
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                        {/* 1. Master Inventory Table */}
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#065f46', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-boxes"></i> Active Inventory (Master)
                                <span style={{ fontSize: '0.8rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px' }}>{results.master.length} Items</span>
                            </h3>

                            {results.master.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #e5e7eb', color: '#9ca3af' }}>
                                    No matches in active inventory.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Lot Number</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Brand</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Series</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Model</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Barcode</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Core</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Gen</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Cost</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Selling</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.master.map((item, idx) => (
                                                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 500 }}>{item.lot_number || '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                                                        {item.brand || item.product_name || '-'}
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{item.sku}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.series || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.model || '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#10b981' }}>{item.barcode || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.processor || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.generation || '-'}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f3f4f6', color: '#4b5563' }}>
                                                            {item.condition_status || 'Used'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.unit_cost ? `AED ${item.unit_cost}` : '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>{item.selling_price ? `AED ${item.selling_price}` : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 2. Purchase Lots Table */}
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#d97706', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-truck-loading"></i> In Purchase Lots (Incoming)
                                <span style={{ fontSize: '0.8rem', background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '12px' }}>{results.purchase.length} Batches</span>
                            </h3>

                            {results.purchase.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #e5e7eb', color: '#9ca3af' }}>
                                    No matches in purchase lots.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Lot Number</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Supplier</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Product Name</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Core</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Gen</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Total Qty</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Cost Price</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Selling</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.purchase.map((item: any) => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 500 }}>{item.lot_number}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.supplier_name}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{item.product_name}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.processor || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.processor_gen || '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>
                                                        {item.quantity}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: '4px' }}>
                                                            ({item.qc_count} QC)
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                                                            {item.lot_status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.unit_cost ? `AED ${item.unit_cost}` : '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>-</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
