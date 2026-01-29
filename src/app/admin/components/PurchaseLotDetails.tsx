"use client";

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'sonner';

interface PurchaseLotItem {
    itemId: number;
    productType: string | null;
    brand: string | null;
    series: string | null;
    model: string | null;
    processor: string | null;
    processorGen: string | null;
    productName: string;
    sku: string | null;
    quantity: number;
    unitCost: string | null;
    totalCost: string | null;
    description: string | null;
}

interface PurchaseLotWithItems {
    lotId: number;
    lotNumber: string | null;
    supplierName: string;
    invoiceDate: string;
    invoiceNumber: string;
    totalCost: string | null;
    notes: string | null;
    createdAt: string;
    items: PurchaseLotItem[];
}

interface PurchaseLotDetailsProps {
    lotId: number;
    onBack: () => void;
}

export default function PurchaseLotDetails({ lotId, onBack }: PurchaseLotDetailsProps) {
    const [lot, setLot] = useState<PurchaseLotWithItems | null>(null);
    const [loading, setLoading] = useState(true);

    // Editing state
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<PurchaseLotItem>>({});

    useEffect(() => {
        fetchLotDetails();
    }, [lotId]);

    const fetchLotDetails = async () => {
        try {
            const response = await fetch(`/api/admin/inventory/purchase-lots/details?id=${lotId}`);

            if (response.status === 404) {
                toast.error('Purchase lot not found or has been deleted');
                onBack(); // Redirect back to list
                return;
            }

            const data = await response.json();
            if (data.success) {
                setLot(data.lot);
            } else {
                toast.error(data.error || 'Failed to load lot details');
                if (data.error === 'Purchase lot not found') {
                    onBack();
                }
            }
        } catch (error) {
            console.error('Error fetching lot details:', error);
            toast.error('Failed to load lot details');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (item: PurchaseLotItem) => {
        setEditingItemId(item.itemId);
        setEditFormData({ ...item });
    };

    const handleCancel = () => {
        setEditingItemId(null);
        setEditFormData({});
    };

    const handleChange = (field: keyof PurchaseLotItem, value: any) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (itemId: number) => {
        try {
            // Reconstruct product name including all specs
            const brand = editFormData.brand || '';
            const series = editFormData.series || '';
            const model = editFormData.model || '';
            const processor = editFormData.processor || '';
            const gen = editFormData.processorGen || '';
            const productName = `${brand} ${series} ${model} ${processor} ${gen}`.trim().replace(/\s+/g, ' ') || editFormData.productName;

            const payload = { ...editFormData, productName };

            const res = await fetch(`/api/admin/inventory/purchase-lots/items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Item updated successfully');
                setEditingItemId(null);
                fetchLotDetails(); // Refresh to see updated totals
            } else {
                toast.error('Failed to update item');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error updating item');
        }
    };

    const handleDelete = async (itemId: number) => {
        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/admin/inventory/purchase-lots/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Item deleted');
                fetchLotDetails();
            } else {
                toast.error('Failed to delete item');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error deleting item');
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!lot) return <div style={{ padding: '2rem', textAlign: 'center' }}>Lot not found.</div>;

    const inputStyle = { width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    title="Back to List"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Lot Details: <span style={{ color: '#2563eb' }}>{lot.invoiceNumber}</span>
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Supplier</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{lot.supplierName}</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Invoice Date</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{new Date(lot.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Lot Number</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{lot.lotNumber || 'N/A'}</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Total Cost</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669', margin: 0 }}>AED {Number(lot.totalCost).toLocaleString()}</p>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>Items List ({lot.items.length})</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Type</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Brand</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Model</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Specs</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Qty</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Unit Cost</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Total</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem', width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lot.items.map((item) => {
                                const isEditing = editingItemId === item.itemId;
                                return (
                                    <tr key={item.itemId} style={{ borderBottom: '1px solid #f1f5f9', background: isEditing ? '#fefff5' : 'transparent' }}>
                                        {isEditing ? (
                                            <>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <input value={editFormData.productType || ''} onChange={e => handleChange('productType', e.target.value)} style={inputStyle} placeholder="Type" />
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <input value={editFormData.brand || ''} onChange={e => handleChange('brand', e.target.value)} style={inputStyle} placeholder="Brand" />
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <input value={editFormData.model || ''} onChange={e => handleChange('model', e.target.value)} style={inputStyle} placeholder="Model" />
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <input value={editFormData.series || ''} onChange={e => handleChange('series', e.target.value)} style={inputStyle} placeholder="Series" />
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <input value={editFormData.processor || ''} onChange={e => handleChange('processor', e.target.value)} style={inputStyle} placeholder="Proc" />
                                                            <input value={editFormData.processorGen || ''} onChange={e => handleChange('processorGen', e.target.value)} style={inputStyle} placeholder="Gen" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <input type="number" value={editFormData.quantity || ''} onChange={e => handleChange('quantity', e.target.value)} style={{ ...inputStyle, width: '70px' }} />
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <input type="number" value={editFormData.unitCost || ''} onChange={e => handleChange('unitCost', e.target.value)} style={{ ...inputStyle, width: '90px' }} />
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#0f172a', fontWeight: 700 }}>
                                                    AED {((Number(editFormData.quantity) || 0) * (Number(editFormData.unitCost) || 0)).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleSave(item.itemId)} style={{ padding: '6px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Save">
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                        <button onClick={handleCancel} style={{ padding: '6px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Cancel">
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>{item.productType}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem' }}>{item.brand}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#1e293b', fontWeight: 500, fontSize: '0.85rem' }}>{item.model}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                                                    {item.series && <span style={{ display: 'block' }}>{item.series}</span>}
                                                    {item.processor && <span style={{ display: 'block', fontSize: '0.75rem' }}>{item.processor} ({item.processorGen})</span>}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.85rem' }}>{item.quantity}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#334155', fontSize: '0.85rem' }}>AED {Number(item.unitCost).toLocaleString()}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem' }}>AED {Number(item.totalCost).toLocaleString()}</td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                                            title="Edit"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.itemId)}
                                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                                            title="Delete"
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {lot.notes && (
                <div style={{ marginTop: '1.5rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: '10px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Notes</p>
                    <p style={{ color: '#b45309', margin: 0, fontSize: '0.9rem' }}>{lot.notes}</p>
                </div>
            )}
        </div>
    );
}
