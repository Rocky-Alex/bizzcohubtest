"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import './admin-login.css'; // We'll assume some styles or inline them

export default function AdminLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                toast.error("Invalid credentials");
            } else if (res?.ok) {
                toast.success("Welcome back, Admin!");
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#020617',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                        borderRadius: '12px',
                        margin: '0 auto 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        🛡️
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Admin Portal</h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Restricted access for staff only.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#cbd5e1' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#cbd5e1' }}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '12px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '10px'
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '12px',
                            cursor: 'pointer',
                        }}
                    >
                        Not an admin? Go to Customer Login
                    </button>
                </form>
            </div>
        </div>
    );
}
