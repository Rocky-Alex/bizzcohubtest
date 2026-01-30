
import React, { useState } from 'react';
import './AccountsDashboard.css';

interface AccountsDashboardProps {
    setActiveSection: (section: string) => void;
}

export default function AccountsDashboard({ setActiveSection }: AccountsDashboardProps) {
    const [period, setPeriod] = useState('This Fiscal Year');

    // Mock Data for Dashboard
    const metrics = [
        {
            title: 'Total Receivables',
            value: '$42,500.00',
            trend: '+12.5%',
            trendDirection: 'up',
            icon: 'fa-hand-holding-usd',
            color: '#3b82f6'
        },
        {
            title: 'Total Payables',
            value: '$15,200.00',
            trend: '-2.4%',
            trendDirection: 'down', // Down is good for payables usually, but let's stick to standard color conventions or context
            icon: 'fa-file-invoice-dollar',
            color: '#ef4444'
        },
        {
            title: 'Cash Flow',
            value: '$27,300.00',
            trend: '+8.1%',
            trendDirection: 'up',
            icon: 'fa-chart-line',
            color: '#10b981'
        }
    ];

    const watchlist = [
        { name: 'Business Checking', type: 'Bank', balance: '$28,450.00' },
        { name: 'Petty Cash', type: 'Cash', balance: '$450.00' },
        { name: 'Corporate Credit Card', type: 'Credit Card', balance: '-$1,200.00' },
        { name: 'Savings Account', type: 'Bank', balance: '$55,000.00' },
    ];

    const recentTransactions = [
        { id: 'TRX-1001', date: '2025-05-12', description: 'Payment from Client A', amount: '+$1,200.00', status: 'Cleared' },
        { id: 'TRX-1002', date: '2025-05-11', description: 'Office Supplies', amount: '-$150.00', status: 'Cleared' },
        { id: 'TRX-1003', date: '2025-05-10', description: 'Monthly Rent', amount: '-$2,000.00', status: 'Cleared' },
        { id: 'TRX-1004', date: '2025-05-09', description: 'Consulting Service', amount: '+$3,500.00', status: 'Pending' },
        { id: 'TRX-1005', date: '2025-05-08', description: 'Utility Bill', amount: '-$320.00', status: 'Cleared' },
    ];

    return (
        <div className="accounts-dashboard-container">
            {/* Header */}
            <div className="accounts-header">
                <h1>
                    <i className="fas fa-wallet" style={{ color: '#4f46e5' }}></i>
                    Accounts Overview
                </h1>
                <div className="accounts-header-actions">
                    <button className="btn-new-transaction" onClick={() => setActiveSection('accounts-new-transaction')}>
                        <i className="fas fa-plus"></i> New Transaction
                    </button>
                    {/* Could add a period selector here */}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="accounts-metrics-row">
                {metrics.map((metric, index) => (
                    <div className="metric-card" key={index}>
                        <div className="metric-card-header">
                            <span className="metric-title">{metric.title}</span>
                            <i className={`fas ${metric.icon} metric-icon`} style={{ backgroundColor: `${metric.color}20`, color: metric.color }}></i>
                        </div>
                        <div className="metric-value">{metric.value}</div>
                        <div className={`metric-trend ${metric.trendDirection}`}>
                            <i className={`fas fa-arrow-${metric.trendDirection === 'up' ? 'up' : 'down'}`}></i>
                            {metric.trend}
                            <span style={{ color: '#9ca3af', marginLeft: '5px', fontWeight: '400' }}>vs last period</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid: Charts & Watchlist */}
            <div className="accounts-main-grid">

                {/* Income vs Expense Chart (CSS Only Placeholder) */}
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">Income vs Expense</h3>
                        <select
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #e5e7eb',
                                fontSize: '0.85rem'
                            }}
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option>This Fiscal Year</option>
                            <option>Last 6 Months</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>

                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px' }}>
                        {/* Mock Bars */}
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                            const incomeHeight = Math.floor(Math.random() * 80) + 20;
                            const expenseHeight = Math.floor(Math.random() * 60) + 10;
                            return (
                                <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                        <div style={{ width: '12px', height: `${incomeHeight}%`, background: '#10b981', borderRadius: '4px 4px 0 0' }} title="Income"></div>
                                        <div style={{ width: '12px', height: `${expenseHeight}%`, background: '#ef4444', borderRadius: '4px 4px 0 0' }} title="Expense"></div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{month}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></div> Income</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></div> Expense</div>
                    </div>
                </div>

                {/* Account Watchlist */}
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">Account Watchlist</h3>
                    </div>
                    <div className="account-watchlist">
                        {watchlist.map((account, index) => (
                            <div className="watchlist-item" key={index}>
                                <div className="account-info">
                                    <span className="account-name">{account.name}</span>
                                    <span className="account-type">{account.type}</span>
                                </div>
                                <span className="account-balance" style={{ color: account.balance.startsWith('-') ? '#dc2626' : '#111827' }}>
                                    {account.balance}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button style={{
                        width: '100%',
                        marginTop: '1rem',
                        padding: '0.5rem',
                        border: '1px dashed #d1d5db',
                        background: 'transparent',
                        borderRadius: '6px',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                    }}>
                        + Add Account
                    </button>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions-section">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Recent Transactions</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Transaction ID</th>
                                <th>Status</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map((trx, index) => (
                                <tr key={index}>
                                    <td>{trx.date}</td>
                                    <td>{trx.description}</td>
                                    <td style={{ fontFamily: 'monospace', color: '#6b7280' }}>{trx.id}</td>
                                    <td>
                                        <span className={`status-badge ${trx.status.toLowerCase()}`}>
                                            {trx.status}
                                        </span>
                                    </td>
                                    <td style={{
                                        fontWeight: 600,
                                        color: trx.amount.startsWith('+') ? '#10b981' : '#111827'
                                    }}>
                                        {trx.amount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
