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
                // Set Session Storage flag for "Tab Close" security
                sessionStorage.setItem('admin_authenticated', 'true');

                // Dispatch event so other components can react immediately if needed
                window.dispatchEvent(new Event('admin-login'));

                // Role-based redirect
                const role = data.user?.role?.toLowerCase();
                if (role === 'admin' || role === 'superadmin' || role === 'accountant') {
                    router.push('/bch/dashboard');
                } else {
                    router.push('/bch/production');
                }
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
        <div className="futuristic-login-container">
            <div className="content-wrapper">

                {/* Visual Side (Tech Core) */}
                <div className="tech-visual-container">
                    <div className="tech-core">
                        {/* Central Icon */}
                        <i className="fas fa-shield-alt core-icon"></i>

                        {/* Orbiting Rings */}
                        <div className="ring ring-outer"></div>
                        <div className="ring ring-middle"></div>
                        <div className="ring ring-inner"></div>

                        {/* Floating Items */}
                        <div className="floating-item item-1">
                            <i className="fas fa-database"></i>
                        </div>
                        <div className="floating-item item-2">
                            <i className="fas fa-server"></i>
                        </div>
                        <div className="floating-item item-3">
                            <i className="fas fa-network-wired"></i>
                        </div>
                    </div>
                </div>

                {/* Login Form Side */}
                <div className="login-card-glass">
                    <div className="login-header">
                        <h1 className="login-title">
                            Secure Access
                        </h1>
                        <p className="login-subtitle">
                            Bizz Co Hub Portal
                        </p>
                    </div>

                    <form onSubmit={handleUsernameLogin}>
                        <div className="dark-form-group">
                            <div className="dark-input-container">
                                <i className="fas fa-user dark-input-icon"></i>
                                <input
                                    type="text"
                                    className="dark-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="Username"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="dark-form-group">
                            <div className="dark-input-container">
                                <i className="fas fa-lock dark-input-icon"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="dark-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '20px' }}>
                            <a href="/bch/forgot-password" className="forgot-password-link">
                                Forgot Password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="login-btn-glow"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <i className="fas fa-circle-notch fa-spin"></i>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="copyright-glass">
                        Copyright © 2026 Bizz Co Hub. All Rights Reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
