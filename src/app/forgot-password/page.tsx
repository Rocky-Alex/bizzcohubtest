'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import '../login/login.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'confirm' | 'sent'>('input');
    const [userData, setUserData] = useState<{ username: string, avatar: string | null } | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'lookup' })
            });

            const data = await res.json();

            if (res.ok && data.found) {
                setUserData(data.user);
                setStep('confirm');
            } else {
                toast.error(data.message || 'No account found with this email');
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
            const res = await fetch('/api/auth/forgot-password', {
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
        <div className="futuristic-login-container">
            <div className="content-wrapper" style={{ justifyContent: 'center' }}>
                <div className="login-card-glass" style={{ width: '100%', maxWidth: '450px' }}>

                    {step === 'input' && (
                        <>
                            <div className="login-header">
                                <h1 className="login-title">Reset Password</h1>
                                <p className="login-subtitle">
                                    Enter your email to find your account
                                </p>
                            </div>
                            <form onSubmit={handleLookup}>
                                <div className="dark-form-group">
                                    <div className="dark-input-container">
                                        <i className="fas fa-envelope dark-input-icon"></i>
                                        <input
                                            type="email"
                                            className="dark-input"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="login-btn-glow"
                                    disabled={isLoading}
                                    style={{ marginTop: '1rem' }}
                                >
                                    {isLoading ? (
                                        <i className="fas fa-circle-notch fa-spin"></i>
                                    ) : (
                                        'Find Account'
                                    )}
                                </button>

                                <div className="text-center mt-4">
                                    <a href="/login" className="toggle-link" style={{ fontSize: '0.9rem' }}>
                                        Back to Login
                                    </a>
                                </div>
                            </form>
                        </>
                    )}

                    {step === 'confirm' && userData && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-6">Confirm Account</h2>

                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '3px solid #007aff',
                                margin: '0 auto 1.5rem auto',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                background: '#1e293b'
                            }}>
                                {userData.avatar ? (
                                    <img
                                        src={userData.avatar}
                                        alt={userData.username}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff' }}>
                                        {userData.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>@{userData.username}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>{email}</p>


                            <button
                                onClick={handleSend}
                                className="login-btn-glow"
                                disabled={isLoading}
                                style={{ marginBottom: '1rem' }}
                            >
                                {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Yes, Send Reset Link'}
                            </button>

                            <button
                                onClick={() => setStep('input')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'transparent',
                                    border: '1px solid #334155',
                                    color: '#94a3b8',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#cbd5e1'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
                            >
                                Not you?
                            </button>
                        </div>
                    )}

                    {step === 'sent' && (
                        <div className="text-center" style={{ color: '#fff' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#22c55e' }}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Check your inbox</h3>
                            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                                We have sent a password reset link to <strong style={{ color: '#e2e8f0' }}>{email}</strong>.
                            </p>
                            <a href="/login" className="login-btn-glow" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                Back to Login
                            </a>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
