'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            const messages: Record<string, string> = {
                google_cancelled: 'Google sign-in was cancelled.',
                google_token_failed: 'Failed to complete Google sign-in. Please try again.',
                google_no_email: 'Could not retrieve your email from Google.',
                account_deactivated: 'Your account is deactivated. Please contact support.',
                google_server_error: 'A server error occurred during sign-in.',
            };
            toast.error(messages[error] || 'Sign-in failed. Please try again.');
            router.replace('/login');
            return;
        }

        if (userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                localStorage.setItem('customer_user', JSON.stringify(user));
                window.dispatchEvent(new Event('user-login'));
                toast.success('Successfully signed in with Google!');
                router.replace('/products');
            } catch {
                toast.error('Failed to complete sign-in. Please try again.');
                router.replace('/login');
            }
        } else {
            router.replace('/login');
        }
    }, [searchParams, router]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '16px',
            fontFamily: 'Inter, sans-serif',
            color: '#6b7280',
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #4f46e5',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p>Completing sign-in...</p>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
