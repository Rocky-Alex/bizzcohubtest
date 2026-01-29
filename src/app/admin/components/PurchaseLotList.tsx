"use client";

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';

interface PurchaseLot {
    lotId: number;
    lotNumber: string | null;
    supplierName: string;
    invoiceDate: string;
    invoiceNumber: string;
    totalCost: string | null;
    createdAt: string;
    totalItems?: number;
}

interface PurchaseLotListProps {
    onViewDetail: (lotId: number) => void;
}

export default function PurchaseLotList({ onViewDetail }: PurchaseLotListProps) {
    const [lots, setLots] = useState<PurchaseLot[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewStatus, setViewStatus] = useState<'active' | 'completed'>('active');

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lotId: number | null }>({
        isOpen: false,
        lotId: null
    });

    useEffect(() => {
        fetchLots();
    }, [viewStatus]);

    const fetchLots = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/inventory/purchase-lots?status=${viewStatus}`, { cache: 'no-store' });
            const data = await response.json();
            if (data.success) {
                setLots(data.lots);
            }
        } catch (error) {
            console.error('Error fetching lots:', error);
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
            const res = await fetch(`/api/admin/inventory/purchase-lots/${lotId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Purchase lot deleted successfully');
                setLots(prevLots => prevLots.filter(lot => lot.lotId !== lotId));
            } else {
                toast.error('Failed to delete lot');
            }
        } catch (error) {
            console.error('Error deleting lot:', error);
            toast.error('Error deleting lot');
        } finally {
            setDeleteModal({ isOpen: false, lotId: null });
        }
    };

    const filteredLots = lots.filter(lot =>
        lot.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lot.lotNumber && lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                        {viewStatus === 'active' ? 'Purchase Inventory Lots' : 'Finished Lots'}
                    </h2>
                    <button
                        onClick={() => setViewStatus(prev => prev === 'active' ? 'completed' : 'active')}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            borderRadius: '20px',
                            border: '1px solid #cbd5e1',
                            background: viewStatus === 'completed' ? '#0f172a' : 'white',
                            color: viewStatus === 'completed' ? 'white' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        {viewStatus === 'active' ? (
                            <><i className="fas fa-history"></i> Show Finished</>
                        ) : (
                            <><i className="fas fa-list"></i> Show Active</>
                        )}
                    </button>
                </div>
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

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Lot Number</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Supplier</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Invoice #</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Total Items</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Value</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLots.length > 0 ? filteredLots.map((lot) => (
                            <tr key={lot.lotId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(lot.invoiceDate).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', fontWeight: 500, color: '#334155' }}>{lot.lotNumber || 'N/A'}</td>
                                <td style={{ padding: '1rem', color: '#334155', fontWeight: 600 }}>{lot.supplierName}</td>
                                <td style={{ padding: '1rem', color: '#64748b' }}>{lot.invoiceNumber}</td>
                                <td style={{ padding: '1rem', color: '#64748b' }}>{lot.totalItems || 0}</td>
                                <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 700 }}>AED {Number(lot.totalCost).toLocaleString()}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: viewStatus === 'completed' ? '#dcfce7' : '#e0f2fe',
                                        color: viewStatus === 'completed' ? '#166534' : '#0369a1'
                                    }}>
                                        {viewStatus === 'completed' ? 'Finished' : 'Active'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => onViewDetail(lot.lotId)}
                                        style={{
                                            padding: '0.4rem 1rem',
                                            borderRadius: '6px',
                                            border: '1px solid #2563eb',
                                            background: 'white',
                                            color: '#2563eb',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                        title="View Details"
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                    >
                                        <i className="fas fa-eye"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(lot.lotId)}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ef4444',
                                            background: 'white',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            marginLeft: '0.5rem',
                                            transition: 'all 0.2s'
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
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
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
