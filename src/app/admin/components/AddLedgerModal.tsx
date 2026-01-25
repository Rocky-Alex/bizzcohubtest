import React, { useState } from 'react';
import './AddLedgerModal.css';

interface AddLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function AddLedgerModal({ isOpen, onClose, onSubmit }: AddLedgerModalProps) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [mode, setMode] = useState<'Credit' | 'Debit'>('Debit');

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Format date to dd/mm/yyyy for display
        const [yyyy, mm, dd] = date.split('-');
        const formattedDate = `${dd}/${mm}/${yyyy}`;
        onSubmit({ amount, date: formattedDate, mode });
        onClose();
    };

    return (
        <div className="add-ledger-overlay" onClick={onClose}>
            <div className="add-ledger-container" onClick={(e) => e.stopPropagation()}>
                <div className="add-ledger-header">
                    <h3>Add New Ledger</h3>
                    <button className="btn-close-sm" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="add-ledger-body">
                    <div className="form-group">
                        <label>Amount</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder=""
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <div className="date-input-wrapper">
                            <input
                                type="date"
                                className="form-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                            <i className="far fa-calendar"></i>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mode</label>
                        <div className="radio-group">
                            <label className="radio-label credit-text">
                                <input
                                    type="radio"
                                    name="ledgerType"
                                    className="radio-custom credit"
                                    checked={mode === 'Credit'}
                                    onChange={() => setMode('Credit')}
                                />
                                Credit
                            </label>
                            <label className="radio-label debit-text">
                                <input
                                    type="radio"
                                    name="ledgerType"
                                    className="radio-custom debit"
                                    checked={mode === 'Debit'}
                                    onChange={() => setMode('Debit')}
                                />
                                Debit
                            </label>
                        </div>
                    </div>
                </div>

                <div className="add-ledger-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-create" onClick={handleSubmit}>Create</button>
                </div>
            </div>
        </div>
    );
}
