"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, KeyRound, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';

interface QcUserManagementPanelProps {
    customerId: number | null;
}

export default function QcUserManagementPanel({ customerId }: QcUserManagementPanelProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exists, setExists] = useState(false);
    const [currentUsername, setCurrentUsername] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);

    // Form inputs state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (customerId) {
            fetchQcUser();
        }
    }, [customerId]);

    const fetchQcUser = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/customer/qc-user?customerId=${customerId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    setExists(true);
                    setCurrentUsername(data.username);
                    setUsername(data.username);
                    setIsFormVisible(true);
                } else {
                    setExists(false);
                    setCurrentUsername('');
                    setUsername('');
                    setIsFormVisible(false);
                }
            } else {
                toast.error('Failed to load QC User details.');
            }
        } catch (error) {
            console.error('Error fetching QC user:', error);
            toast.error('An error occurred while loading QC User.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            toast.error('Username and password are required.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/customer/qc-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    username: username.trim(),
                    password: password.trim()
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(data.message || 'QC credentials saved successfully!');
                setPassword(''); // Clear password input
                fetchQcUser(); // Refresh
            } else {
                toast.error(data.error || 'Failed to save QC Operator credentials.');
            }
        } catch (error) {
            console.error('Error saving QC User:', error);
            toast.error('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--profile-accent)' }} />
                <span style={{ color: 'var(--profile-text-muted)', fontSize: '0.95rem' }}>Loading QC User settings...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Status Info / Banner */}
            {!exists && !isFormVisible ? (
                <div style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <ShieldAlert size={24} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '600', color: 'var(--profile-text-main)' }}>No QC Operator Account Configured</h4>
                            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--profile-text-muted)', lineHeight: '1.5' }}>
                                To upload and synchronize hardware diagnostics from the desktop Quality Check software, you must create a dedicated QC Operator account. This credentials set will be used to authorize the desktop application.
                            </p>
                        </div>
                    </div>
                    <div>
                        <button 
                            type="button" 
                            className="save-btn" 
                            onClick={() => setIsFormVisible(true)}
                            style={{ margin: 0, padding: '10px 24px', fontSize: '14px', borderRadius: '10px' }}
                        >
                            Configure QC Operator
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{
                    padding: '18px 24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '14px', color: 'var(--profile-text-muted)' }}>
                        Active QC Operator Authorized: 
                        <strong style={{ color: 'var(--profile-text-main)', marginLeft: '4px' }}>{currentUsername}</strong>
                    </div>
                </div>
            )}

            {/* Credentials Setup/Edit Form */}
            {isFormVisible && (
                <form onSubmit={handleSave} className="form-grid" style={{ marginTop: '8px' }}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={15} /> QC Operator Username
                            </label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Enter username for desktop client"
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                            />
                            <span style={{ fontSize: '11px', color: 'var(--profile-text-muted)', marginTop: '2px' }}>
                                Unique username used on the Quality Check desktop application.
                            </span>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <KeyRound size={15} /> Operator Password
                            </label>
                            <input 
                                type="password" 
                                className="form-input" 
                                placeholder={exists ? "Enter new password to reset" : "Enter password"}
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                            <span style={{ fontSize: '11px', color: 'var(--profile-text-muted)', marginTop: '2px' }}>
                                {exists 
                                    ? "Leave password empty if you do not want to change it. (Or enter a new one to reset directly)" 
                                    : "Password to authorize session on the desktop client."
                                }
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        {/* Cancel button if no user exists and they want to close the form */}
                        {!exists && (
                            <button
                                type="button"
                                onClick={() => setIsFormVisible(false)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--profile-card-border)',
                                    background: 'transparent',
                                    color: 'var(--profile-text-main)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        <button 
                            type="submit" 
                            className="save-btn" 
                            disabled={saving} 
                            style={{ margin: 0, padding: '10px 28px', fontSize: '14px' }}
                        >
                            {saving ? 'Saving Settings...' : exists ? 'Update Credentials' : 'Create Operator Account'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
