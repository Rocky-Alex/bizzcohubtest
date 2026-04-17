"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinancialStatementsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('trial_balance'); // 'trial_balance', 'pnl', 'ledger'
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [trialBalanceData, setTrialBalanceData] = useState<any[]>([]);
    const [pnlData, setPnlData] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [ledgerData, setLedgerData] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'trial_balance') fetchTrialBalance();
        if (activeTab === 'pnl') fetchPnl();
        if (activeTab === 'ledger' && accounts.length === 0) fetchAccountsReference();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'ledger' && selectedAccount) {
            fetchLedger(selectedAccount);
        }
    }, [selectedAccount, activeTab]);

    const fetchTrialBalance = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bch/accounting/statements?report=trial_balance');
            const result = await res.json();
            if (result.success) setTrialBalanceData(result.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchPnl = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bch/accounting/statements?report=pnl');
            const result = await res.json();
            if (result.success) setPnlData(result.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchAccountsReference = async () => {
        try {
            const res = await fetch('/api/bch/accounting/reference-data?type=accounts');
            const result = await res.json();
            if (result.success) setAccounts(result.data);
        } catch (err) { console.error(err); }
    };

    const fetchLedger = async (accountId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bch/accounting/statements?report=ledger&account_id=${accountId}`);
            const result = await res.json();
            if (result.success) setLedgerData(result.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount);
    };

    const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate Trial Balance Totals
    let tbTotalDebit = 0;
    let tbTotalCredit = 0;
    
    // Process TB Net Balances
    const processedTb = trialBalanceData.map(row => {
        const net = parseFloat(row.total_debit) - parseFloat(row.total_credit);
        const isDebitNormal = ['asset', 'expense'].includes(row.account_type);
        
        let displayDebit = 0;
        let displayCredit = 0;
        
        if (isDebitNormal) {
            displayDebit = net;
        } else {
            displayCredit = -net;
        }

        tbTotalDebit += Math.max(displayDebit, 0);
        tbTotalCredit += Math.max(displayCredit, 0);

        return { ...row, net_debit: Math.max(displayDebit, 0), net_credit: Math.max(displayCredit, 0) };
    });
    
    const isTbBalanced = (tbTotalDebit - tbTotalCredit) > -0.01 && (tbTotalDebit - tbTotalCredit) < 0.01;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Financial Statements</h1>
                    <p style={styles.subtitle}>Automated Reporting from Cash Book (Single Source of Truth)</p>
                </div>
            </div>

            <div style={styles.tabs}>
                <button 
                    style={activeTab === 'trial_balance' ? styles.activeTabBtn : styles.tabBtn} 
                    onClick={() => setActiveTab('trial_balance')}
                >
                    <i className="fas fa-balance-scale" style={{marginRight:'8px'}}></i> Trial Balance
                </button>
                <button 
                    style={activeTab === 'pnl' ? styles.activeTabBtn : styles.tabBtn} 
                    onClick={() => setActiveTab('pnl')}
                >
                    <i className="fas fa-chart-line" style={{marginRight:'8px'}}></i> Profit & Loss
                </button>
                <button 
                    style={activeTab === 'ledger' ? styles.activeTabBtn : styles.tabBtn} 
                    onClick={() => setActiveTab('ledger')}
                >
                    <i className="fas fa-book" style={{marginRight:'8px'}}></i> Account Ledger
                </button>
            </div>

            <div style={styles.contentArea}>
                {loading && <div style={{padding: '2rem', textAlign: 'center'}}>Loading financial data...</div>}
                
                {/* --- TRIAL BALANCE VIEW --- */}
                {!loading && activeTab === 'trial_balance' && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2>Trial Balance</h2>
                            {!isTbBalanced && tbTotalDebit > 0 && (
                                <div style={styles.dangerAlert}>
                                    <i className="fas fa-exclamation-triangle"></i> ALERT: Trial Balance Mismatch
                                </div>
                            )}
                            {isTbBalanced && tbTotalDebit > 0 && (
                                <div style={styles.successAlert}>
                                    <i className="fas fa-check-circle"></i> Balanced Successfully
                                </div>
                            )}
                            <button 
                                style={styles.exportBtn}
                                onClick={() => {
                                    const rows = processedTb.map(r => [r.account_name, r.category, r.net_debit || 0, r.net_credit || 0]);
                                    rows.push(['TOTALS', '', tbTotalDebit, tbTotalCredit]);
                                    exportToCSV('Trial_Balance', ['Account Head', 'Type', 'Debit Balance', 'Credit Balance'], rows);
                                }}
                            >
                                <i className="fas fa-file-csv"></i> Export CSV
                            </button>
                        </div>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Account Head</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={{...styles.th, textAlign: 'right'}}>Debit Balance</th>
                                    <th style={{...styles.th, textAlign: 'right'}}>Credit Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedTb.map((row, i) => (
                                    <tr key={i} style={styles.tr}>
                                        <td style={styles.td}>{row.account_name}</td>
                                        <td style={styles.td}>{row.category}</td>
                                        <td style={{...styles.td, textAlign: 'right', fontWeight: row.net_debit > 0 ? '600' : '400'}}>
                                            {row.net_debit > 0 ? formatCurrency(row.net_debit) : '-'}
                                        </td>
                                        <td style={{...styles.td, textAlign: 'right', fontWeight: row.net_credit > 0 ? '600' : '400'}}>
                                            {row.net_credit > 0 ? formatCurrency(row.net_credit) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{backgroundColor: '#f3f4f6', fontWeight: 'bold'}}>
                                    <td style={{...styles.td, textAlign: 'right'}} colSpan={2}>TOTALS:</td>
                                    <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(tbTotalDebit)}</td>
                                    <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(tbTotalCredit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* --- PNL VIEW --- */}
                {!loading && activeTab === 'pnl' && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2>Profit & Loss Account</h2>
                            <button 
                                style={styles.exportBtn}
                                onClick={() => {
                                    const rows = pnlData.map(r => {
                                        const val = r.account_type === 'income' ? parseFloat(r.total_credit) - parseFloat(r.total_debit) : parseFloat(r.total_debit) - parseFloat(r.total_credit);
                                        return [`${r.account_name} (${r.category})`, val];
                                    });
                                    exportToCSV('Profit_and_Loss', ['Particulars', 'Total (AED)'], rows);
                                }}
                            >
                                <i className="fas fa-file-csv"></i> Export CSV
                            </button>
                        </div>
                        <div style={{padding: '1.5rem'}}>
                            {/* PNL Implementation would map incomes vs expenses, omitted complex math for brevity but following raw structure */}
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Particulars</th>
                                        <th style={{...styles.th, textAlign: 'right'}}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pnlData.map((row, i) => {
                                        const val = row.account_type === 'income' ? parseFloat(row.total_credit) - parseFloat(row.total_debit) : parseFloat(row.total_debit) - parseFloat(row.total_credit);
                                        return (
                                            <tr key={i} style={styles.tr}>
                                                <td style={styles.td}>{row.account_name} ({row.category})</td>
                                                <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(val)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- LEDGER VIEW --- */}
                {!loading && activeTab === 'ledger' && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2>Account Ledger</h2>
                            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                                <select 
                                    value={selectedAccount} 
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="">-- Choose Account --</option>
                                    {accounts.map(a => (
                                        <option key={a.account_id} value={a.account_id}>{a.account_name}</option>
                                    ))}
                                </select>
                                {selectedAccount && ledgerData.length > 0 && (
                                    <button 
                                        style={styles.exportBtn}
                                        onClick={() => {
                                            const accName = accounts.find(a => a.account_id.toString() === selectedAccount)?.account_name || 'Account';
                                            const rows = ledgerData.map(tx => [
                                                new Date(tx.date).toLocaleDateString(),
                                                tx.voucher_no || '-',
                                                tx.description,
                                                tx.debit,
                                                tx.credit
                                            ]);
                                            exportToCSV(`${accName}_Ledger`, ['Date', 'Voucher', 'Description', 'Debit', 'Credit'], rows);
                                        }}
                                    >
                                        <i className="fas fa-file-csv"></i> Export
                                    </button>
                                )}
                            </div>
                        </div>
                        {selectedAccount && ledgerData.length > 0 && (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Date</th>
                                        <th style={styles.th}>Voucher</th>
                                        <th style={styles.th}>Description</th>
                                        <th style={{...styles.th, textAlign: 'right'}}>Debit</th>
                                        <th style={{...styles.th, textAlign: 'right'}}>Credit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledgerData.map((tx, idx) => (
                                        <tr key={idx} style={styles.tr}>
                                            <td style={styles.td}>{new Date(tx.date).toLocaleDateString()}</td>
                                            <td style={styles.td}>{tx.voucher_no || '-'}</td>
                                            <td style={styles.td}>{tx.description}</td>
                                            <td style={{...styles.td, textAlign: 'right', color: '#10b981'}}>{formatCurrency(tx.debit)}</td>
                                            <td style={{...styles.td, textAlign: 'right', color: '#ef4444'}}>{formatCurrency(tx.credit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {selectedAccount && ledgerData.length === 0 && (
                            <div style={{padding: '2rem', textAlign: 'center', color: '#6b7280'}}>No transactions found for this account.</div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

const styles: Record<string, any> = {
    container: {
        padding: '2rem',
        fontFamily: "'Inter', sans-serif",
        color: '#1f2937',
        animation: 'fadeIn 0.5s ease-in-out',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        marginBottom: '2rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        margin: 0,
        color: '#111827',
    },
    subtitle: {
        fontSize: '0.95rem',
        color: '#6b7280',
        margin: '0.25rem 0 0 0'
    },
    tabs: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0.5rem'
    },
    tabBtn: {
        background: 'transparent',
        border: 'none',
        padding: '0.75rem 1.5rem',
        fontWeight: '600',
        color: '#6b7280',
        cursor: 'pointer',
        borderRadius: '8px',
        transition: 'all 0.2s',
    },
    activeTabBtn: {
        background: '#e0e7ff',
        border: 'none',
        padding: '0.75rem 1.5rem',
        fontWeight: '600',
        color: '#4338ca',
        cursor: 'pointer',
        borderRadius: '8px',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    contentArea: {
        minHeight: '400px'
    },
    card: {
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
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
    dangerAlert: {
        background: '#fee2e2',
        color: '#991b1b',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontWeight: '600',
        fontSize: '0.85rem'
    },
    successAlert: {
        background: '#d1fae5',
        color: '#065f46',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontWeight: '600',
        fontSize: '0.85rem'
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
        verticalAlign: 'middle',
        fontSize: '0.95rem'
    },
    tr: {
        background: '#fff',
        transition: 'background-color 0.2s'
    },
    select: {
        padding: '0.6rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        minWidth: '250px',
        fontFamily: 'inherit'
    },
    exportBtn: {
        background: '#fff',
        border: '1px solid #d1d5db',
        color: '#374151',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.85rem',
        transition: 'all 0.2s'
    }
};
