import React from 'react';

interface ComingSoonProps {
    title: string;
    description?: string;
}

export default function ComingSoon({ title, description = "We are working hard to bring you this feature. Stay tuned!" }: ComingSoonProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '400px',
            textAlign: 'center',
            color: '#64748b',
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid #f1f5f9'
        }}>
            <div style={{
                background: '#f8fafc',
                borderRadius: '50%',
                width: '120px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                <i className="fas fa-hard-hat" style={{ fontSize: '48px', color: '#94a3b8' }}></i>
            </div>
            <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '0.5rem'
            }}>
                {title} Under Construction
            </h2>
            <p style={{
                fontSize: '1rem',
                color: '#64748b',
                maxWidth: '500px',
                lineHeight: '1.6'
            }}>
                {description}
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <span style={{
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 500
                }}>
                    Coming Soon
                </span>
            </div>
        </div>
    );
}
