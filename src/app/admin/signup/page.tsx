'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../login/login.css';
import './signup.css';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        role: 'accountant' as 'admin' | 'accountant',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateForm = () => {
        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (!formData.email && !formData.phone) {
            setError('Please provide either email or phone number');
            return false;
        }

        if (formData.email && !formData.email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }

        if (formData.phone && formData.phone.length < 10) {
            setError('Please enter a valid phone number');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('✅ Registration successful!\n\nYour account has been submitted for approval. You will be notified once an administrator approves your account.');
                router.push('/admin/login');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setError('An error occurred during registration. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="sphere-text">Sign Up</div>

            <div className="login-content">
                <div className="login-header">
                    <h1 className="main-title">
                        Bizz Co Hub<br />
                        <span className="highlight-text">Create Account</span>
                    </h1>
                    <p className="description">
                        Register for admin panel access
                    </p>
                </div>

                <div className="login-card signup-card">
                    <form onSubmit={handleSubmit}>
                        {/* Username */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Username *</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    className="form-input"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Choose a username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password *</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="At least 6 characters"
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

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                            <div className="input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="form-input"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
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

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">Phone Number</label>
                            <div className="input-wrapper">
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+971 50 123 4567"
                                />
                            </div>
                            <small className="field-note">* Email or Phone is required for password reset</small>
                        </div>

                        {/* Role Selection */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="role">Requested Role</label>
                            <select
                                id="role"
                                name="role"
                                className="form-input form-select"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="accountant">Accountant</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <small className="field-note">Admin approval required for all roles</small>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="signup-link">
                        Already have an account? <Link href="/admin/login">Sign In</Link>
                    </div>
                </div>

                <div className="copyright">
                    Copyright © 2025 Bizz Co Hub. All Rights Reserved.
                </div>
            </div>
        </div>
    );
}
