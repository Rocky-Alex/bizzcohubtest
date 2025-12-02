'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './login.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const [loginMethod, setLoginMethod] = useState<'username' | 'phone'>('username');

    // Username Login States
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Phone Login States
    const [phone, setPhone] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [phoneStep, setPhoneStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
    const [isLoading, setIsLoading] = useState(false);

    // Password Reset States
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Username, 2: OTP, 3: New Password
    const [resetUsername, setResetUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle Username/Password Login
    const handleUsernameLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                router.push('/admin');
            } else {
                alert(data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Phone Login - Send OTP
    const handlePhoneSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/phone-login/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (data.showOtpInAlert) {
                    alert(`OTP sent successfully!\n\nFor demo purposes: ${data.otp}`);
                } else {
                    alert('OTP sent successfully to your phone!');
                }
                setPhoneStep(2);
            } else {
                alert(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Phone login error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Phone Login - Verify OTP
    const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/phone-login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: phoneOtp }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                router.push('/admin');
            } else {
                alert(data.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error('Phone verify error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Password Reset Functions
    const handleForgotPassword = () => {
        setShowResetModal(true);
        setResetStep(1);
        setResetUsername('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleResetSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: resetUsername }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (data.showOtpInAlert) {
                    alert(`OTP sent successfully!\n\nFor demo purposes: ${data.otp}`);
                } else {
                    alert(data.message);
                }
                setResetStep(2);
            } else {
                alert(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: resetUsername, otp }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setResetStep(3);
            } else {
                alert(data.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: resetUsername,
                    newPassword
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Password reset successfully! You can now login with your new password.');
                closeResetModal();
            } else {
                alert(data.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const closeResetModal = () => {
        setShowResetModal(false);
        setResetStep(1);
        setResetUsername('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="login-container">
            <div className="sphere-text">Admin</div>

            <div className="login-content">
                <div className="login-header">
                    <h1 className="main-title">
                        Bizz Co Hub<br />
                        <span className="highlight-text">Admin Panel</span>
                    </h1>
                    <p className="description">
                        Secure access for administrators
                    </p>
                </div>

                <div className="login-card">
                    {/* Login Method Tabs */}
                    <div className="login-tabs">
                        <button
                            className={`tab-btn ${loginMethod === 'username' ? 'active' : ''}`}
                            onClick={() => setLoginMethod('username')}
                        >
                            Username Login
                        </button>
                        {/* <button
                            className={`tab-btn ${loginMethod === 'phone' ? 'active' : ''}`}
                            onClick={() => setLoginMethod('phone')}
                        >
                            Phone Login
                        </button> */}
                    </div>

                    {loginMethod === 'username' ? (
                        <form onSubmit={handleUsernameLogin}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="username">Username</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        id="username"
                                        className="form-input"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        className="form-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }} className="forgot-password">
                                    Forgot Password?
                                </a>
                            </div>

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={phoneStep === 1 ? handlePhoneSendOtp : handlePhoneVerifyOtp}>
                            {phoneStep === 1 ? (
                                <div className="form-group">
                                    <label className="form-label" htmlFor="phone">Phone Number</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="tel"
                                            id="phone"
                                            className="form-input"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            placeholder="+971 50 123 4567"
                                        />
                                    </div>
                                    <small className="field-note" style={{ marginTop: '10px', display: 'block', color: '#9ca3af' }}>
                                        We'll send a verification code to this number
                                    </small>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label" htmlFor="otp">Enter OTP</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            id="otp"
                                            className="form-input"
                                            value={phoneOtp}
                                            onChange={(e) => setPhoneOtp(e.target.value)}
                                            required
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                        />
                                    </div>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setPhoneStep(1); }} className="forgot-password">
                                        Change Phone Number
                                    </a>
                                </div>
                            )}

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? 'Processing...' : (phoneStep === 1 ? 'Send OTP' : 'Verify & Login')}
                            </button>
                        </form>
                    )}

                    <div className="signup-link">
                        Don't have an account? <Link href="/admin/signup">Sign Up</Link>
                    </div>
                </div>

                <div className="copyright">
                    Copyright © 2025 Bizz Co Hub. All Rights Reserved.
                </div>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={closeResetModal}>&times;</button>

                        <h2 className="modal-title">Reset Password</h2>

                        {resetStep === 1 && (
                            <form onSubmit={handleResetSendOtp}>
                                <p className="modal-description">Enter your username to receive an OTP.</p>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={resetUsername}
                                        onChange={(e) => setResetUsername(e.target.value)}
                                        required
                                        placeholder="Enter your username"
                                    />
                                </div>
                                <button type="submit" className="submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send OTP'}
                                </button>
                            </form>
                        )}

                        {resetStep === 2 && (
                            <form onSubmit={handleResetVerifyOtp}>
                                <p className="modal-description">Enter the OTP sent to your email/phone.</p>
                                <div className="form-group">
                                    <label className="form-label">OTP Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        placeholder="Enter 6-digit code"
                                    />
                                </div>
                                <button type="submit" className="submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                <button type="button" className="back-btn" onClick={() => setResetStep(1)}>
                                    Back
                                </button>
                            </form>
                        )}

                        {resetStep === 3 && (
                            <form onSubmit={handleResetPassword}>
                                <p className="modal-description">Create a new password for your account.</p>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div className="input-wrapper">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            className="form-input"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            placeholder="Min 6 characters"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <div className="input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-input"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            placeholder="Re-enter password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
