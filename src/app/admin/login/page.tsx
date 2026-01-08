'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import './styles/login.css';

export default function AdminLoginPage() {
    const router = useRouter();

    // Username Login States
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                // Save admin user to localStorage for UI sync
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                // Dispatch event so other components can react immediately if needed
                window.dispatchEvent(new Event('admin-login'));

                router.push('/admin');
            } else {
                toast.error(data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('An error occurred during login. Please try again.');
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
                        <span className="highlight-text">Admin Panel</span>
                    </h1>
                    <p className="description">
                        Secure access for administrators
                    </p>
                </div>

                <div className="login-card">
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
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '8px', marginBottom: '16px' }}>
                            <a href="/admin/forgot-password" style={{ color: '#aaa', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = '#aaa'}>
                                Forgot Password?
                            </a>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <div className="copyright">
                    Copyright © 2025 Bizz Co Hub. All Rights Reserved.
                </div>
            </div>
        </div>
    );
}
