"use client";
import React, { useState } from 'react';
import './ChangePasswordModal.css';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (password: string) => Promise<void>; // Async save
    userName: string;
}

export default function ChangePasswordModal({ isOpen, onClose, onSave, userName }: ChangePasswordModalProps) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await onSave(password);
            // Reset and close (handled by parent usually, but good to reset state)
            setPassword('');
            setConfirm('');
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cp-modal-overlay">
            <div className="cp-modal">
                <div className="cp-header">
                    <h3>Change Password</h3>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0' }}>
                        Update password for <strong>{userName}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="cp-form-group">
                        <label className="cp-label">New Password</label>
                        <div className="cp-input-wrapper">
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="cp-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                className="cp-toggle-btn"
                                onClick={() => setShowPass(!showPass)}
                            >
                                <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="cp-form-group">
                        <label className="cp-label">Confirm Password</label>
                        <div className="cp-input-wrapper">
                            <input
                                type={showConf ? 'text' : 'password'}
                                className="cp-input"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                className="cp-toggle-btn"
                                onClick={() => setShowConf(!showConf)}
                            >
                                <i className={`fas ${showConf ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-text">{error}</div>}

                    <div className="cp-actions">
                        <button type="button" className="cp-btn cp-btn-cancel" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="cp-btn cp-btn-save" disabled={loading}>
                            {loading ? 'Saving...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
