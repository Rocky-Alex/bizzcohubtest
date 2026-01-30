"use client";

import React, { useState, useEffect, useRef } from 'react';
import '../styles/UserPasswords.css';
import LoadingSpinner from '../../components/LoadingSpinner';
import ChangePasswordModal from './ChangePasswordModal';
import { toast } from 'sonner';
import { Country } from 'country-state-city';

// Temporary security password
const ACCESS_PASSWORD = "bizzcohubrishu0226@2025";

export default function UserPasswords() {
    // Auth States: 'password' -> 'otp' -> 'granted'
    const [authStep, setAuthStep] = useState<'password' | 'otp' | 'granted'>('password');

    const [accessInput, setAccessInput] = useState("");
    const [showAccessPassword, setShowAccessPassword] = useState(false);

    // OTP States
    const [otpInputs, setOtpInputs] = useState({ otp1: '', otp2: '' });
    const [otpData, setOtpData] = useState({ signature: '', expiry: 0 });
    const [timeLeft, setTimeLeft] = useState(0);
    const [otpExpired, setOtpExpired] = useState(false);

    // Resend & Cooldown States
    const [resendAttempts, setResendAttempts] = useState(0);
    const [cooldownTime, setCooldownTime] = useState(0);

    const [view, setView] = useState<'customers' | 'users'>('customers');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Track which passwords are visible (by ID)
    const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
    const [editingUser, setEditingUser] = useState<any>(null);

    // Session Timer ref
    const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Session Timeout Logic
    useEffect(() => {
        if (authStep === 'granted') {
            fetchData();
            if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = setTimeout(() => {
                setAuthStep('password');
                setAccessInput("");
                setOtpInputs({ otp1: '', otp2: '' });
                setResendAttempts(0);
                setCooldownTime(0);
                toast.info("Session timed out. Please enter password again.");
            }, 2 * 60 * 1000); // 2 minutes
        }

        return () => {
            if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
        };
    }, [authStep, view]);

    // 2. OTP Countdown Timer (90 seconds)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (authStep === 'otp' && timeLeft > 0 && cooldownTime === 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setOtpExpired(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [authStep, timeLeft, cooldownTime]);

    // 3. Cooldown Timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldownTime > 0) {
            timer = setInterval(() => {
                setCooldownTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [cooldownTime]);


    const sendOtps = async () => {
        const loadingToast = toast.loading("Sending OTPs...");
        try {
            const res = await fetch('/api/admin/otp/send', { method: 'POST' });
            const json = await res.json();
            toast.dismiss(loadingToast);

            if (json.success) {
                setOtpData({ signature: json.signature, expiry: json.expiry });
                setTimeLeft(90); // 90 seconds
                setOtpExpired(false);
                setAuthStep('otp');
                toast.success("Two unique OTPs have been sent to registered emails.");
            } else {
                toast.error("Failed to send OTPs: " + (json.message || "Unknown error"));
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            console.error(err);
            toast.error("System error sending OTPs");
        }
    };

    const handleAccessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cooldownTime > 0) {
            toast.error(`Please wait ${Math.ceil(cooldownTime / 60)} minutes before trying again.`);
            return;
        }

        if (accessInput === ACCESS_PASSWORD) {
            await sendOtps();
        } else {
            toast.error("Incorrect Password");
        }
    };

    const handleResend = async () => {
        if (cooldownTime > 0) return;

        // Constraint: If attempt 2 (meaning 1 resend already used), next one triggers 30 min cooldown
        if (resendAttempts >= 1) {
            setCooldownTime(30 * 60); // 30 minutes
            toast.error("Too many resend attempts. Please wait 30 minutes.");
            return;
        }

        // Increment attempts and send
        setResendAttempts(prev => prev + 1);
        await sendOtps();
    };


    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otpExpired) {
            toast.error("OTP has expired. Please Resend.");
            return;
        }

        if (!otpInputs.otp1 || !otpInputs.otp2) {
            toast.warning("Please enter both OTPs");
            return;
        }

        const loadingToast = toast.loading("Verifying OTPs...");
        try {
            const res = await fetch('/api/admin/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp1: otpInputs.otp1,
                    otp2: otpInputs.otp2,
                    signature: otpData.signature,
                    expiry: otpData.expiry
                })
            });
            const json = await res.json();
            toast.dismiss(loadingToast);

            if (json.success) {
                toast.success("Access Granted");
                setAuthStep('granted');
                // Reset states
                setResendAttempts(0);
                setCooldownTime(0);
            } else {
                toast.error("Verification Failed: " + (json.message || "Invalid OTPs"));
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("System error verifying OTPs");
        }
    };


    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = view === 'users' ? '/api/admin/users' : '/api/admin/customers';
            const res = await fetch(endpoint);
            const json = await res.json();

            if (view === 'users') {
                setData(json.users || []);
            } else {
                setData(json.customers || []);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const togglePassword = (id: number) => {
        setVisibleIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleEditClick = (row: any) => {
        setEditingUser(row);
    };

    const handleSavePassword = async (newPassword: string) => {
        if (!editingUser) return;

        try {
            const endpoint = view === 'users' ? '/api/admin/users' : '/api/admin/customers';
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingUser, password: newPassword })
            });

            if (res.ok) {
                toast.success('Password updated successfully');
                await fetchData(); // Refresh data to show new password
                setEditingUser(null);
            } else {
                toast.error('Failed to update password');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        }
    };

    const renderPasswordCell = (row: any) => {
        const isVisible = visibleIds.has(row.id);
        const hasPassword = !!row.visible_password;

        if (!hasPassword && isVisible) {
            return (
                <div className="password-cell">
                    <span className="password-unavailable">Unavailable</span>
                    <button className="password-toggle-btn" onClick={() => togglePassword(row.id)}>
                        <i className="fas fa-eye-slash"></i>
                    </button>
                    <button
                        className="password-toggle-btn"
                        onClick={() => handleEditClick(row)}
                        title="Edit Password"
                        style={{ marginLeft: '4px' }}
                    >
                        <i className="fas fa-pen"></i>
                    </button>
                </div>
            );
        }

        return (
            <div className="password-cell">
                <span className={`password-text ${!isVisible ? 'hidden' : ''}`}>
                    {isVisible ? row.visible_password : '••••••••'}
                </span>
                <button
                    className="password-toggle-btn"
                    onClick={() => togglePassword(row.id)}
                    title={isVisible ? "Hide Password" : "Show Password"}
                >
                    <i className={`fas ${isVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
                <button
                    className="password-toggle-btn"
                    onClick={() => handleEditClick(row)}
                    title="Edit Password"
                    style={{ marginLeft: '4px' }}
                >
                    <i className="fas fa-pen"></i>
                </button>
            </div>
        );
    };

    const renderPhone = (phone: string) => {
        if (!phone) return '-';
        const cleanPhone = phone.startsWith('+') ? phone.substring(1) : phone;
        const countries = Country.getAllCountries();
        const match = countries.sort((a, b) => b.phonecode.length - a.phonecode.length)
            .find(c => cleanPhone.startsWith(c.phonecode));

        if (match) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                        src={`https://flagcdn.com/w20/${match.isoCode.toLowerCase()}.png`}
                        alt={match.isoCode}
                        width="20"
                        style={{ borderRadius: '2px', objectFit: 'cover' }}
                    />
                    <span>{phone}</span>
                </div>
            );
        }
        return phone;
    };

    // LOCK SCREEN RENDER
    if (authStep !== 'granted') {
        const isOtp = authStep === 'otp';
        const isCooldown = cooldownTime > 0;

        return (
            <div className="user-passwords-container" style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="access-lock-screen" style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
                    <div className="lock-icon" style={{ fontSize: '3rem', color: isCooldown ? '#ef4444' : (isOtp ? '#f59e0b' : '#64748b'), marginBottom: '20px' }}>
                        <i className={`fas ${isCooldown ? 'fa-ban' : (isOtp ? 'fa-envelope-open-text' : 'fa-lock')}`}></i>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#1e293b' }}>
                        {isCooldown ? "Access Paused" : (isOtp ? "Two-Factor Verification" : "Security Check")}
                    </h2>

                    {isCooldown ? (
                        <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
                            Too many attempts. <br />
                            Try again in {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                        </div>
                    ) : (
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>
                            {isOtp
                                ? `Please enter the OTPs sent to your registered emails. Time remaining: ${timeLeft}s`
                                : "Please enter the security password to access this section."
                            }
                        </p>
                    )}

                    {!isOtp && !isCooldown && (
                        <form onSubmit={handleAccessSubmit}>
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <input
                                    type={showAccessPassword ? "text" : "password"}
                                    value={accessInput}
                                    onChange={(e) => setAccessInput(e.target.value)}
                                    placeholder="Enter Password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessPassword(!showAccessPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <i className={`fas ${showAccessPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#7c3aed',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Verify Access
                            </button>
                        </form>
                    )}

                    {isOtp && !isCooldown && (
                        <form onSubmit={handleOtpVerify}>
                            <div className="otp-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#64748b' }}>OTP from mail 1 ({'rishad..'})</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={otpInputs.otp1}
                                    onChange={(e) => setOtpInputs({ ...otpInputs, otp1: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1.2rem',
                                        textAlign: 'center',
                                        letterSpacing: '4px',
                                        background: otpExpired ? '#f3f4f6' : 'white'
                                    }}
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                    autoFocus
                                    disabled={otpExpired}
                                />
                            </div>
                            <div className="otp-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#64748b' }}>OTP from mail 2 ({'bizz..'})</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={otpInputs.otp2}
                                    onChange={(e) => setOtpInputs({ ...otpInputs, otp2: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1.2rem',
                                        textAlign: 'center',
                                        letterSpacing: '4px',
                                        background: otpExpired ? '#f3f4f6' : 'white'
                                    }}
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                    disabled={otpExpired}
                                />
                            </div>

                            {!otpExpired ? (
                                <button
                                    type="submit"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Verify OTPs
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#3b82f6', // Blue for resend
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Resend OTPs
                                </button>
                            )}

                            <div style={{ marginTop: '10px', fontSize: '0.9rem', color: timeLeft < 10 ? 'red' : '#64748b' }}>
                                {otpExpired ? "Expired" : `Expires in ${timeLeft} seconds`}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="user-passwords-container">
            <div className="up-header">
                <h2 className="up-title">User Passwords</h2>

                {/* Toggle Pill */}
                <div className="up-toggle-container">
                    <button
                        className={`up-toggle-btn ${view === 'customers' ? 'active' : ''}`}
                        onClick={() => setView('customers')}
                    >
                        Customer
                        {/* Add icon? User audio mentioned "Customer" */}
                    </button>
                    <button
                        className={`up-toggle-btn ${view === 'users' ? 'active' : ''}`}
                        onClick={() => setView('users')}
                    >
                        User
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="up-table-wrapper">
                    <table className="up-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Username</th>
                                <th>Password</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            {view === 'users'
                                                ? `${row.first_name || ''} ${row.last_name || ''}`
                                                : row.name}
                                        </td>
                                        <td>{row.email || '-'}</td>
                                        <td>{renderPhone(row.phone)}</td>
                                        <td>{row.username || '-'}</td>
                                        <td>{renderPasswordCell(row)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                                        No {view} found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ChangePasswordModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                onSave={handleSavePassword}
                userName={editingUser ? (editingUser.name || editingUser.username || 'User') : ''}
            />
        </div>
    );
}
