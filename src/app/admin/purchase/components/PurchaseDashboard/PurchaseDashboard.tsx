"use client";

import React, { useState, useEffect, useCallback } from 'react';
import '@/app/admin/invoicing/InvoicingDashboard.css';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface PurchaseDashboardProps {
    setActiveSection: (section: string) => void;
}

export default function PurchaseDashboard({ setActiveSection }: PurchaseDashboardProps) {
    const [stats, setStats] = useState({
        totalSpend: 0,
        monthlySpend: 0,
        totalLots: 0,
        totalItems: 0,
        pendingQC: 0,
        finishedQC: 0,
        topSuppliers: [] as { name: string, total: number }[],
        recentLots: [] as any[],
        trends: {
            spend: 0
        }
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/purchase/stats', { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStats(data);
                } else {
                    console.error('API Error:', data.error);
                }
            } else {
                console.error('Fetch Failed:', response.status);
            }
        } catch (error) {
            console.error('Network Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useAutoRefresh(fetchStats);

    const renderTrend = (value: number) => {
        if (!value) return (
            <div className="stat-trend neutral">
                <i className="fas fa-minus"></i> 0%
            </div>
        );
        if (value > 0) return (
            <div className="stat-trend positive" style={{ color: '#16a34a', background: '#dcfce7' }}>
                <i className="fas fa-arrow-up"></i> {value.toFixed(1)}%
            </div>
        );
        return (
            <div className="stat-trend negative" style={{ color: '#dc2626', background: '#fee2e2' }}>
                <i className="fas fa-arrow-down"></i> {Math.abs(value).toFixed(1)}%
            </div>
        );
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    }

    return (
        <div className="billing-dashboard-container">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>Purchase Dashboard</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setActiveSection('purchase-lots-import')}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: '#2563eb', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <i className="fas fa-plus"></i> New Purchase
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="billing-stats-grid">
                {/* Total Spend */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <i className="fas fa-money-bill-wave"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Spend</h3>
                        <p className="stat-value">AED {stats.totalSpend.toLocaleString()}</p>
                    </div>
                </div>

                {/* Monthly Spend */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                            <i className="fas fa-calendar-alt"></i>
                        </div>
                        {renderTrend(stats.trends.spend)}
                    </div>
                    <div className="stat-content">
                        <h3>Spend This Month</h3>
                        <p className="stat-value">AED {stats.monthlySpend.toLocaleString()}</p>
                    </div>
                </div>

                {/* Total Lots */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
                            <i className="fas fa-truck-loading"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Lots</h3>
                        <p className="stat-value">{stats.totalLots}</p>
                    </div>
                </div>

                {/* Total Items */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <i className="fas fa-truck-loading"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Items</h3>
                        <p className="stat-value">{stats.totalItems}</p>
                    </div>
                </div>

                {/* Items Pending QC */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <i className="fas fa-tasks"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Pending QC</h3>
                        <p className="stat-value">{stats.pendingQC}</p>
                    </div>
                </div>

                {/* items Finished QC */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Finished QC</h3>
                        <p className="stat-value">{stats.finishedQC}</p>
                    </div>
                </div>
            </div>

            <div className="billing-charts-grid">
                {/* Recent Purchases */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Recent Purchase Lots</h3>
                        <button
                            onClick={() => setActiveSection('purchase-lots-list')}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            View All
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>Lot Number</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>Supplier</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>Amount</th>
                                    <th style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentLots.map(lot => (
                                    <tr key={lot.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{lot.lot_number || 'N/A'}</td>
                                        <td style={{ padding: '0.75rem', color: '#475569' }}>{lot.supplier_name}</td>
                                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{new Date(lot.invoice_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>AED {parseFloat(lot.total_cost).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: lot.status?.toLowerCase() === 'active' ? '#dcfce7' : '#f1f5f9',
                                                color: lot.status?.toLowerCase() === 'active' ? '#15803d' : '#64748b'
                                            }}>
                                                {lot.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Suppliers */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Top Suppliers</h3>
                    </div>
                    <div className="activity-list">
                        {stats.topSuppliers.map((supplier, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-icon payment" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                    <i className="fas fa-building"></i>
                                </div>
                                <div className="activity-content">
                                    <div className="activity-title">{supplier.name}</div>
                                    <div className="activity-time">Total Spend: <span>AED {parseFloat(supplier.total.toString()).toLocaleString()}</span></div>
                                </div>
                            </div>
                        ))}
                        {stats.topSuppliers.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No supplier data yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section" style={{ marginTop: '2rem' }}>
                <h3 className="quick-actions-header">Purchase Actions</h3>
                <div className="quick-actions-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    <div className="action-card" onClick={() => setActiveSection('purchase-lots-import')}>
                        <div className="action-icon">
                            <i className="fas fa-file-excel"></i>
                        </div>
                        <div className="action-info">
                            <h4>Import Purchase Lot</h4>
                            <p>Bulk import items from supplier excel</p>
                        </div>
                    </div>

                    <div className="action-card" onClick={() => setActiveSection('purchase-import-full')}>
                        <div className="action-icon" style={{ background: '#fef3c7', color: '#a35d0d' }}>
                            <i className="fas fa-file-excel"></i>
                        </div>
                        <div className="action-info">
                            <h4>Full Import</h4>
                            <p>Bulk import items from supplier excel as full import</p>
                        </div>
                    </div>

                    <div className="action-card" onClick={() => setActiveSection('purchase-lots-list')}>
                        <div className="action-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                            <i className="fas fa-history"></i>
                        </div>


                        <div className="action-info">
                            <h4>Purchase History</h4>
                            <p>View and manage all previous purchases</p>
                        </div>
                    </div>

                    <div className="action-card" onClick={() => (window.location.href = '/admin/inventory?section=inventory-qc')}>
                        <div className="action-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                            <i className="fas fa-check-double"></i>
                        </div>
                        <div className="action-info">
                            <h4>QC Processing</h4>
                            <p>Verify and approve purchased items</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
