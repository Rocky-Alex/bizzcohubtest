import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { QRCodeCanvas } from 'qrcode.react';

interface QCItem {
    id: number;
    lot_id?: number | null;
    barcode?: string | null;
    sku: string | null;
    product_name: string;
    brand: string | null;
    model: string | null;
    series: string | null;
    ram: string | null;
    storage: string | null;
    graphics: string | null;
    screen_size: string | null;
    screen_resolution?: string | null;
    keyboard_type?: string | null;
    keyboard_backlit?: string | null;
    condition_status: string | null;
    status: string | null;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export default function QCInventory() {
    const [items, setItems] = useState<QCItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'mini' | 'detailed'>('mini');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/bch/inventory/qc', { cache: 'no-store' });
            const data = await response.json();
            if (data.success) {
                setItems(data.data);
            } else {
                setError(data.error || 'Failed to fetch data');
            }
        } catch (e) {
            console.error(e);
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString();
    };

    if (loading) return <div style={{ padding: '2rem' }}><LoadingSpinner /></div>;

    const renderMiniTable = () => (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>QR Code</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Product Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>SKU / Serial</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Specs</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Condition</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.id} style={{ borderBottom: index < items.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }}>
                            <td style={{ padding: '1rem', color: '#64748b' }}>#{item.id}</td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
                                    <div style={{ background: 'white', padding: '4px', borderRadius: '4px', display: 'flex', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                        <QRCodeCanvas
                                            value={`BCH-${999 + item.id}`}
                                            size={48}
                                            level={"H"}
                                            marginSize={0}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
                                        BCH-{999 + item.id}
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500 }}>
                                {item.product_name}
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>{item.brand} {item.model}</div>
                            </td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#334155' }}>{item.sku || '-'}</td>
                            <td style={{ padding: '1rem', color: '#334155' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {item.ram && <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{item.ram}</span>}
                                    {item.storage && <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{item.storage}</span>}
                                    {item.graphics && <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{item.graphics}</span>}
                                </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    background: '#f0f9ff',
                                    color: '#0369a1',
                                    fontWeight: 500
                                }}>
                                    {item.condition_status || 'Unknown'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    fontWeight: 600
                                }}>
                                    {item.status || 'Passed'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>{formatDate(item.created_at)}</td>
                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>{item.updated_at ? formatDate(item.updated_at) : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderDetailedTable = () => (
        <div style={{ overflow: 'auto', maxHeight: '70vh' }}>
            <table style={{ width: '100%', minWidth: '1500px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '60px' }}>ID</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '80px' }}>QR Code</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '100px' }}>Detailed ID</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '150px' }}>SKU / Serial</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '200px' }}>Product Name</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '100px' }}>Brand</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '100px' }}>Series</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '120px' }}>Model</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '80px' }}>RAM</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '80px' }}>Storage</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '150px' }}>Graphics</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '100px' }}>Display</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '120px' }}>Resolution</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '100px' }}>Keyboard</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '80px' }}>Backlit</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '120px' }}>Condition</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '120px' }}>Date</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '120px' }}>Updated</th>
                        <th style={{ padding: '0.8rem', textAlign: 'left', color: '#475569', fontWeight: 600, minWidth: '100px' }}>Updated By</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.id} style={{ borderBottom: index < items.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }}>
                            <td style={{ padding: '0.8rem', color: '#64748b' }}>#{item.id}</td>
                            <td style={{ padding: '0.8rem' }}>
                                <div style={{ background: 'white', padding: '2px', borderRadius: '4px', display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    <QRCodeCanvas
                                        value={`BCH-${999 + item.id}`}
                                        size={35}
                                        level={"H"}
                                        marginSize={0}
                                    />
                                </div>
                            </td>
                            <td style={{ padding: '0.8rem', color: '#334155', fontWeight: 600 }}>BCH-{999 + item.id}</td>
                            <td style={{ padding: '0.8rem', fontFamily: 'monospace', color: '#334155' }}>{item.sku || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#1e293b', fontWeight: 500 }}>{item.product_name}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.brand || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.series || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.model || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.ram || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.storage || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.graphics || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.screen_size || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.screen_resolution || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.keyboard_type || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#334155' }}>{item.keyboard_backlit || '-'}</td>
                            <td style={{ padding: '0.8rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '15px',
                                    fontSize: '0.75rem',
                                    background: '#f0f9ff',
                                    color: '#0369a1'
                                }}>
                                    {item.condition_status || 'Unknown'}
                                </span>
                            </td>
                            <td style={{ padding: '0.8rem', color: '#64748b', fontSize: '0.8rem' }}>{new Date(item.created_at).toLocaleString()}</td>
                            <td style={{ padding: '0.8rem', color: '#64748b', fontSize: '0.8rem' }}>{item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#64748b', fontSize: '0.8rem' }}>{item.updated_by || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ padding: '1rem', maxWidth: '100%', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                        Master Inventory
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: '8px' }}>
                        <button
                            onClick={() => setViewMode('mini')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                background: viewMode === 'mini' ? 'white' : 'transparent',
                                color: viewMode === 'mini' ? '#0f172a' : '#64748b',
                                borderRadius: '6px',
                                boxShadow: viewMode === 'mini' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem'
                            }}
                        >
                            Mini View
                        </button>
                        <button
                            onClick={() => setViewMode('detailed')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                background: viewMode === 'detailed' ? 'white' : 'transparent',
                                color: viewMode === 'detailed' ? '#0f172a' : '#64748b',
                                borderRadius: '6px',
                                boxShadow: viewMode === 'detailed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem'
                            }}
                        >
                            Detailed View
                        </button>
                    </div>

                    <button
                        onClick={fetchData}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        <i className="fas fa-sync-alt" style={{ marginRight: '0.5rem' }}></i> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {items.length === 0 && !error ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '12px' }}>
                    <i className="fas fa-box-open" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                    <p>No QC items found.</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    {viewMode === 'mini' ? renderMiniTable() : renderDetailedTable()}
                </div>
            )}
        </div>
    );
}
