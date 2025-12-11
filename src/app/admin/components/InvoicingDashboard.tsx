import React from 'react';
import './InvoicingDashboard.css';

export default function InvoicingDashboard() {
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
                        <div className="stat-trend positive">
                            <i className="fas fa-trend-up"></i> 12.5%
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Received</h3>
                        <p className="stat-value">$124,500.00</p>
                    </div>
                </div>

                {/* Pending Amount */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
                            <i className="fas fa-hourglass-start"></i>
                        </div>
                        <div className="stat-trend neutral">
                            <i className="fas fa-minus"></i> 0.8%
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Pending Amount</h3>
                        <p className="stat-value">$32,050.00</p>
                    </div>
                </div>

                {/* Overdue */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div className="stat-trend negative">
                            <i className="fas fa-arrow-up"></i> 4.2%
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Overdue Details</h3>
                        <p className="stat-value">$4,200.00</p>
                    </div>
                </div>

                {/* Total Invoices */}
                <div className="billing-stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
                            <i className="fas fa-file-invoice"></i>
                        </div>
                        <div className="stat-trend positive">
                            <i className="fas fa-plus"></i> 24
                        </div>
                    </div>
                    <div className="stat-content">
                        <h3>Total Invoices</h3>
                        <p className="stat-value">1,482</p>
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
                        <li className="activity-item">
                            <div className="activity-icon invoice">
                                <i className="fas fa-file-invoice-dollar"></i>
                            </div>
                            <div className="activity-content">
                                <p className="activity-title">Invoice <strong>#INV-2029</strong> Created</p>
                                <span className="activity-time">Just now</span>
                            </div>
                        </li>
                        <li className="activity-item">
                            <div className="activity-icon payment">
                                <i className="fas fa-check"></i>
                            </div>
                            <div className="activity-content">
                                <p className="activity-title">Payment from <strong>Acme Corp</strong></p>
                                <span className="activity-time">2 hours ago</span>
                            </div>
                        </li>
                        <li className="activity-item">
                            <div className="activity-icon alert">
                                <i className="fas fa-bell"></i>
                            </div>
                            <div className="activity-content">
                                <p className="activity-title">Overdue Alert: <strong>John Doe</strong></p>
                                <span className="activity-time">5 hours ago</span>
                            </div>
                        </li>
                        <li className="activity-item">
                            <div className="activity-icon payment">
                                <i className="fas fa-check"></i>
                            </div>
                            <div className="activity-content">
                                <p className="activity-title">Payment from <strong>Global Tech</strong></p>
                                <span className="activity-time">1 day ago</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>Quick Actions</h3>
            <div className="quick-actions-grid">
                <div className="action-card">
                    <div className="action-icon">
                        <i className="fas fa-plus"></i>
                    </div>
                    <div className="action-info">
                        <h4>Create Invoice</h4>
                        <p>New invoice for customer</p>
                    </div>
                </div>
                <div className="action-card">
                    <div className="action-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <i className="fas fa-file-export"></i>
                    </div>
                    <div className="action-info">
                        <h4>Export Report</h4>
                        <p>Download CSV/PDF</p>
                    </div>
                </div>
                <div className="action-card">
                    <div className="action-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                        <i className="fas fa-envelope-open-text"></i>
                    </div>
                    <div className="action-info">
                        <h4>Send Reminders</h4>
                        <p>Email overdue clients</p>
                    </div>
                </div>
                <div className="action-card">
                    <div className="action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <i className="fas fa-user-plus"></i>
                    </div>
                    <div className="action-info">
                        <h4>Add Customer</h4>
                        <p>Register new client</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
