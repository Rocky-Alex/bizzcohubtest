'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import '../login/styles/login.css';

export default function AdminForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'confirm' | 'sent'>('input');
    const [userData, setUserData] = useState<{ username: string, avatar: string | null } | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/bch/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'lookup' })
            });

            const data = await res.json();

            if (res.ok && data.found) {
                setUserData(data.user);
                setStep('confirm');
            } else {
                toast.error(data.message || 'No admin account found');
            }
        } catch (error) {
            console.error('Lookup Error:', error);
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        setIsLoading(true);

        try {
            const res = await fetch('/api/bch/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'send' })
            });

            const data = await res.json();

            if (res.ok) {
                setStep('sent');
                toast.success('Reset link sent to your email!');
            } else {
                toast.error(data.error || 'Failed to send reset link');
            }
        } catch (error) {
            console.error('Send Error:', error);
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="sphere-text">Admin</div>

            <div className="login-content">
                <div className="login-header">
                    <h1 className="main-title">
                        Bizz Co Hub<br />
                        <span className="highlight-text">Reset Password</span>
                    </h1>
                    <p className="description">
                        {step === 'confirm' ? 'Confirm your identity' : 'Enter your admin email to proceed'}
                    </p>
                </div>

                <div className="login-card">
                    {step === 'input' && (
                        <form onSubmit={handleLookup}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? 'Locating...' : 'Find Account'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <a href="/bch/login" style={{ color: '#aaa', fontSize: '0.9rem', textDecoration: 'none' }}>
                                    Back to Login
                                </a>
                            </div>
                        </form>
                    )}

                    {step === 'confirm' && userData && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden',
                                border: '3px solid #ef4444', margin: '0 auto 1.5rem auto', position: 'relative'
                            }}>
                                {userData.avatar ? (
                                    <img
                                        src={userData.avatar}
                                        alt={userData.username}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff' }}>
                                        {userData.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>@{userData.username}</h3>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{email}</p>

                            <button onClick={handleSend} className="submit-btn" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Yes, Send Link'}
                            </button>

                            <button
                                onClick={() => setStep('input')}
                                style={{
                                    background: 'transparent', border: '1px solid #444', color: '#ccc',
                                    width: '100%', padding: '12px', borderRadius: '6px', marginTop: '1rem', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {step === 'sent' && (
                        <div style={{ textAlign: 'center', color: 'white' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#4ade80' }}>
                                ✓
                            </div>
                            <p style={{ marginBottom: '1.5rem', color: '#ccc' }}>
                                Reset link sent to <strong>{email}</strong>. Check your inbox.
                            </p>
                            <a href="/bch/login" className="submit-btn" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                                Return to Login
                            </a>
                        </div>
                    )}
                </div>

                <div className="copyright">
                    Copyright © 2026 Bizz Co Hub. All Rights Reserved.
                </div>
            </div>
        </div>
    );
}
