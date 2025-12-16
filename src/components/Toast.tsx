"use client";

import React, { useEffect } from 'react';

interface ToastProps {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type = 'success', duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <i className="fas fa-check-circle" style={{ color: '#10B981', fontSize: '1.2rem' }}></i>;
            case 'error': return <i className="fas fa-exclamation-circle" style={{ color: '#EF4444', fontSize: '1.2rem' }}></i>;
            default: return <i className="fas fa-info-circle" style={{ color: '#3B82F6', fontSize: '1.2rem' }}></i>;
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '300px',
            marginBottom: '12px',
            borderLeft: `4px solid ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'}`,
            animation: 'slideInRight 0.3s ease-out forwards',
            position: 'relative',
            zIndex: 9999
        }}>
            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

            {getIcon()}

            <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
                    {type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                    {message}
                </p>
            </div>

            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '4px',
                }}
            >
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

export default Toast;
