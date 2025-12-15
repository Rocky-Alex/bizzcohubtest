import React, { useState, useEffect } from 'react';

export default function AccountingOverview() {
    const [stats, setStats] = useState({
        revenueYTD: 0,
        netProfit: 0, // Placeholder
        expenses: 0, // Placeholder
        pendingInvoices: 0, // Amount
        pendingCount: 0
    });

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                // Calculate Start of Year
                const now = new Date();
                const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
                const endOfNow = now.toISOString();

                const response = await fetch(`/api/admin/dashboard/stats?from=${startOfYear}&to=${endOfNow}`);
                if (response.ok) {
                    const data = await response.json();
                    setStats(prev => ({
                        ...prev,
                        revenueYTD: data.sales || 0, // "Sales" is total invoiced, proxy for revenue
                        pendingInvoices: data.outstandingAmt || 0,
                        // pendingCount is not directly in aggregated stats object as count, but we have invoice count. 
                        // Actually the API returns totals, not pending counts. We might need to adjust API or just show amount.
                        // For now, let's just use the amount.
                    }));
                }
            } catch (error) {
                console.error("Error fetching accounting stats", error);
            }
        };

        fetchFinancials();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '2rem' }}>Financial Overview</h2>

            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', padding: '1.5rem', borderRadius: '12px', color: 'white' }}>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Total Revenue (YTD)</p>
                    <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700 }}>{formatCurrency(stats.revenueYTD)}</h3>
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                        Based on YTD Invoices
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Net Profit</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', margin: 0 }}>{formatCurrency(stats.revenueYTD * 0.25)}</h3>
                    <p style={{ color: '#10b981', fontSize: '0.875rem', margin: '0.5rem 0 0' }}><i className="fas fa-arrow-up"></i> Est. 25% margin</p>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Expenses</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>AED 0</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>No expense data</p>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Pending Invoices</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>{formatCurrency(stats.pendingInvoices)}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>Total outstanding</p>
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
                        {[{ l: 'COGS', v: '0%' }, { l: 'Marketing', v: '0%' }, { l: 'Operations', v: '0%' }, { l: 'Payroll', v: '0%' }].map(i => (
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
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    Transaction history coming soon...
                </div>
            </div>
        </div>
    );
}
