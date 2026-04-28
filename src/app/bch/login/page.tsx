'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                sessionStorage.setItem('admin_authenticated', 'true');
                window.dispatchEvent(new Event('admin-login'));

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
        <>
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
                    >
                        <LoadingSpinner fullScreen={true} text="Signing in..." size={100} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="futuristic-login-container">
                <div className="content-wrapper">
                    
                    {/* Left Side: Visual Animation */}
                    <div className="tech-visual-container">
                        <LogoOrbit />
                    </div>

                    {/* Right Side: Login Form Area */}
                    <div className="login-section">
                        <div className="login-header">
                            <h1 className="login-title">
                                <span className="brand-name">BIZZ CO HUB</span>
                                <br />
                                <span className="account-type">ADMIN ACCOUNT</span>
                            </h1>
                            <p className="login-subtitle">
                                Manage your Bizz Co Hub Admin Account
                            </p>
                        </div>

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
                                    Sign In
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
            </div>
        </>
    );
}
