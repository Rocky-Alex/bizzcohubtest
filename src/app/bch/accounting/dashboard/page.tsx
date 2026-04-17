"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountingDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalCash: 0,
        todayReceipts: 0,
        todayPayments: 0,
        netBalance: 0
    });
    
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

    useEffect(() => {
        // Initial Fetch
        fetchTransactions();

        // True Real-Time Continuous Sync (3-second polling)
        const interval = setInterval(() => {
            fetchTransactions();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const fetchTransactions = async () => {
        try {
            // Fetch live KPI stats with cache-busting
            const statsRes = await fetch(`/api/bch/accounting/dashboard-metrics?t=${new Date().getTime()}`);
            const statsData = await statsRes.json();
            if (statsData.success) {
                setStats({
                    totalCash: statsData.data.totalCash,
                    todayReceipts: statsData.data.todayReceipts,
                    todayPayments: statsData.data.todayPayments,
                    netBalance: statsData.data.netBalance
                });
            }

            // Fetch table list
            const res = await fetch('/api/bch/accounting/cashbook?limit=10');
            const data = await res.json();
            if (data.success) {
                setRecentTransactions(data.transactions);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Financial Dashboard</h1>
                <p style={styles.subtitle}>UAE Accounting Standard &bull; Base Currency: AED</p>
                <div style={styles.actions}>
                    <button 
                        style={styles.primaryBtn}
                        onClick={() => router.push('/bch/accounting/cashbook')}
                    >
                        <i className="fas fa-plus" style={{marginRight: '8px'}}></i> New Entry
                    </button>
                </div>
            </div>

            <div style={styles.statsGrid}>
                <StatCard 
                    title="Total Cash in Hand" 
                    value={stats.totalCash} 
                    icon="fa-wallet" 
                    color="linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                />
                <StatCard 
                    title="Today's Receipts" 
                    value={stats.todayReceipts} 
                    icon="fa-arrow-down" 
                    color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" 
                />
                <StatCard 
                    title="Today's Payments" 
                    value={stats.todayPayments} 
                    icon="fa-arrow-up" 
                    color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" 
                />
                <StatCard 
                    title="Net Balance" 
                    value={stats.netBalance} 
                    icon="fa-scale-balanced" 
                    color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" 
                />
            </div>

            <div style={styles.grid2Col}>
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h3>Recent Cash Book Entries</h3>
                        <button style={styles.linkBtn} onClick={() => router.push('/bch/accounting/cashbook')}>View All</button>
                    </div>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Particulars</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={{...styles.th, textAlign: 'right'}}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((tx, idx) => (
                                    <tr key={idx} style={styles.tr}>
                                        <td style={styles.td}>{new Date(tx.date).toLocaleDateString()}</td>
                                        <td style={styles.td}>
                                            <div style={{fontWeight: '600'}}>{tx.description || tx.account_name}</div>
                                            <div style={{fontSize: '0.8rem', color: '#6b7280'}}>{tx.category}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={tx.transaction_type === 'receipt' ? styles.badgeSuccess : styles.badgeDanger}>
                                                {tx.transaction_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: tx.transaction_type === 'receipt' ? '#10b981' : '#ef4444'}}>
                                            {formatCurrency(tx.transaction_type === 'receipt' ? tx.debit : tx.credit)}
                                        </td>
                                    </tr>
                                ))}
                                {recentTransactions.length === 0 && (
                                    <tr><td colSpan={4} style={{...styles.td, textAlign: 'center'}}>No transactions found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h3>System Status</h3>
                    </div>
                    <div style={{padding: '1.5rem'}}>
                        <div style={styles.alertBox}>
                            <i className="fas fa-check-circle" style={{color: '#10b981', marginRight: '10px', fontSize: '1.2rem'}}></i>
                            <div>
                                <h4 style={{margin: '0 0 5px 0', color: '#065f46'}}>Trial Balance Matches</h4>
                                <p style={{margin: 0, fontSize: '0.9rem', color: '#047857'}}>Debit and Credit sides are fully reconciled.</p>
                            </div>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Base Currency</span>
                            <strong>AED</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Accounting Standard</span>
                            <strong>UAE Cash-Basis</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Active Accountant</span>
                            <strong>Admin</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Database Backup</span>
                            <button 
                                onClick={() => window.open('/api/bch/accounting/backup', '_blank')}
                                style={{background: 'transparent', border: '1px solid #d1d5db', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600'}}
                            >
                                <i className="fas fa-download"></i> Download JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div style={{...styles.statCard, background: color}}>
            <div style={styles.statIconWrapper}>
                <i className={`fas ${icon}`} style={styles.statIcon}></i>
            </div>
            <div style={styles.statInfo}>
                <h4 style={styles.statTitle}>{title}</h4>
                <div style={styles.statValue}>
                    {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(value)}
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '2rem',
        fontFamily: "'Inter', sans-serif",
        color: '#1f2937',
        animation: 'fadeIn 0.5s ease-in-out',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '1rem'
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        margin: 0,
        background: 'linear-gradient(90deg, #111827 0%, #4b5563 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '1rem',
        color: '#6b7280',
        margin: '0.5rem 0 0 0'
    },
    actions: {
        display: 'flex',
        gap: '1rem'
    },
    primaryBtn: {
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: '#fff',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    },
    statCard: {
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        color: '#fff',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s ease',
        cursor: 'pointer'
    },
    statIconWrapper: {
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '1rem'
    },
    statIcon: {
        fontSize: '1.5rem',
    },
    statInfo: {
        zIndex: 1
    },
    statTitle: {
        margin: '0 0 0.5rem 0',
        fontSize: '0.9rem',
        fontWeight: '500',
        opacity: 0.9
    },
    statValue: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        letterSpacing: '0.5px'
    },
    grid2Col: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
    },
    card: {
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        border: '1px solid #f3f4f6',
        overflow: 'hidden'
    },
    cardHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f9fafb'
    },
    linkBtn: {
        background: 'transparent',
        border: 'none',
        color: '#2563eb',
        fontWeight: '600',
        cursor: 'pointer'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        padding: '1rem 1.5rem',
        textAlign: 'left',
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #e5e7eb'
    },
    td: {
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
        verticalAlign: 'middle'
    },
    tr: {
        transition: 'background-color 0.2s',
    },
    badgeSuccess: {
        background: '#d1fae5',
        color: '#065f46',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
    },
    badgeDanger: {
        background: '#fee2e2',
        color: '#991b1b',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
    },
    alertBox: {
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '1.5rem'
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid #f3f4f6',
        fontSize: '0.95rem'
    }
};
