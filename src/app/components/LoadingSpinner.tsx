"use client";

import React from 'react';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    text?: string;
    size?: number;
}

// Pure-CSS spinner — zero JS animation overhead on the critical auth path.
const spinnerStyles = `
@keyframes bch-fill-up {
    0%   { clip-path: inset(100% 0 0 0); }
    100% { clip-path: inset(0% 0 0 0); }
}
@keyframes bch-pulse-ring {
    0%   { transform: scale(1);   opacity: 0;   }
    50%  { transform: scale(1.15); opacity: 0.3; }
    100% { transform: scale(1.3); opacity: 0;   }
}
@keyframes bch-text-pulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1;   }
}
.bch-spinner-fill {
    animation: bch-fill-up 1.8s ease-in-out infinite alternate;
}
.bch-spinner-ring {
    animation: bch-pulse-ring 1.8s ease-out infinite;
}
.bch-spinner-text {
    animation: bch-text-pulse 1.8s ease-in-out infinite;
}
`;

const LoadingSpinner = ({ fullScreen = false, text = "Processing...", size = 100 }: LoadingSpinnerProps) => {
    const containerStyle: React.CSSProperties = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        flexDirection: 'column',
        gap: '1.5rem'
    } : {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        width: '100%',
        flexDirection: 'column',
        gap: '1.2rem'
    };

    return (
        <>
            {/* Inject keyframes once — tiny, no layout impact */}
            <style dangerouslySetInnerHTML={{ __html: spinnerStyles }} />

            <div style={containerStyle}>
                <div style={{
                    position: 'relative',
                    width: size,
                    height: size,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {/* Background "Empty" Logo */}
                    <img
                        src="/icon/nav-logo.png"
                        alt="Loading..."
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            opacity: 0.15,
                            filter: 'grayscale(1) brightness(0.8)'
                        }}
                    />

                    {/* Animated "Filling" Logo — pure CSS */}
                    <div
                        className="bch-spinner-fill"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <img
                            src="/icon/nav-logo.png"
                            alt="Loading..."
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>

                    {/* Subtle Pulse Ring — pure CSS */}
                    <div
                        className="bch-spinner-ring"
                        style={{
                            position: 'absolute',
                            width: '120%',
                            height: '120%',
                            borderRadius: '50%',
                            border: '2px solid var(--primary, #3b82f6)',
                            opacity: 0,
                        }}
                    />
                </div>

                {text && (
                    <p
                        className="bch-spinner-text"
                        style={{
                            color: '#1e293b',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            margin: 0
                        }}
                    >
                        {text}
                    </p>
                )}
            </div>
        </>
    );
};

export default LoadingSpinner;
