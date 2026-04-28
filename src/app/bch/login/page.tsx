'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/LoadingSpinner';
import LogoOrbit from './components/LogoOrbit';
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

        const BYPASS_AUTH = false;

        if (BYPASS_AUTH) {
            // Simulated login for "paused auth"
            const dummyUser = {
                id: 1,
                username: username || 'admin',
                role: 'admin',
                name: username ? `Bypass (${username})` : 'Super Admin',
                email: 'admin@bizzcohub.com'
            };

            localStorage.setItem('admin_user', JSON.stringify(dummyUser));
            sessionStorage.setItem('admin_authenticated', 'true');
            window.dispatchEvent(new Event('admin-login'));
            router.push('/bch/dashboard');
            setIsLoading(false);
            return;
        }

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

                {/* Visual Side (Apple ID Style Orbit) */}
                <div className="tech-visual-container">
                    <LogoOrbit />
                </div>

                {/* Login Header Section */}
                <div className="login-header">
                    <h1 className="login-title">
                        Bizz Co Hub Account
                    </h1>
                    <p className="login-subtitle">
                        Manage your Bizz Co Hub Account
                    </p>
                </div>

                {/* Login Form Section */}
                <div className="login-card-glass">
                    <form onSubmit={handleUsernameLogin}>
                        <div className="dark-form-group">
                            <div className="dark-input-container">
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

                        <button
                            type="submit"
                            className="login-btn-glow"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <LoadingSpinner size={24} text="" />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <a href="/bch/forgot-password" className="forgot-password-link">
                        Forgot Password?
                    </a>

                    <div className="copyright-glass">
                        Copyright © 2026 Bizz Co Hub. All Rights Reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
