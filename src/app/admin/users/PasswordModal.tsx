"use client";

import React, { useState } from 'react';
import '../styles/confirm-modal.css';

interface PasswordModalProps {
    isOpen: boolean;
    title: string;
    onConfirm: (password: string) => void;
    onCancel: () => void;
    errorMessage?: string;
    isLoading?: boolean;
}

export default function PasswordModal({ isOpen, title, onConfirm, onCancel, errorMessage, isLoading }: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setLocalError('Password is required');
            return;
        }
        setLocalError('');
        onConfirm(password);
    };

    const handleCancel = () => {
        onCancel();
        setPassword('');
        setLocalError('');
        setShowPassword(false);
    };

    return (
        <div className="admin-confirm-overlay">
            <div className="admin-confirm-content info">
                <div className="admin-confirm-icon">
                    <i className="fas fa-lock"></i>
                </div>
                <h3>{title}</h3>
                <p>Please enter your admin password to continue.</p>

                <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem', position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setLocalError('');
                            }}
                            placeholder="Enter Admin Password"
                            className="admin-form-input"
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                                border: `1px solid ${localError || errorMessage ? '#ef4444' : 'var(--border-color)'}`,
                                borderRadius: '6px',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)'
                            }}
                            autoFocus
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                        {(localError || errorMessage) && (
                            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-exclamation-circle"></i>
                                {localError || errorMessage}
                            </p>
                        )}
                    </div>

                    <div className="admin-modal-actions">
                        <button type="button" className="admin-btn-cancel" onClick={handleCancel} disabled={isLoading}>Cancel</button>
                        <button type="submit" className="admin-btn-confirm danger" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin"></i> Verifying...
                                </>
                            ) : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
