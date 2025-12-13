import React from 'react';
import './InvoicingDashboard.css';

interface InvoicingDashboardProps {
    setActiveSection: (section: string) => void;
}

export default function InvoicingDashboard({ setActiveSection }: InvoicingDashboardProps) {
    const [stats, setStats] = React.useState({
        totalInvoices: 0,
        totalReceived: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        trends: {
            invoices: 0,
            received: 0,
            pending: 0,
            overdue: 0
        }
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/invoices/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching invoice stats:', error);
            }
        };
        fetchStats();
    }, []);

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

    return (
        <div className="billing-dashboard-container">
            {/* Header / Title could go here if not handled by parent */}

            {/* Stats Overview */}
            <div className="billing-stats-grid">
                {/* Total Received */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <i className="fas fa-wallet"></i>
                        </div>
                        {renderTrend(stats.trends?.received)}
                    </div>
                    <div className="stat-content">
                        <h3>Total Received</h3>
                        <p className="stat-value">${stats.totalReceived.toFixed(2)}</p>
                    </div>
                </div>

                {/* Pending Amount */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
                            <i className="fas fa-hourglass-start"></i>
                        </div>
                        {renderTrend(stats.trends?.pending)}
                    </div>
                    <div className="stat-content">
                        <h3>Pending Amount</h3>
                        <p className="stat-value">${stats.pendingAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* Overdue */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        {renderTrend(stats.trends?.overdue)}
                    </div>
                    <div className="stat-content">
                        <h3>Overdue Details</h3>
                        <p className="stat-value">${stats.overdueAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* Total Invoices */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
                            <i className="fas fa-file-invoice"></i>
                        </div>
                        {renderTrend(stats.trends?.invoices)}
                    </div>
                    <div className="stat-content">
                        <h3>Total Invoices</h3>
                        <p className="stat-value">{stats.totalInvoices}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="billing-charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Revenue Analytics</h3>
                        <div className="chart-actions">
                            <button className="chart-filter">Monthly</button>
                            <button className="chart-filter">Yearly</button>
                        </div>
                    </div>
                    <div className="chart-placeholder-box">
                        <i className="fas fa-chart-area" style={{ marginRight: '10px', fontSize: '24px' }}></i>
                        Interactive Revenue Chart Area
                    </div>
                </div>

                <div className="recent-activity-card">
                    <div className="chart-header">
                        <h3>Recent Transactions</h3>
                    </div>
                    <ul className="activity-list">
                        {/* No recent activity */}
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

                    <div className="quick-action-card" onClick={() => setActiveSection('invoicing-all')}>
                        <div className="quick-action-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                            <i className="fas fa-file-signature"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Edit Invoice</span>
                            <span className="quick-action-desc">Modify existing invoices</span>
                        </div>
                    </div>

                    <div className="quick-action-card" onClick={() => setActiveSection('quotations-new')}>
                        <div className="quick-action-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Create Quotation</span>
                            <span className="quick-action-desc">Draft a new proposal</span>
                        </div>
                    </div>

                    <div className="quick-action-card" onClick={() => setActiveSection('quotations-all')}>
                        <div className="quick-action-icon" style={{ background: '#ffedd5', color: '#c2410c' }}>
                            <i className="fas fa-pen-fancy"></i>
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Edit Quotation</span>
                            <span className="quick-action-desc">Modify existing quotes</span>
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
        </div>
    );
}
