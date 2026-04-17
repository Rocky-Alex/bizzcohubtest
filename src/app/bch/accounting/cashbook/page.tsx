"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CashBookPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [lots, setLots] = useState<any[]>([]);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        voucher_no: '',
        transaction_type: 'receipt', // or 'payment'
        account_id: '',
        amount: '',
        lot_id: '',
        description: ''
    });

    const [smartSentence, setSmartSentence] = useState('');
    const [autoNewAccount, setAutoNewAccount] = useState('');

    useEffect(() => {
        fetchReferences();
    }, []);

    const fetchReferences = async () => {
        try {
            const accRes = await fetch('/api/bch/accounting/reference-data?type=accounts');
            const accData = await accRes.json();
            if (accData.success) setAccounts(accData.data);

            const lotRes = await fetch('/api/bch/accounting/reference-data?type=lots');
            const lotData = await lotRes.json();
            if (lotData.success) setLots(lotData.data);
        } catch (error) {
            console.error("Failed to load reference data", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSmartEntry = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sentence = e.target.value;
        setSmartSentence(sentence);

        if (sentence.length < 5) return;

        // 1. Extract Amount
        const amountMatch = sentence.match(/\d+(\.\d+)?/);
        const amount = amountMatch ? amountMatch[0] : formData.amount;

        // 2. Extract Type (Receipt vs Payment)
        const lowerSent = sentence.toLowerCase();
        let type = formData.transaction_type;
        if (lowerSent.includes('received') || lowerSent.includes('got') || lowerSent.includes('sold') || lowerSent.includes('income')) {
            type = 'receipt';
        } else if (lowerSent.includes('paid') || lowerSent.includes('spent') || lowerSent.includes('bought') || lowerSent.includes('expense')) {
            type = 'payment';
        }

        // 3. Extract Account Head (Fuzzy match)
        let foundAccountId = '';
        let matched = false;
        
        for (const acc of accounts) {
            const accNameLower = acc.account_name.toLowerCase();
            const keywords = accNameLower.split(' ').filter((w: string) => w.length > 2);
            if (lowerSent.includes(accNameLower) || keywords.some((k: string) => lowerSent.includes(k))) {
                foundAccountId = acc.account_id;
                if (acc.account_type === 'income') type = 'receipt';
                if (acc.account_type === 'expense') type = 'payment';
                matched = true;
                break;
            }
        }

        // 4. Auto-Calculate Missing Account Names
        let newAccName = '';
        if (!matched && sentence.length > 8) {
            const skipWords = ['paid', 'spent', 'bought', 'expense', 'received', 'got', 'sold', 'income', 'for', 'on', 'from', 'aed', 'dirhams', 'the', 'to', 'in'];
            let words = sentence.split(/\s+/).filter(w => {
                const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
                return !skipWords.includes(lower) && !lower.match(/^\d+(\.\d+)?$/) && lower.length > 1;
            });
            if (words.length > 0) {
                newAccName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).replace(/[^a-zA-Z]/g, '')).join(' ');
            }
        }
        setAutoNewAccount(newAccName);

        // 5. Update Form Data seamlessly
        setFormData(prev => ({
            ...prev,
            amount: amount,
            transaction_type: type,
            account_id: foundAccountId,
            description: sentence
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        let finalAccountId = formData.account_id;

        // Auto-Create Missing Ledger First
        if (!finalAccountId && autoNewAccount) {
            setIsLoading(true);
            try {
                const accType = formData.transaction_type === 'receipt' ? 'income' : 'expense';
                const accCat = formData.transaction_type === 'receipt' ? 'Auto-Income' : 'Auto-Expense';
                
                const createRes = await fetch('/api/bch/accounting/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add_account', name: autoNewAccount, type: accType, category: accCat })
                });
                const createData = await createRes.json();
                
                if (createData.success && createData.account_id) {
                    finalAccountId = createData.account_id;
                    await fetchReferences(); // Silent reload dropdowns
                } else {
                    setMessage({ type: 'error', text: 'Error auto-creating account: ' + (createData.error || '')});
                    setIsLoading(false);
                    return;
                }
            } catch (err) {
                setMessage({ type: 'error', text: 'Network error auto-creating account.'});
                setIsLoading(false);
                return;
            }
        }

        // Basic Validation
        if (!formData.date || !finalAccountId || !formData.amount || parseFloat(formData.amount) <= 0) {
            setMessage({ type: 'error', text: 'Please fill in all mandatory fields.' });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/bch/accounting/cashbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    account_id: finalAccountId,
                    created_by: 'Admin' // Should be fetched from session in reality
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: `Transaction #${data.transaction_id} recorded successfully.` });
                // Reset form
                setFormData({
                    ...formData,
                    voucher_no: '',
                    amount: '',
                    description: '',
                    lot_id: ''
                });
                setSmartSentence('');
                setAutoNewAccount('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save transaction.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Cash Book</h1>
                    <p style={styles.subtitle}>Primary Single-Source Entry Node</p>
                </div>
                <button style={styles.secondaryBtn} onClick={() => router.push('/bch/accounting/dashboard')}>
                    <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i> Back to Dashboard
                </button>
            </div>

            <div style={styles.formCard}>
                <div style={styles.cardIndicator(formData.transaction_type)}></div>
                <h2 style={{marginTop: 0, marginBottom: '1.5rem', color: '#1f2937'}}>New Transaction</h2>
                
                {message.text && (
                    <div style={message.type === 'error' ? styles.errorAlert : styles.successAlert}>
                        <i className={message.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'} style={{marginRight: '8px'}}></i>
                        {message.text}
                    </div>
                )}

                <div style={styles.smartBox}>
                    <label style={{...styles.label, color: '#4f46e5'}}>
                        <i className="fas fa-magic" style={{marginRight: '6px'}}></i> Smart Sentence Entry
                    </label>
                    <p style={{fontSize: '0.8rem', color: '#6b7280', margin: '0 0 10px 0'}}>
                        Type what happened naturally. e.g. "Paid 500 for Office Expense" or "Received 1000 from Sales". We will auto-fill the form for you!
                    </p>
                    <input 
                        type="text" 
                        value={smartSentence}
                        onChange={handleSmartEntry}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmit(e as any);
                            }
                        }}
                        style={{...styles.input, borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(129, 140, 248, 0.2)'}}
                        placeholder="Start typing your sentence here... Press Enter to Auto-Save!"
                    />
                    {!formData.account_id && autoNewAccount && (
                        <div style={{marginTop: '10px', padding: '8px', background: '#e0e7ff', borderRadius: '6px', fontSize: '0.85rem', color: '#3730a3', display: 'flex', alignItems: 'center'}}>
                            <i className="fas fa-plus-circle" style={{marginRight: '6px'}}></i>
                            <strong>Heads Up:</strong> We couldn't find this account. Pressing enter will magically create a new ledger called "&nbsp;<b>{autoNewAccount}</b>&nbsp;".
                        </div>
                    )}
                </div>

                <hr style={{border: 0, borderBottom: '1px solid #e5e7eb', margin: '2rem 0'}} />

                <form onSubmit={handleSubmit}>
                    <div style={styles.typeSelector}>
                        <div 
                            style={formData.transaction_type === 'receipt' ? styles.typeBtnActiveIn : styles.typeBtn}
                            onClick={() => setFormData({...formData, transaction_type: 'receipt'})}
                        >
                            <i className="fas fa-arrow-down" style={{marginRight: '8px'}}></i> RECEIPT (Cash In)
                        </div>
                        <div 
                            style={formData.transaction_type === 'payment' ? styles.typeBtnActiveOut : styles.typeBtn}
                            onClick={() => setFormData({...formData, transaction_type: 'payment'})}
                        >
                            <i className="fas fa-arrow-up" style={{marginRight: '8px'}}></i> PAYMENT (Cash Out)
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>Date *</label>
                            <input 
                                type="date" 
                                name="date" 
                                value={formData.date} 
                                onChange={handleChange} 
                                style={styles.input} 
                                required 
                            />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Voucher No (Optional)</label>
                            <input 
                                type="text" 
                                name="voucher_no" 
                                value={formData.voucher_no} 
                                onChange={handleChange} 
                                style={styles.input} 
                                placeholder="Auto Generate if empty" 
                            />
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>Account Head *</label>
                            <select 
                                name="account_id" 
                                value={formData.account_id} 
                                onChange={handleChange} 
                                style={styles.input} 
                                required
                            >
                                <option value="">-- Select Account --</option>
                                {accounts.map(acc => (
                                    <option key={acc.account_id} value={acc.account_id}>
                                        {acc.account_name} ({acc.category})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Amount (AED) *</label>
                            <div style={styles.inputWithAddon}>
                                <span style={styles.addon}>AED</span>
                                <input 
                                    type="number" 
                                    name="amount" 
                                    value={formData.amount} 
                                    onChange={handleChange} 
                                    style={{...styles.input, borderTopLeftRadius: 0, borderBottomLeftRadius: 0}} 
                                    placeholder="0.00" 
                                    step="0.01"
                                    min="0.01"
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={{...styles.group, flex: 1}}>
                            <label style={styles.label}>Related Lot / Project (Optional)</label>
                            <select 
                                name="lot_id" 
                                value={formData.lot_id} 
                                onChange={handleChange} 
                                style={styles.input} 
                            >
                                <option value="">-- No specific lot --</option>
                                {lots.map(lot => (
                                    <option key={lot.lot_id} value={lot.lot_id}>
                                        {lot.lot_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Description / Narration</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            style={{...styles.input, minHeight: '80px', resize: 'vertical'}} 
                            placeholder="Enter transaction particulars here..." 
                        ></textarea>
                    </div>

                    <div style={styles.footer}>
                        <button type="submit" style={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Save Cash Book Entry'}
                        </button>
                    </div>
                </form>
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
        maxWidth: '900px',
        margin: '0 auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    secondaryBtn: {
        background: '#fff',
        color: '#374151',
        border: '1px solid #d1d5db',
        padding: '0.6rem 1.2rem',
        borderRadius: '8px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    formCard: {
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden'
    },
    cardIndicator: (type: string) => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: type === 'receipt' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
        transition: 'background 0.3s ease'
    }),
    smartBox: {
        background: '#eef2ff',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px dashed #6366f1',
        marginBottom: '1rem'
    },
    typeSelector: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        background: '#f3f4f6',
        padding: '0.5rem',
        borderRadius: '12px'
    },
    typeBtn: {
        flex: 1,
        padding: '1rem',
        textAlign: 'center',
        borderRadius: '8px',
        fontWeight: '600',
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    typeBtnActiveIn: {
        flex: 1,
        padding: '1rem',
        textAlign: 'center',
        borderRadius: '8px',
        fontWeight: '600',
        background: '#fff',
        color: '#059669',
        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
        border: '1px solid #a7f3d0'
    },
    typeBtnActiveOut: {
        flex: 1,
        padding: '1rem',
        textAlign: 'center',
        borderRadius: '8px',
        fontWeight: '600',
        background: '#fff',
        color: '#dc2626',
        boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
        border: '1px solid #fecaca'
    },
    row: {
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '1.5rem'
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    input: {
        padding: '0.75rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '1rem',
        color: '#1f2937',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
        background: '#fff',
        width: '100%',
        boxSizing: 'border-box'
    },
    inputWithAddon: {
        display: 'flex',
        alignItems: 'stretch'
    },
    addon: {
        background: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRight: 'none',
        padding: '0.75rem 1rem',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
        color: '#6b7280',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center'
    },
    footer: {
        marginTop: '2.5rem',
        display: 'flex',
        justifyContent: 'flex-end',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '1.5rem'
    },
    submitBtn: {
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: '#fff',
        border: 'none',
        padding: '0.8rem 2rem',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '1.05rem',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
        transition: 'all 0.2s'
    },
    errorAlert: {
        background: '#fef2f2',
        color: '#991b1b',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #ef4444',
        marginBottom: '1.5rem',
        fontWeight: '500'
    },
    successAlert: {
        background: '#ecfdf5',
        color: '#065f46',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #10b981',
        marginBottom: '1.5rem',
        fontWeight: '500'
    }
};
