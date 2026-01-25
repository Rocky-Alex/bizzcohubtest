'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import '../login/login.css'; // Corrected path

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'customer';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!token) {
            setIsChecking(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/auth/reset-password?token=${token}&type=${type}`);
                const data = await res.json();
                if (!data.valid) {
                    setIsExpired(true);
                }
            } catch (error) {
                console.error('Verification Error:', error);
                setIsExpired(true);
            } finally {
                setIsChecking(false);
            }
        };

        verifyToken();
    }, [token, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!token) {
            toast.error("Invalid token");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, type, password })
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
                toast.success("Password reset successful!");
                setTimeout(() => {
                    if (type === 'admin') router.push('/admin/login');
                    else router.push('/login');
                }, 2000);
            } else {
                toast.error(data.error || "Failed to reset password");
            }

        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="login-card-glass" style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fas fa-circle-notch fa-spin text-white text-2xl"></i>
                <p className="text-gray-400 mt-4">Verifying link...</p>
            </div>
        );
    }

    if (!token || isExpired) {
        return (
            <div className="login-card-glass" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }}>
                    <i className="fas fa-times-circle"></i>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Link Expired</h2>
                <p className="text-gray-400 mb-6">
                    This password reset link is invalid or has expired.
                </p>
                <button
                    onClick={() => {
                        if (type === 'admin') router.push('/admin/forgot-password');
                        else router.push('/forgot-password');
                    }}
                    className="login-btn-glow"
                >
                    Request New Link
                </button>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="login-card-glass" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', color: '#22c55e', marginBottom: '1rem' }}>
                    <i className="fas fa-check-circle"></i>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                <p className="text-gray-400 mb-6">Your password has been successfully updated.</p>
                <button
                    onClick={() => type === 'admin' ? router.push('/admin/login') : router.push('/login')}
                    className="login-btn-glow"
                >
                    Proceed to Login
                </button>
            </div>
        );
    }

    return (
        <div className="login-card-glass">
            <div className="login-header">
                <h1 className="login-title">Set New Password</h1>
                <p className="login-subtitle">
                    Enter your new secure password
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="dark-form-group">
                    <div className="dark-input-container">
                        <i className="fas fa-lock dark-input-icon"></i>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="dark-input"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
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
                                color: ('#64748b'),
                                cursor: 'pointer'
                            }}
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>

                <div className="dark-form-group">
                    <div className="dark-input-container">
                        <i className="fas fa-lock dark-input-icon"></i>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="dark-input"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: ('#64748b'),
                                cursor: 'pointer'
                            }}
                        >
                            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="login-btn-glow"
                    disabled={isLoading}
                >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="futuristic-login-container">
            <div className="content-wrapper" style={{ justifyContent: 'center' }}>
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
