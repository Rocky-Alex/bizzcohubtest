"use client";

import React, { useState, useEffect } from 'react';

export default function LotManagementPage() {
    const [lots, setLots] = useState<any[]>([]);
    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [lotDetails, setLotDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLots();
    }, []);

    const fetchLots = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bch/accounting/lots-report');
            const result = await res.json();
            if (result.success) setLots(result.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const fetchLotDetails = async (lotId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bch/accounting/lots-report?lot_id=${lotId}`);
            const result = await res.json();
            if (result.success) {
                setSelectedLot(result.data.lot);
                setLotDetails(result.data.expenses);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Lot Expense Tracking</h1>
                <p style={styles.subtitle}>Track overheads and per-unit costs for specific inventory lots.</p>
            </div>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2>Active Lots Overview</h2>
                    </div>
                    {loading && !selectedLot && <div style={{padding: '2rem'}}>Loading...</div>}
                    <div style={{overflowX: 'auto'}}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Lot Name</th>
                                    <th style={styles.th}>Units</th>
                                    <th style={{...styles.th, textAlign: 'right'}}>Total Expense</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots.map(lot => (
                                    <tr key={lot.lot_id} style={{
                                        ...styles.tr, 
                                        backgroundColor: selectedLot?.lot_id === lot.lot_id ? '#eff6ff' : '#fff'
                                    }}>
                                        <td style={styles.td}><strong>{lot.lot_name}</strong></td>
                                        <td style={styles.td}>{lot.total_units} pcs</td>
                                        <td style={{...styles.td, textAlign: 'right', color: '#ef4444', fontWeight: 'bold'}}>
                                            {formatCurrency(lot.total_expense)}
                                        </td>
                                        <td style={styles.td}>
                                            <button 
                                                style={styles.actionBtn}
                                                onClick={() => fetchLotDetails(lot.lot_id)}
                                            >
                                                View Breakdown <i className="fas fa-chevron-right" style={{marginLeft:'5px'}}></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {lots.length === 0 && !loading && (
                                    <tr><td colSpan={4} style={{...styles.td, textAlign:'center'}}>No lots found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={styles.card}>
                    {selectedLot ? (
                        <>
                            <div style={styles.cardHeader}>
                                <h2>{selectedLot.lot_name} Breakdown</h2>
                            </div>
                            <div style={{padding: '1.5rem'}}>
                                <div style={styles.summaryBox}>
                                    <div style={styles.summaryItem}>
                                        <span style={styles.summaryLabel}>Total Expense</span>
                                        <span style={styles.summaryValueRed}>
                                            {formatCurrency(lotDetails.reduce((sum, item) => sum + parseFloat(item.expense_amount), 0))}
                                        </span>
                                    </div>
                                    <div style={styles.summaryItem}>
                                        <span style={styles.summaryLabel}>Total Units</span>
                                        <span style={styles.summaryValue}>{selectedLot.total_units} pcs</span>
                                    </div>
                                    <div style={styles.summaryItem}>
                                        <span style={styles.summaryLabel}>Cost Per Unit</span>
                                        <span style={styles.summaryValueBlue}>
                                            {selectedLot.total_units > 0 
                                                ? formatCurrency(lotDetails.reduce((sum, item) => sum + parseFloat(item.expense_amount), 0) / selectedLot.total_units) 
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                
                                <h3 style={{fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '1rem'}}>Expense History</h3>
                                <div style={{border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden'}}>
                                    <table style={styles.table}>
                                        <thead style={{background: '#f9fafb'}}>
                                            <tr>
                                                <th style={styles.th}>Date</th>
                                                <th style={styles.th}>Head</th>
                                                <th style={{...styles.th, textAlign: 'right'}}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lotDetails.map((exp, idx) => (
                                                <tr key={idx} style={styles.tr}>
                                                    <td style={styles.td}>{new Date(exp.date).toLocaleDateString()}</td>
                                                    <td style={styles.td}>{exp.account_name}</td>
                                                    <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(exp.expense_amount)}</td>
                                                </tr>
                                            ))}
                                            {lotDetails.length === 0 && (
                                                <tr><td colSpan={3} style={{...styles.td, textAlign:'center'}}>No direct expenses linked.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <i className="fas fa-chart-pie" style={{fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem'}}></i>
                            <h3>Lot Expense Details</h3>
                            <p>Select a lot from the list to view its cost breakdown and calculate per-unit costs.</p>
                        </div>
                    )}
                </div>
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
    grid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 1fr) minmax(400px, 1fr)',
        gap: '2rem'
    },
    card: {
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f3f4f6',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    cardHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #f3f4f6',
        background: '#f9fafb'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        padding: '1rem',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #e5e7eb'
    },
    td: {
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        verticalAlign: 'middle',
        fontSize: '0.9rem'
    },
    tr: {
        transition: 'background-color 0.2s'
    },
    actionBtn: {
        background: 'transparent',
        border: 'none',
        color: '#2563eb',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '0.85rem'
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        color: '#6b7280',
        height: '100%'
    },
    summaryBox: {
        display: 'flex',
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '1.5rem',
        gap: '2rem',
        justifyContent: 'space-between',
        border: '1px solid #e2e8f0'
    },
    summaryItem: {
        display: 'flex',
        flexDirection: 'column'
    },
    summaryLabel: {
        fontSize: '0.85rem',
        color: '#64748b',
        fontWeight: '600',
        marginBottom: '0.25rem',
        textTransform: 'uppercase'
    },
    summaryValue: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#0f172a'
    },
    summaryValueRed: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#ef4444'
    },
    summaryValueBlue: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#3b82f6'
    }
};
