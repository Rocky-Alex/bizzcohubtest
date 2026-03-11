import React, { useState } from 'react';
import './CustomerLedgerModal.css';
import AddLedgerModal from './AddLedgerModal';

interface CustomerLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: {
        name: string;
        email: string;
        avatar: string;
        balance: string;
    } | null;
}

const MOCK_TRANSACTIONS: any[] = [];

export default function CustomerLedgerModal({ isOpen, onClose, customer }: CustomerLedgerModalProps) {
    const [isAddLedgerOpen, setIsAddLedgerOpen] = useState(false);

    if (!isOpen || !customer) return null;

    return (
        <div className="ledger-modal-overlay" onClick={onClose}>
            <div className="ledger-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="ledger-modal-header">
                    <h2>Customer Ledger</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="ledger-modal-body">
                    {/* Action Bar */}
                    <div className="ledger-action-bar">
                        <div className="action-group-left">
                            <button className="btn-outline">
                                <i className="fas fa-print"></i> Print
                            </button>
                            <button className="btn-outline">
                                <i className="fas fa-file-pdf"></i> Download PDF
                            </button>
                        </div>
                        <button
                            className="btn-create-ledger"
                            onClick={() => setIsAddLedgerOpen(true)}
                        >
                            <i className="fas fa-plus-circle"></i> Create Ledger
                        </button>
                    </div>

                    {/* Profile Card */}
                    <div className="ledger-profile-card">
                        <div className="profile-info">
                            <img src={customer.avatar} alt={customer.name} className="profile-avatar" />
                            <div className="profile-details">
                                <h3>{customer.name}</h3>
                                <p>{customer.email || 'email@example.com'}</p>
                            </div>
                        </div>
                        <div className="profile-stats">
                            <div className="closing-badge">
                                <i className="fas fa-sync-alt"></i>
                                Closing Balance : {customer.balance}
                            </div>
                            <div className="legend-item text-green">
                                <div className="dot green"></div> Credit
                            </div>
                            <div className="legend-item text-red">
                                <div className="dot red"></div> Debit
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ledger-table-container">
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Payment Mode</th>
                                    <th>Amount</th>
                                    <th>Closing Balance</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_TRANSACTIONS.map((tx, idx) => (
                                    <tr key={idx}>
                                        <td>{tx.id}</td>
                                        <td>{tx.date}</td>
                                        <td>{tx.mode}</td>
                                        <td className={`amount-cell ${tx.type === 'debit' ? 'amount-green' : 'amount-red'}`}>
                                            {tx.amount}
                                        </td>
                                        <td>{tx.closing}</td>
                                        <td>
                                            <div className="action-dots">
                                                <i className="fas fa-ellipsis-h"></i>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="ledger-footer-row" style={{ justifyContent: 'flex-end', gap: '3rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.2rem' }}>Total Amount</span>
                                <span>
                                    {MOCK_TRANSACTIONS.reduce((sum, tx) => sum + (Number(tx.amount.replace(/[^0-9.-]+/g, "")) || 0), 0) || 0}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '3rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.2rem' }}>Closing Balance</span>
                                <span>{customer.balance || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested Add Ledger Modal */}
            <AddLedgerModal
                isOpen={isAddLedgerOpen}
                onClose={() => setIsAddLedgerOpen(false)}
                onSubmit={(data) => {
                    console.log('New Ledger Data:', data);
                    // Handle creating ledger entry here (e.g. API call)
                }}
            />
        </div>
    );
}
