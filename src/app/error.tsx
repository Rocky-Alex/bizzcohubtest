'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong!</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                We apologize for the inconvenience. An unexpected error occurred.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '12px 24px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Try again
                </button>
                <Link
                    href="/"
                    style={{
                        padding: '12px 24px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
