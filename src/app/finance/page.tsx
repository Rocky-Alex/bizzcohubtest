"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FinancePage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, profit: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', type: 'Expense' });

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            const res = await fetch('/api/accounting');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions);
                setSummary(data.summary);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/accounting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setNewExpense({ description: '', amount: '', type: 'Expense' });
                fetchLedger();
            } else {
                alert('Failed to add entry');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Finance & Accounting</h1>
                        <p style={{ color: '#94a3b8' }}>Monitor financial health, income, and expenses.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{ padding: '12px 24px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        - Add Expense
                    </button>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>Total Income</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>
                            ${Number(summary.income).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>Total Expenses</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                            ${Number(summary.expense).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>Net Profit</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: summary.profit >= 0 ? '#4ade80' : '#ef4444' }}>
                            ${Number(summary.profit).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ fontWeight: 'bold' }}>Recent Transactions</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#334155', textAlign: 'left' }}>
                                <th style={{ padding: '16px' }}>Date</th>
                                <th style={{ padding: '16px' }}>Description</th>
                                <th style={{ padding: '16px' }}>Type</th>
                                <th style={{ padding: '16px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>Loading ledger...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No transactions recorded.</td></tr>
                            ) : (
                                transactions.map(t => (
                                    <tr key={t.transactionId} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '16px' }}>{new Date(t.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px' }}>{t.description}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem',
                                                background: t.type === 'Income' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: t.type === 'Income' ? '#4ade80' : '#ef4444'
                                            }}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: t.type === 'Income' ? '#4ade80' : 'white' }}>
                                            {t.type === 'Expense' ? '-' : '+'}${Number(t.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Helper Modal for Manual Entry */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', width: '400px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Record Expense</h2>
                        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Description</label>
                                <input required value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Amount ($)</label>
                                <input type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Record Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
