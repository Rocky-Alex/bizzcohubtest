import React from 'react';
import ProductViewer from '@/components/ThreeD/ProductViewer';
import Link from 'next/link';

export const metadata = {
    title: '3D Product Demo',
    description: 'Interactive 3D Product Viewer Demo',
};

const styles = {
    main: {
        padding: '4rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2rem',
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '1rem',
    },
    title: {
        fontSize: '3rem',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-space)',
        marginBottom: '1rem',
        lineHeight: '1.2',
    },
    description: {
        color: 'var(--text-secondary)',
        fontSize: '1.2rem',
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: '1.6',
    },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--primary)',
        fontWeight: '600',
        textDecoration: 'none',
        marginBottom: '2rem',
        fontSize: '0.9rem',
        transition: 'color 0.2s',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem',
    }
};

export default function Demo3DPage() {
    return (
        <main style={styles.main}>
            <div style={styles.header}>
                <Link href="/" style={styles.backLink}>
                    ← Back to Home
                </Link>
                <h1 style={styles.title}>Interactive Product Experience</h1>
                <p style={styles.description}>
                    Explore our products from every angle. Our new 3D viewer technology brings the showroom to your screen.
                </p>
            </div>

            <div style={styles.grid}>
                <ProductViewer />
            </div>
        </main>
    );
}
