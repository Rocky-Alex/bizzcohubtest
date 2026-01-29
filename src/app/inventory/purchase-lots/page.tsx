"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PurchaseLotsPage() {
    const [lots, setLots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchLots();
    }, []);

    const fetchLots = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory/purchase-lots');
            if (res.ok) {
                const data = await res.json();
                // Sort by desc createdAt
                setLots(Array.isArray(data) ? data.reverse() : []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load purchase lots');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/inventory/purchase-lots', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Successfully uploaded ${data.rowsProcessed} items`);
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                fetchLots();
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch (e) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <Link href="/inventory" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>←</span> Back to Inventory
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Purchase Lot Inventory</h1>
                    <p style={{ color: '#94a3b8' }}>Upload excel sheets of shipment details.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#1e293b', padding: '10px 20px', borderRadius: '12px' }}>
                    <input
                        id="file-upload"
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        style={{ color: '#cbd5e1' }}
                        accept=".xlsx, .xls, .csv"
                    />
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !file}
                        style={{
                            padding: '10px 24px',
                            background: uploading || !file ? '#334155' : 'linear-gradient(90deg, #007aff, #00b4ff)',
                            border: 'none',
                            borderRadius: '8px',
                            color: uploading || !file ? '#94a3b8' : 'white',
                            fontWeight: 'bold',
                            cursor: (uploading || !file) ? 'not-allowed' : 'pointer',
                            opacity: (uploading || !file) ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {uploading ? 'Processing...' : 'Upload Excel'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#334155', textAlign: 'left' }}>
                            <th style={{ padding: '16px' }}>Invoice Date</th>
                            <th style={{ padding: '16px' }}>Supplier</th>
                            <th style={{ padding: '16px' }}>Invoice Number</th>
                            <th style={{ padding: '16px' }}>Total Cost</th>
                            <th style={{ padding: '16px' }}>System Date</th>
                            <th style={{ padding: '16px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    Loading data...
                                </td>
                            </tr>
                        ) : lots.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No purchase lots found. Upload an Excel sheet to get started.
                                </td>
                            </tr>
                        ) : (
                            lots.map((lot) => (
                                <tr key={lot.lotId} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '16px' }}>
                                        {new Date(lot.invoiceDate).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{lot.supplierName}</td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>{lot.invoiceNumber}</td>
                                    <td style={{ padding: '16px', color: '#4ade80' }}>
                                        ${Number(lot.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '0.9em' }}>
                                        {new Date(lot.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <Link href={`/inventory/purchase-lots/${lot.lotId}`}>
                                            <button style={{
                                                padding: '6px 12px',
                                                background: 'transparent',
                                                border: '1px solid #64748b',
                                                borderRadius: '6px',
                                                color: '#cbd5e1',
                                                cursor: 'pointer'
                                            }}>
                                                View Items
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
