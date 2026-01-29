
import React from 'react';

const LoadingSpinner = () => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                width: '100%',
                height: '100%'
            }}
        >
            <div
                style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}
            />
            <style jsx>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
