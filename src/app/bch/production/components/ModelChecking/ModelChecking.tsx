'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

interface MasterItem {
    id: number;
    product_name: string;
    brand: string;
    series: string;
    model: string;
    sku: string;
    serial_number: string;
    barcode: string;
    lot_number: string;
    processor: string;
    generation: string;
    condition_status: string;
    qc_status: string;
    unit_cost: number;
    selling_price: number;
    created_at: string;
}

interface PurchaseItem {
    id: number;
    product_name: string;
    quantity: number;
    qc_count: number;
    unit_cost: number;
    selling_price: number;
    lot_number: string;
    supplier_name: string;
    lot_status: string;
    created_at: string;
}

export default function ModelChecking() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ master: MasterItem[], purchase: PurchaseItem[] } | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults(null);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/bch/production/model-check?query=${encodeURIComponent(searchQuery.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            } else {
                toast.error('Search failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error searching');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setResults(null);
            return;
        }

        // Only auto-search if not actively scanning to prevent erratic behavior
        if (!isScanning) {
            debounceRef.current = setTimeout(() => {
                performSearch(query);
            }, 400);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, isScanning]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current && isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [isScanning]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        performSearch(query);
    };

    const startScanner = async () => {
        setIsScanning(true);
        // Small delay to ensure the modal DOM element is rendered
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" }, // Prioritize back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        // SUCCESSFUL SCAN
                        setQuery(decodedText);
                        stopScanner();
                        // Instantly trigger search using the decoded text directly
                        performSearch(decodedText);
                        toast.success('Barcode detected!');
                    },
                    (error) => {
                        // Ignore standard scan failures (it scans constantly)
                    }
                );
            } catch (err) {
                console.error("Error starting scanner:", err);
                toast.error("Failed to start camera. Please ensure permissions are granted.");
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
        setIsScanning(false);
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
            {/* Fullscreen Scanner Modal */}
            {isScanning && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                        <button
                            onClick={stopScanner}
                            style={{
                                position: 'absolute', top: '-40px', right: '10px',
                                background: 'transparent', border: 'none', color: 'white',
                                fontSize: '2rem', cursor: 'pointer', zIndex: 10000
                            }}
                        >
                            &times;
                        </button>
                        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '1rem' }}>Scan Barcode / QR Code</h3>
                        {/* The DIV where the camera stream injects */}
                        <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'black' }}></div>
                        <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '1rem', padding: '0 20px' }}>
                            Point your device camera at a barcode. It will scan automatically.
                        </p>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                    Model Checking
                </h2>
                <p style={{ color: '#6b7280' }}>Search across Inventory and Purchase Lots to verify stock status.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', maxWidth: '700px', margin: '0 auto 2rem' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by Model, SKU, Serial, or Lot..."
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '1rem',
                                outline: 'none',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        />
                        {loading && (
                            <i className="fas fa-circle-notch fa-spin" style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af'
                            }}></i>
                        )}
                    </div>
                    {/* Scan Button */}
                    <button
                        type="button"
                        onClick={startScanner}
                        style={{
                            padding: '0 1.25rem',
                            background: '#f3f4f6',
                            color: '#1f2937',
                            border: '1px solid #d1d5db',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        title="Scan Barcode"
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    >
                        <i className="fas fa-qrcode" style={{ fontSize: '1.25rem' }}></i>
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                    Search
                </button>
            </form>

            {/* Results */}
            {results && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Total Summary */}
                    {/* Total Summary */}
                    <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                        <h3 style={{ margin: 0, color: '#0369a1', fontSize: '1.2rem', fontWeight: 600 }}>Total Quantity Found</h3>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 800, color: '#0c4a6e' }}>
                            {results.master.length + results.purchase.reduce((acc, item) => acc + Number(item.quantity), 0)}
                        </p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#0284c7' }}>
                            ({results.master.length} in Active Inventory + {results.purchase.reduce((acc, item) => acc + Number(item.quantity), 0)} in Purchase Lots)
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                        {/* 1. Master Inventory Table */}
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#065f46', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-boxes"></i> Active Inventory (Master)
                                <span style={{ fontSize: '0.8rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px' }}>{results.master.length} Items</span>
                            </h3>

                            {results.master.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #e5e7eb', color: '#9ca3af' }}>
                                    No matches in active inventory.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Lot Number</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Brand</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Series</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Model</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Barcode</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Core</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Gen</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Cost</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Selling</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.master.map((item, idx) => (
                                                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 500 }}>{item.lot_number || '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                                                        {item.brand || item.product_name || '-'}
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{item.sku}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.series || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.model || '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#10b981' }}>{item.barcode || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.processor || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.generation || '-'}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f3f4f6', color: '#4b5563' }}>
                                                            {item.condition_status || 'Used'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.unit_cost ? `AED ${Number(item.unit_cost).toFixed(2)}` : '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>{item.selling_price ? `AED ${Number(item.selling_price).toFixed(2)}` : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 2. Purchase Lots Table */}
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#d97706', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-truck-loading"></i> In Purchase Lots (Incoming)
                                <span style={{ fontSize: '0.8rem', background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '12px' }}>{results.purchase.length} Batches</span>
                            </h3>

                            {results.purchase.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #e5e7eb', color: '#9ca3af' }}>
                                    No matches in purchase lots.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Lot Number</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Supplier</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Product Name</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Core</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Gen</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Total Qty</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Cost Price</th>
                                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Selling</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.purchase.map((item: any) => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 500 }}>{item.lot_number}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.supplier_name}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{item.product_name}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.processor || '-'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.processor_gen || '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>
                                                        {item.quantity}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: '4px' }}>
                                                            ({item.qc_count} QC)
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                                                            {item.lot_status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.unit_cost ? `AED ${Number(item.unit_cost).toFixed(2)}` : '-'}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>{item.selling_price ? `AED ${Number(item.selling_price).toFixed(2)}` : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
