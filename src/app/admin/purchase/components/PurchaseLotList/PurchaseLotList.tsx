"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { toast } from 'sonner';
import ConfirmModal from '@/app/admin/shared/ConfirmModal';


interface PurchaseLot {
    id: number;           // Primary Key
    lotId: string;       // LOT-XX
    lotNumber: string | null; // User entered
    supplierName: string;
    invoiceDate: string;
    invoiceNumber: string;
    totalCost: string | null;
    status: string;
    notes: string;
    createdAt: string;
    totalItems?: number;
}

interface PurchaseLotListProps {
    onViewDetail: (id: number) => void;
}

export default function PurchaseLotList({ onViewDetail }: PurchaseLotListProps) {
    const router = useRouter(); // Initialized router
    const [lots, setLots] = useState<PurchaseLot[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewStatus, setViewStatus] = useState<'active' | 'completed'>('active');

    const [error, setError] = useState<string | null>(null);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lotId: number | null }>({
        isOpen: false,
        lotId: null
    });

    useEffect(() => {
        fetchLots();
    }, [viewStatus]);

    const fetchLots = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/purchase/lots?status=${viewStatus}`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                setLots(data.lots || []);
            } else {
                setError(data.error || 'Failed to fetch lots');
                toast.error(data.error || 'Failed to fetch purchase lots');
            }
        } catch (error: any) {
            console.error('Error fetching lots:', error);
            setError(error.message);
            toast.error('Error connecting to purchase API');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (lotId: number) => {
        setDeleteModal({ isOpen: true, lotId });
    };

    const confirmDelete = async () => {
        if (!deleteModal.lotId) return;
        const lotId = deleteModal.lotId;

        try {
            const res = await fetch(`/api/admin/purchase/lots/${lotId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Purchase lot deleted successfully');
                fetchLots();
            }
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete lot');
        } finally {
            setDeleteModal({ isOpen: false, lotId: null });
        }
    };

    const filteredLots = lots.filter(lot => {
        const s = searchTerm.toLowerCase();
        return (
            (lot.supplierName?.toLowerCase().includes(s)) ||
            (lot.invoiceNumber?.toLowerCase().includes(s)) ||
            (lot.lotNumber?.toLowerCase().includes(s)) ||
            (lot.lotId?.toLowerCase().includes(s))
        );
    });

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                        {viewStatus === 'active' ? 'Purchase Inventory Lots' : 'Finished Lots'}
                    </h2>
                </div>

                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                    <div style={{
                        display: 'flex',
                        background: '#f1f5f9',
                        padding: '4px',
                        borderRadius: '12px',
                        position: 'relative',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03), 0 1px 2px rgba(255,255,255,0.5)',
                        border: '1px solid #e2e8f0'
                    }}>
                        {/* Sliding Background */}
                        <div style={{
                            position: 'absolute',
                            top: '4px',
                            bottom: '4px',
                            left: viewStatus === 'active' ? '4px' : 'calc(50% + 2px)',
                            width: 'calc(50% - 6px)',
                            background: '#ffffff',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            pointerEvents: 'none', // Allow clicks to pass through to text
                            zIndex: 0
                        }} />

                        {/* Options */}
                        <div
                            onClick={() => setViewStatus('active')}
                            style={{
                                padding: '6px 20px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                zIndex: 1,
                                color: viewStatus === 'active' ? '#0f172a' : '#64748b',
                                transition: 'color 0.2s',
                                userSelect: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <i className="fas fa-list-ul" style={{ fontSize: '0.8em' }}></i>
                            Active
                        </div>
                        <div
                            onClick={() => setViewStatus('completed')}
                            style={{
                                padding: '6px 20px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                zIndex: 1,
                                color: viewStatus === 'completed' ? '#0f172a' : '#64748b',
                                transition: 'color 0.2s',
                                userSelect: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <i className="fas fa-check-circle" style={{ fontSize: '0.8em' }}></i>
                            Finished
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => router.push('/admin/purchase?section=purchase-lots-import')}
                        style={{
                            padding: '6px 16px',
                            height: '40px', // Match height visual balance
                            borderRadius: '12px', // Match toggle radius
                            background: 'white',
                            color: '#0f172a',
                            border: '1px solid #e2e8f0',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#eff6ff', borderRadius: '50%',
                            width: '24px', height: '24px',
                            color: '#2563eb'
                        }}>
                            <i className="fas fa-plus" style={{ fontSize: '0.75rem' }}></i>
                        </div>
                        Import Lot
                    </button>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                        <input
                            type="text"
                            placeholder="Search by supplier or invoice..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Lot ID</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Lot Number</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Supplier</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Invoice</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Items</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Value</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', textAlign: 'center', fontSize: '0.85rem' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', textAlign: 'center', fontSize: '0.85rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLots.length > 0 ? filteredLots.map((lot) => (
                            <tr key={lot.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', fontWeight: 600, color: '#2563eb', fontSize: '0.9rem' }}>
                                    {lot.lotId}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#334155' }}>{lot.lotNumber || '-'}</td>
                                <td style={{ padding: '1rem', color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>{lot.supplierName}</td>
                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{lot.invoiceNumber}</td>
                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                    {lot.invoiceDate ? new Date(lot.invoiceDate).toLocaleDateString() : '-'}
                                </td>
                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{lot.totalItems || 0}</td>
                                <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                                    AED {lot.totalCost ? Number(lot.totalCost).toLocaleString() : '0'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: lot.status?.toLowerCase() === 'completed' ? '#dcfce7' : '#e0f2fe',
                                        color: lot.status?.toLowerCase() === 'completed' ? '#166534' : '#0369a1',
                                        textTransform: 'capitalize'
                                    }}>
                                        {lot.status || 'Active'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => onViewDetail(lot.id)}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid #2563eb',
                                            background: 'white',
                                            color: '#2563eb',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            transition: 'all 0.2s',
                                            fontSize: '0.85rem'
                                        }}
                                        title="View Details"
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                    >
                                        <i className="fas fa-eye"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(lot.id)}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ef4444',
                                            background: 'white',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            marginLeft: '0.5rem',
                                            transition: 'all 0.2s',
                                            fontSize: '0.85rem'
                                        }}
                                        title="Delete Shipment"
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ marginBottom: '1rem' }}><i className="fas fa-inbox" style={{ fontSize: '2rem' }}></i></div>
                                    No {viewStatus === 'active' ? 'active' : 'finished'} purchase lots found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete Shipment?"
                message="Are you sure you want to delete this entire shipment? This will delete all items and QC records associated with it. This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, lotId: null })}
                type="danger"
            />
        </div>
    );
}
