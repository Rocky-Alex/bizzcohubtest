"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface SoldItem {
    id: number;
    barcode: string;
    product_name: string;
    brand: string;
    model: string;
    lot_number: string;
    qty_sold: number;
    sold_at: string;
    customer_name: string | null;
}

export default function SalesReturn() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SoldItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Map<number, SoldItem>>(new Map());
    const [returnReason, setReturnReason] = useState('');
    const [condition, setCondition] = useState('Good');
    const [submitting, setSubmitting] = useState(false);

    // Staging List
    const [returnInventory, setReturnInventory] = useState<any[]>([]);
    const [invLoading, setInvLoading] = useState(false);

    // Scanner
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const performSearch = async (val: string) => {
        if (!val.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            // Reusing soldout search but filtering for non-returned items
            const res = await fetch(`/api/bch/inventory/soldout/lookup?query=${encodeURIComponent(val)}&availableOnly=true`);
            if (res.ok) {
                const data = await res.json();
                // Filter the 'history' part of the response or if the API returns direct items
                setResults(data.history || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReturnInventory = async () => {
        setInvLoading(true);
        try {
            const res = await fetch('/api/bch/sales/returns');
            const data = await res.json();
            if (data.success) setReturnInventory(data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setInvLoading(false);
        }
    };

    useEffect(() => {
        fetchReturnInventory();
    }, []);

    const toggleSelect = (item: SoldItem) => {
        setSelectedItems(prev => {
            const next = new Map(prev);
            if (next.has(item.id)) next.delete(item.id);
            else next.set(item.id, item);
            return next;
        });
    };

    const handleReturnSubmit = async () => {
        if (selectedItems.size === 0) return;
        setSubmitting(true);
        const toastId = toast.loading('Recording returns...');

        try {
            const res = await fetch('/api/bch/sales/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: Array.from(selectedItems.values()),
                    reason: returnReason,
                    condition: condition,
                    returnedBy: 'Admin'
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Items moved to Return Staging', { id: toastId });
                setSelectedItems(new Map());
                setReturnReason('');
                setQuery('');
                setResults([]);
                fetchReturnInventory();
            } else {
                toast.error(data.error || 'Return failed', { id: toastId });
            }
        } catch (err) {
            toast.error('Unexpected error', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const startScanner = async () => {
        setIsScanning(true);
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("return-reader");
                scannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        setQuery(decodedText);
                        stopScanner();
                        performSearch(decodedText);
                    },
                    () => { }
                );
            } catch (err) {
                console.error(err);
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            
            {isScanning && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <div id="return-reader" style={{ background: 'black', borderRadius: '12px' }}></div>
                        <button onClick={stopScanner} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem' }}>
                        <i className="fas fa-undo-alt"></i>
                    </div>
                    Sales Return
                </h2>
                <p style={{ color: '#64748b', marginTop: '0.25rem', marginLeft: '56px' }}>Scan or search sold items to initiate a return and staging for QC</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
                
                {/* Left Side: Search & Selection */}
                <div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                            <input 
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    if(e.target.value.length > 2) performSearch(e.target.value);
                                }}
                                placeholder="Scan Barcode or Serial Number..."
                                style={{
                                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem',
                                    borderRadius: '12px', border: '1px solid #e2e8f0',
                                    background: 'white', outline: 'none', fontSize: '1rem'
                                }}
                            />
                        </div>
                        <button onClick={startScanner} style={{ padding: '0 1.5rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                            <i className="fas fa-barcode"></i>
                        </button>
                    </div>

                    {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><LoadingSpinner /></div>}

                    {results.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>SEARCH RESULTS</div>
                            {results.map(item => (
                                <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.product_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Barcode: {item.barcode} | Sold to: {item.customer_name || 'Direct Sale'}</div>
                                    </div>
                                    <button 
                                        onClick={() => toggleSelect(item)}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '8px', 
                                            background: selectedItems.has(item.id) ? '#3b82f6' : 'white',
                                            color: selectedItems.has(item.id) ? 'white' : '#3b82f6',
                                            border: '1px solid #3b82f6', cursor: 'pointer', fontWeight: 600
                                        }}
                                    >
                                        {selectedItems.has(item.id) ? 'Selected' : 'Return'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pending Return Table */}
                    <div style={{ marginTop: '3rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Return Staging (Pending QC)</h3>
                        {invLoading ? <LoadingSpinner /> : (
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc', textAlign: 'left' }}>
                                        <tr>
                                            <th style={{ padding: '1rem' }}>Product</th>
                                            <th style={{ padding: '1rem' }}>Barcode</th>
                                            <th style={{ padding: '1rem' }}>Condition</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnInventory.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>{item.product_name}</td>
                                                <td style={{ padding: '1rem' }}>{item.barcode}</td>
                                                <td style={{ padding: '1rem' }}>{item.condition_at_return}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: '#fef3c7', color: '#92400e' }}>{item.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {returnInventory.length === 0 && (
                                            <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No items in return staging</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Return Details & Submit */}
                <div>
                    <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', position: 'sticky', top: '20px' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Return Details</h4>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Return Reason</label>
                            <textarea 
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                placeholder="Why is this being returned?"
                                style={{ width: '100%', height: '80px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Received Condition</label>
                            <select 
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option>Good</option>
                                <option>Scratched</option>
                                <option>Damaged</option>
                                <option>Faulty</option>
                            </select>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: '#64748b' }}>Items Selected:</span>
                                <span style={{ fontWeight: 700 }}>{selectedItems.size}</span>
                            </div>
                            <button 
                                onClick={handleReturnSubmit}
                                disabled={selectedItems.size === 0 || submitting}
                                style={{
                                    width: '100%', padding: '0.85rem', borderRadius: '12px',
                                    background: selectedItems.size > 0 ? '#1e293b' : '#94a3b8',
                                    color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                {submitting ? <i className="fas fa-circle-notch fa-spin"></i> : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

