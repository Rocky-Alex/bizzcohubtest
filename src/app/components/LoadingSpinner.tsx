import React from 'react';

const LoadingSpinner = ({ fullScreen = false }: { fullScreen?: boolean }) => {
    const spinnerStyle = {
        width: '50px',
        height: '50px',
        border: '3px solid var(--border)',
        borderRadius: '50%',
        borderTop: '3px solid var(--primary)',
        animation: 'spin 1s linear infinite',
    };

    const containerStyle: React.CSSProperties = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        flexDirection: 'column',
        gap: '1rem'
    } : {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        width: '100%',
        flexDirection: 'column' as 'column', // Explicit cast for TS
        gap: '1rem'
    };

    return (
        <div style={containerStyle}>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
            <div style={spinnerStyle}></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Loading...</p>
        </div>
    );
};

export default LoadingSpinner;
