import React from 'react';

export default function AccountingOverview() {
    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '2rem' }}>Financial Overview</h2>

            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', padding: '1.5rem', borderRadius: '12px', color: 'white' }}>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Total Revenue (YTD)</p>
                    <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700 }}>$1,420,500</h3>
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                        +15% vs last year
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Net Profit</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', margin: 0 }}>$348,200</h3>
                    <p style={{ color: '#10b981', fontSize: '0.875rem', margin: '0.5rem 0 0' }}><i className="fas fa-arrow-up"></i> 8.2% margin</p>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Expenses</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>$84,300</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>This month</p>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Pending Invoices</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>$12,450</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>5 invoices due</p>
                </div>
            </div>

            {/* Charts Section Placeholder */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: '300px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1.5rem' }}>Revenue vs Expenses</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', background: '#f9fafb', borderRadius: '8px', border: '2px dashed #e5e7eb', color: '#9ca3af' }}>
                        Chart: Monthly Financial Performance
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1.5rem' }}>Expense Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[{ l: 'COGS', v: '45%' }, { l: 'Marketing', v: '20%' }, { l: 'Operations', v: '15%' }, { l: 'Payroll', v: '20%' }].map(i => (
                            <div key={i.l}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                    <span>{i.l}</span>
                                    <span>{i.v}</span>
                                </div>
                                <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: i.v, background: '#6366f1', borderRadius: '3px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '1.5rem' }}>Recent Transactions</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#6b7280' }}>Date</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#6b7280' }}>Description</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#6b7280' }}>Category</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#6b7280', textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map(i => (
                            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '1rem' }}>Dec {10 + i}, 2024</td>
                                <td style={{ padding: '1rem', fontWeight: 500, color: '#111827' }}>Invoice #INV-2024-{100 + i} Payment</td>
                                <td style={{ padding: '1rem', color: '#6b7280' }}>Sales</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>+$1,250.00</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
