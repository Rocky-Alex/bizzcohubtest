"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    text?: string;
    size?: number;
}

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

                {/* Animated "Filling" Logo */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    initial={{ clipPath: 'inset(100% 0 0 0)' }}
                    animate={{ clipPath: 'inset(0% 0 0 0)' }}
                    transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        repeatDelay: 0.2
                    }}
                >
                    <img 
                        src="/icon/nav-logo.png" 
                        alt="Loading..." 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                        }} 
                    />
                </motion.div>

                {/* Subtle Pulse Ring */}
                <motion.div
                    style={{
                        position: 'absolute',
                        width: '120%',
                        height: '120%',
                        borderRadius: '50%',
                        border: '2px solid var(--primary, #3b82f6)',
                        opacity: 0
                    }}
                    animate={{ 
                        scale: [1, 1.2],
                        opacity: [0, 0.3, 0],
                    }}
                    transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeOut" 
                    }}
                />
            </div>

            {text && (
                <motion.p 
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
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
                </motion.p>
            )}
        </div>
    );
};

export default LoadingSpinner;
