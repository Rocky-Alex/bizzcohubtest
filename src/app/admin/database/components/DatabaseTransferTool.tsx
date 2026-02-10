import React, { useState } from 'react';
import { toast } from 'sonner';
import ConfirmModal from '../../shared/ConfirmModal';

interface DatabaseTransferToolProps {
    onBack: () => void;
    activeTable?: any;
}

export default function DatabaseTransferTool({ onBack }: DatabaseTransferToolProps) {
    const [direction, setDirection] = useState<'main-to-local' | 'local-to-main'>('main-to-local');
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferResults, setTransferResults] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleTransferClick = () => {
        setShowConfirm(true);
    };

    const confirmTransfer = async () => {
        setShowConfirm(false);
        setIsTransferring(true);
        setTransferResults(null);
        const toastId = toast.loading('Initializing database transfer...');

        try {
            const response = await fetch('/api/admin/database/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Database transfer completed successfully!', { id: toastId });
                setTransferResults(data.details);
            } else {
                toast.error(data.error || 'Transfer failed', { id: toastId });
            }
        } catch (error) {
            console.error('Transfer error:', error);
            toast.error('An unexpected error occurred during transfer', { id: toastId });
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <div style={{
            maxWidth: '1000px',
            margin: '0 auto',
            width: '100%',
            background: 'white',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '2rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Database Sync Tool</h2>
                    <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Transfer data between Main and Local environments</p>
                </div>
                <button
                    onClick={onBack}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#64748b'
                    }}
                >
                    <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back
                </button>
            </div>

            {/* Transfer Controls */}
            <div style={{ padding: '3rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem' }}>
                {/* Column: Main DB */}
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    border: '2px dashed #cbd5e1',
                    background: direction === 'main-to-local' ? '#eff6ff' : '#f8fafc',
                    borderColor: direction === 'main-to-local' ? '#3b82f6' : '#cbd5e1',
                    transition: 'all 0.3s'
                }}>
                    <div style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '1rem' }}>
                        <i className="fas fa-cloud"></i>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Main Database</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Production Environment</p>
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        background: direction === 'main-to-local' ? '#3b82f6' : '#94a3b8',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                    }}>
                        {direction === 'main-to-local' ? 'Source' : 'Destination'}
                    </div>
                </div>

                {/* Center Toggle */}
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={() => setDirection(prev => prev === 'main-to-local' ? 'local-to-main' : 'main-to-local')}
                        disabled={isTransferring}
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#0f172a',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s',
                            transform: direction === 'local-to-main' ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                    >
                        <i className="fas fa-exchange-alt"></i>
                    </button>
                    <div style={{ marginTop: '1rem', fontWeight: '700', color: '#64748b', fontSize: '0.8rem' }}>
                        CLICK TO SWITCH
                    </div>
                </div>

                {/* Column: Local DB */}
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    border: '2px dashed #cbd5e1',
                    background: direction === 'local-to-main' ? '#eff6ff' : '#f8fafc',
                    borderColor: direction === 'local-to-main' ? '#3b82f6' : '#cbd5e1',
                    transition: 'all 0.3s'
                }}>
                    <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>
                        <i className="fas fa-laptop-code"></i>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Local Database</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Development Environment</p>
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        background: direction === 'local-to-main' ? '#3b82f6' : '#94a3b8',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                    }}>
                        {direction === 'local-to-main' ? 'Source' : 'Destination'}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div style={{ padding: '2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <button
                    onClick={handleTransferClick}
                    disabled={isTransferring}
                    style={{
                        padding: '1rem 3rem',
                        borderRadius: '14px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        margin: '0 auto',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)',
                        transition: 'all 0.2s'
                    }}
                >
                    {isTransferring ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            TRANSFERRING DATA...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-play"></i>
                            START TRANSFER
                        </>
                    )}
                </button>

                {transferResults && (
                    <div style={{ marginTop: '2rem', textAlign: 'left', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Transfer Summary:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            {Object.entries(transferResults).map(([table, count]: [string, any]) => (
                                <div key={table} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>{table.replace('_', ' ')}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: count === -1 ? '#ef4444' : '#1e293b' }}>
                                        {count === -1 ? 'ERROR' : count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                title={`Confirm ${direction === 'main-to-local' ? 'Main → Local' : 'Local → Main'} Transfer`}
                message={`This will overwrite all data in the ${direction === 'main-to-local' ? 'Local' : 'Main'} database with data from the ${direction === 'main-to-local' ? 'Main' : 'Local'} database. This action cannot be undone.`}
                onConfirm={confirmTransfer}
                onCancel={() => setShowConfirm(false)}
                type="danger"
                confirmText="Yes, Start Transfer"
            />
        </div>
    );
}
