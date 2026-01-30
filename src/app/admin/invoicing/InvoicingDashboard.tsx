import React from 'react';
import './InvoicingDashboard.css';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import ConfirmModal from '../shared/ConfirmModal';

interface InvoicingDashboardProps {
    setActiveSection: (section: string) => void;
}

export default function InvoicingDashboard({ setActiveSection }: InvoicingDashboardProps) {
    const [stats, setStats] = React.useState<{
        totalInvoices: number;
        totalReceived: number;
        totalCreditAmount: number;
        totalPartialCount: number;
        totalPendingCount: number;
        totalQuotations: number;
        pendingAmount: number;
        overdueAmount: number;
        trends: any;
        recentTransactions: any[];
        monthlyRevenue: any[];
    }>({
        totalInvoices: 0,
        totalReceived: 0,
        totalCreditAmount: 0,
        totalPartialCount: 0,
        totalPendingCount: 0,
        totalQuotations: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        trends: {
            invoices: 0,
            received: 0,
            pending: 0,
            overdue: 0
        },
        recentTransactions: [],
        monthlyRevenue: []
    });

    const [confirmModal, setConfirmModal] = React.useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    const fetchStats = React.useCallback(async () => {
        try {
            const response = await fetch('/api/admin/invoices/stats', { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching invoice stats:', error);
        }
    }, []);

    // Initial Fetch
    React.useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Auto Refresh Logic
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

    // Calculate max revenue for chart scaling
    const maxRevenue = React.useMemo(() => {
        if (!stats.monthlyRevenue.length) return 100;
        return Math.max(...stats.monthlyRevenue.map((d: any) => Number(d.revenue))) || 100;
    }, [stats.monthlyRevenue]);

    return (
        <div className="billing-dashboard-container">
            {/* Quick Actions Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>Invoicing Dashboard</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>

                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch('/api/admin/invoices');
                                if (!res.ok) throw new Error('Failed to fetch invoices');
                                const data = await res.json();
                                const invoices = data.invoices || [];

                                if (invoices.length === 0) {
                                    setConfirmModal({
                                        isOpen: true,
                                        title: 'Info',
                                        message: 'No invoices to export',
                                        type: 'info',
                                        singleButton: true,
                                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                    });
                                    return;
                                }

                                // Define CSV Headers
                                const headers = [
                                    'Invoice Number',
                                    'Invoice Date',
                                    'Due Date',
                                    'Customer Name',
                                    'Status',
                                    'Total Amount',
                                    'Paid Amount',
                                    'Balance Due'
                                ];

                                // Map Data to Rows
                                const rows = invoices.map((inv: any) => [
                                    inv.invoice_no,
                                    new Date(inv.created_date).toLocaleDateString(),
                                    new Date(inv.due_date).toLocaleDateString(),
                                    `"${inv.customer_name}"`, // Quote to handle commas
                                    inv.status,
                                    inv.total_amount,
                                    inv.advance_received ? Number(inv.advance_received).toFixed(2) : '0.00',
                                    (Number(inv.total_amount) - Number(inv.advance_received || 0)).toFixed(2)
                                ]);

                                // Construct CSV Content
                                const csvContent = [
                                    headers.join(','),
                                    ...rows.map((row: any[]) => row.join(','))
                                ].join('\n');

                                // Trigger Download
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);

                            } catch (error) {
                                console.error('Export failed:', error);
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Error',
                                    message: 'Failed to export invoices',
                                    type: 'danger',
                                    singleButton: true,
                                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                });
                            }
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.6rem 1rem',
                            backgroundColor: '#0c86ea', border: 'none', borderRadius: '8px',
                            color: '#fff', fontSize: '0.9rem', fontWeight: 600,
                            cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <i className="fas fa-file-export"></i> Export
                    </button>
                </div>
            </div>
            {/* Header / Title could go here if not handled by parent */}

            {/* Stats Overview */}
            <div className="billing-stats-grid">
                {/* 1. Total Paid Invoice (Amount) */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <i className="fas fa-wallet"></i>
                        </div>
                        {renderTrend(stats.trends?.received)}
                    </div>
                    <div className="stat-content">
                        <h3>Total Paid Invoice</h3>
                        <p className="stat-value">${stats.totalReceived.toFixed(2)}</p>
                    </div>
                </div>

                {/* 2. Total Credit Invoice (Amount) */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                            <i className="fas fa-credit-card"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Credit Invoice</h3>
                        <p className="stat-value">${stats.totalCreditAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* 3. Total Partial Invoice (Count) */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
                            <i className="fas fa-adjust"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Partial Invoice</h3>
                        <p className="stat-value">{stats.totalPartialCount}</p>
                    </div>
                </div>

                {/* 4. Total Pending Invoice (Count) */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
                            <i className="fas fa-hourglass-start"></i>
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Pending Invoice</h3>
                        <p className="stat-value">{stats.totalPendingCount}</p>
                    </div>
                </div>

                {/* 5. Total Overdue Invoice (Amount) */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        {renderTrend(stats.trends?.overdue)}
                    </div>
                    <div className="stat-content">
                        <h3>Total Overdue Invoice</h3>
                        <p className="stat-value">${stats.overdueAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* 6. Total Quotations (Count) */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                            <i className="fas fa-file-invoice"></i>
                        </div>
                        {/* Using invoice trend as proxy? No, misleading. */}
                    </div>
                    <div className="stat-content">
                        <h3>Total Quotations</h3>
                        <p className="stat-value">{stats.totalQuotations}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="billing-charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Revenue Analytics</h3>
                        <div className="chart-actions">
                            <button className="chart-filter active">Last 6 Months</button>
                        </div>
                    </div>
                    <div className="chart-container" style={{ height: '250px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: '20px' }}>
                        {stats.monthlyRevenue.length > 0 ? (
                            stats.monthlyRevenue.map((item: any, index: number) => (
                                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10%' }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#3b82f6',
                                            borderRadius: '4px 4px 0 0',
                                            height: `${(Number(item.revenue) / maxRevenue) * 200}px`,
                                            minHeight: '4px',
                                            transition: 'height 0.3s ease'
                                        }}
                                        title={`$${Number(item.revenue).toFixed(2)}`}
                                    />
                                    <span style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>{item.month}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                No revenue data available
                            </div>
                        )}
                    </div>
                </div>

                <div className="recent-activity-card">
                    <div className="chart-header">
                        <h3>Recent Transactions</h3>
                    </div>
                    <ul className="activity-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {Array.isArray(stats.recentTransactions) && stats.recentTransactions.length > 0 ? (
                            stats.recentTransactions.map((tx: any) => (
                                <li key={tx.id || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <i className="fas fa-file-invoice-dollar"></i>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#1f2937' }}>{tx.customer_name || 'Unknown Customer'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {tx.invoice_no || `ID: ${tx.id}`} • {tx.created_date ? new Date(tx.created_date).toLocaleDateString() : 'Date N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, color: '#1f2937' }}>${Number(tx.total_amount || 0).toFixed(2)}</div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: tx.status === 'Paid' ? '#16a34a' : tx.status === 'Overdue' ? '#dc2626' : '#d97706'
                                        }}>
                                            {tx.status || 'Pending'}
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                {stats.recentTransactions ? 'No recent transactions' : 'Loading transactions...'}
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h3 className="quick-actions-header">Quick Actions</h3>
                <div className="quick-actions-grid">
                    <div className="quick-action-card" onClick={() => setActiveSection('invoicing-new')}>
                        <div className="quick-action-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                            <i className="fas fa-plus"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Create Invoice</span>
                            <span className="quick-action-desc">New invoice for customer</span>
                        </div>
                    </div>



                    <div className="quick-action-card" onClick={() => setActiveSection('create-quotation')}>
                        <div className="quick-action-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Create Quotation</span>
                            <span className="quick-action-desc">Draft a new proposal</span>
                        </div>
                    </div>





                    <div className="quick-action-card" onClick={() => setActiveSection('reminders')}>
                        <div className="quick-action-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                            <i className="fas fa-envelope"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Send Reminders</span>
                            <span className="quick-action-desc">Email overdue clients</span>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
                confirmText={confirmModal.title.includes('Error') ? 'Close' : 'OK'}
            />
        </div>
    );
}
