"use client";

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { toast } from 'sonner';

interface PurchaseLotInventoryItem {
    id: number;
    lot_id: number;
    product_name: string;
    product_type: string | null;
    brand: string | null;
    model: string | null;
    series: string | null;
    processor: string | null;
    processor_gen: string | null;
    ram: string | null;
    storage: string | null;
    quantity: number;
    qc_count: number;
    unit_cost: string | null;
    total_cost: string | null;
    sku: string | null;
    lotNumber: string | null;
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    lotStatus: string;
}

export default function PurchaseLotInventory() {
    const [items, setItems] = useState<PurchaseLotInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const timestamp = Date.now();
            console.log(`[Inventory Debug] Fetching from /api/bch/purchase/lots/inventory?t=${timestamp}`);
            
            const response = await fetch(`/api/bch/purchase/lots/inventory?t=${timestamp}`, { 
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Inventory Debug] Data received:', data);

            if (data.success) {
                const fetchedItems = data.data || [];
                setItems(fetchedItems);
                console.log(`[Inventory Debug] Successfully set ${fetchedItems.length} items to state.`);
            } else {
                toast.error(data.error || 'Failed to fetch inventory');
                console.error('[Inventory Debug] API returned success: false', data);
            }
        } catch (error) {
            console.error('[Inventory Debug] Fetch error:', error);
            toast.error('Error connecting to inventory API');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => {
        const s = searchTerm.toLowerCase();
        if (!s) return true; // Direct pass if search is empty
        
        return (
            (item.product_name?.toLowerCase().includes(s) ?? false) ||
            (item.brand?.toLowerCase().includes(s) ?? false) ||
            (item.model?.toLowerCase().includes(s) ?? false) ||
            (item.lotNumber?.toLowerCase().includes(s) ?? false) ||
            (item.supplierName?.toLowerCase().includes(s) ?? false) ||
            (item.invoiceNumber?.toLowerCase().includes(s) ?? false) ||
            (item.sku?.toLowerCase().includes(s) ?? false)
        );
    });

    const totalQty = filteredItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalQced = filteredItems.reduce((sum, item) => sum + (Number(item.qc_count) || 0), 0);
    const totalCost = filteredItems.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        Purchase Lot Inventory
                    </h2>
                    <button 
                        onClick={() => fetchInventory()}
                        style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>🔄</span> Refresh
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{
                            background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px',
                            fontSize: '0.85rem', fontWeight: 600, border: '1px solid #bfdbfe'
                        }}>
                            Total Qty: {totalQty.toLocaleString()}
                        </div>
                        <div style={{
                            background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: '20px',
                            fontSize: '0.85rem', fontWeight: 600, border: '1px solid #bbf7d0'
                        }}>
                            QC'd: {totalQced.toLocaleString()}
                        </div>
                        <div style={{
                            background: '#fff7ed', color: '#ea580c', padding: '4px 12px', borderRadius: '20px',
                            fontSize: '0.85rem', fontWeight: 600, border: '1px solid #fed7aa'
                        }}>
                            Pending: {(totalQty - totalQced).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input
                        type="text"
                        placeholder="Search product, brand, lot, supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Lot Information</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Product Details</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Specs</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Inventory</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Costing</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? filteredItems.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.9rem' }}>{item.lotNumber}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.supplierName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Inv: {item.invoiceNumber}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{item.product_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.brand} {item.model}</div>
                                        {item.sku && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SKU: {item.sku}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                            {item.processor && <span>{item.processor} {item.processor_gen && `(${item.processor_gen})`}</span>}
                                            <div style={{ marginTop: '2px' }}>
                                                {item.ram && <span style={{ marginRight: '8px' }}><i className="fas fa-memory" style={{ fontSize: '0.7rem' }}></i> {item.ram}</span>}
                                                {item.storage && <span><i className="fas fa-hdd" style={{ fontSize: '0.7rem' }}></i> {item.storage}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                                                Qty: {item.quantity}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                                                QC'd: {item.qc_count}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: Number(item.quantity) - Number(item.qc_count) > 0 ? '#ea580c' : '#64748b' }}>
                                                Rem: {Number(item.quantity) - Number(item.qc_count)}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>Unit: AED {Number(item.unit_cost).toLocaleString()}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Total: AED {Number(item.total_cost).toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                            background: item.lotStatus?.toLowerCase() === 'completed' ? '#dcfce7' : '#e0f2fe',
                                            color: item.lotStatus?.toLowerCase() === 'completed' ? '#166534' : '#0369a1',
                                            textTransform: 'capitalize'
                                        }}>
                                            {item.lotStatus || 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ marginBottom: '1rem' }}><i className="fas fa-inbox" style={{ fontSize: '2rem' }}></i></div>
                                        No items found in purchase lot inventory.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
