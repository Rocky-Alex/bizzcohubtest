"use client";

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'rbac'
    
    // Chart of accounts state
    const [accounts, setAccounts] = useState<any[]>([]);
    const [newAcc, setNewAcc] = useState({ name: '', type: 'expense', category: 'Indirect Expense' });
    
    // RBAC state
    const [authUsers, setAuthUsers] = useState<any[]>([]);
    const [newUserForm, setNewUserForm] = useState({ username: '', user_id: '' });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'chart') {
                const res = await fetch('/api/bch/accounting/settings?action=chart_of_accounts');
                const result = await res.json();
                if (result.success) setAccounts(result.data);
            } else {
                const res = await fetch('/api/bch/accounting/settings?action=users');
                const result = await res.json();
                if (result.success) setAuthUsers(result.data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        if (!newAcc.name || !newAcc.type || !newAcc.category) return;

        try {
            const res = await fetch('/api/bch/accounting/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_account', ...newAcc })
            });
            const result = await res.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'Account added to Chart strictly.' });
                setNewAcc({ name: '', type: 'expense', category: 'Indirect Expense' });
                fetchData();
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to add account' });
            }
        } catch(e) {
            setMessage({ type: 'error', text: 'Network Error' });
        }
    };

    const handleGrantAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        if (!newUserForm.username || !newUserForm.user_id) return;

        try {
            const res = await fetch('/api/bch/accounting/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'grant_access', ...newUserForm })
            });
            const result = await res.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'Accountant access granted.' });
                setNewUserForm({ username: '', user_id: '' });
                fetchData();
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to grant access' });
            }
        } catch(e) {
            setMessage({ type: 'error', text: 'Network Error' });
        }
    };

    const handleRevoke = async (userId: number) => {
        try {
            const res = await fetch('/api/bch/accounting/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'revoke_access', user_id: userId })
            });
            const result = await res.json();
            if (result.success) {
                fetchData();
            }
        } catch(e) {
            console.error(e);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>System Settings</h1>
                <p style={styles.subtitle}>Configure Chart of Accounts and Administrative Access Rules.</p>
            </div>

            <div style={styles.tabs}>
                <button 
                    style={activeTab === 'chart' ? styles.activeTabBtn : styles.tabBtn} 
                    onClick={() => setActiveTab('chart')}
                >
                    <i className="fas fa-sitemap" style={{marginRight:'8px'}}></i> Chart of Accounts
                </button>
                <button 
                    style={activeTab === 'rbac' ? styles.activeTabBtn : styles.tabBtn} 
                    onClick={() => setActiveTab('rbac')}
                >
                    <i className="fas fa-user-shield" style={{marginRight:'8px'}}></i> Accounting Roles
                </button>
            </div>

            {message.text && (
                <div style={message.type === 'error' ? styles.errorAlert : styles.successAlert}>
                    {message.text}
                </div>
            )}

            <div style={styles.grid}>
                {/* --- CHART OF ACCOUNTS --- */}
                {activeTab === 'chart' && (
                    <>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h2>Register New Ledgers</h2>
                            </div>
                            <form onSubmit={handleAddAccount} style={{padding: '1.5rem'}}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Account Name *</label>
                                    <input 
                                        style={styles.input} 
                                        type="text" 
                                        placeholder="e.g. Server Hosting Fees"
                                        value={newAcc.name}
                                        onChange={(e) => setNewAcc({...newAcc, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                                    <div style={{...styles.formGroup, flex: 1}}>
                                        <label style={styles.label}>Account Type *</label>
                                        <select 
                                            style={styles.input}
                                            value={newAcc.type}
                                            onChange={(e) => setNewAcc({...newAcc, type: e.target.value})}
                                        >
                                            <option value="asset">Asset</option>
                                            <option value="liability">Liability</option>
                                            <option value="equity">Equity</option>
                                            <option value="income">Income</option>
                                            <option value="expense">Expense</option>
                                        </select>
                                    </div>
                                    <div style={{...styles.formGroup, flex: 1}}>
                                        <label style={styles.label}>Category</label>
                                        <input 
                                            style={styles.input}
                                            type="text" 
                                            value={newAcc.category}
                                            onChange={(e) => setNewAcc({...newAcc, category: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" style={styles.primaryBtn} disabled={loading}>
                                    <i className="fas fa-plus"></i> Add Account Head
                                </button>
                            </form>
                        </div>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h2>Active Chart of Accounts</h2>
                            </div>
                            <div style={{maxHeight: '500px', overflowY: 'auto'}}>
                                <table style={styles.table}>
                                    <thead style={{position: 'sticky', top: 0, background: '#f9fafb'}}>
                                        <tr>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Type</th>
                                            <th style={styles.th}>Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map(acc => (
                                            <tr key={acc.account_id} style={styles.tr}>
                                                <td style={styles.td}><strong>{acc.account_name}</strong></td>
                                                <td style={styles.td}>
                                                    <span style={styles.badge(acc.account_type)}>
                                                        {acc.account_type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>{acc.category}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- RBAC SETTINGS --- */}
                {activeTab === 'rbac' && (
                    <>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h2>Grant Accountant Access</h2>
                            </div>
                            <form onSubmit={handleGrantAccess} style={{padding: '1.5rem'}}>
                                <p style={{fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem'}}>
                                    Provide an existing User ID to grant them explicit accountant permissions over the Cash Book.
                                </p>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Employee / User ID *</label>
                                    <input 
                                        style={styles.input} 
                                        type="number" 
                                        placeholder="Internal ID"
                                        value={newUserForm.user_id}
                                        onChange={(e) => setNewUserForm({...newUserForm, user_id: e.target.value})}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Username *</label>
                                    <input 
                                        style={styles.input} 
                                        type="text" 
                                        placeholder="Full Name / Display Name"
                                        value={newUserForm.username}
                                        onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                                        required
                                    />
                                </div>
                                <button type="submit" style={styles.primaryBtn} disabled={loading}>
                                    <i className="fas fa-check"></i> Grant Explicit Access
                                </button>
                            </form>
                        </div>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h2>Authorized Accountants Directory</h2>
                            </div>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>User ID</th>
                                        <th style={styles.th}>Username</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {authUsers.map(user => (
                                        <tr key={user.id} style={styles.tr}>
                                            <td style={styles.td}>{user.user_id}</td>
                                            <td style={styles.td}><strong>{user.username}</strong></td>
                                            <td style={styles.td}>
                                                <span style={user.has_access ? styles.badgeSuccess : styles.badgeDanger}>
                                                    {user.has_access ? 'ACTIVE' : 'REVOKED'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {user.has_access && (
                                                    <button 
                                                        style={{...styles.primaryBtn, background: '#fee2e2', color: '#991b1b', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}
                                                        onClick={() => handleRevoke(user.user_id)}
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {authUsers.length === 0 && (
                                        <tr><td colSpan={4} style={{...styles.td, textAlign: 'center'}}>No explicit rules defined. (All Admin default)</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
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
    header: { marginBottom: '2rem' },
    title: { fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#111827' },
    subtitle: { fontSize: '0.95rem', color: '#6b7280', margin: '0.25rem 0 0 0' },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' },
    tabBtn: { background: 'transparent', border: 'none', padding: '0.75rem 1.5rem', fontWeight: '600', color: '#6b7280', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' },
    activeTabBtn: { background: '#e0e7ff', border: 'none', padding: '0.75rem 1.5rem', fontWeight: '600', color: '#4338ca', cursor: 'pointer', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    grid: { display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(500px, 2fr)', gap: '2rem' },
    card: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6', overflow: 'hidden' },
    cardHeader: { padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' },
    formGroup: { marginBottom: '1.5rem', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', width: '100%', boxSizing: 'border-box', outline: 'none' },
    primaryBtn: { background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s' },
    errorAlert: { background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', marginBottom: '1.5rem', fontWeight: '500' },
    successAlert: { background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', marginBottom: '1.5rem', fontWeight: '500' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.9rem' },
    tr: { background: '#fff' },
    badge: (type: string) => ({
        background: type === 'expense' ? '#fee2e2' : type === 'income' ? '#d1fae5' : type === 'asset' ? '#e0e7ff' : '#f3f4f6',
        color: type === 'expense' ? '#991b1b' : type === 'income' ? '#065f46' : type === 'asset' ? '#3730a3' : '#4b5563',
        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600'
    }),
    badgeSuccess: { background: '#d1fae5', color: '#065f46', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
    badgeDanger: { background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }
};
