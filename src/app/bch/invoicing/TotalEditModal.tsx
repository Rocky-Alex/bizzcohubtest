'use client';

import React from 'react';

interface TotalEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newTotal: number) => void;
    currentTotal: number;
}

export default function TotalEditModal({ isOpen, onClose, onSave, currentTotal }: TotalEditModalProps) {
    const [inputValue, setInputValue] = React.useState(currentTotal.toFixed(0));

    if (!isOpen) return null;

    const handleSave = () => {
        const val = parseFloat(inputValue);
        if (!isNaN(val) && val >= 0) {
            onSave(val);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '350px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#1A2244' }}>Edit Total Amount</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                    The new amount will be distributed proportionally among all items.
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Target Total (AED)</label>
                    <input
                        type="number"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        placeholder="Enter total amount..."
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={onClose}
                        style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        style={{ flex: 1, padding: '0.75rem', border: 'none', background: '#1A2244', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
}
