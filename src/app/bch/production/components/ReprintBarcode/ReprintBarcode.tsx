"use client";

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface LabelConfig {
    unit: 'cm' | 'mm' | 'in';
    width: number;
    height: number;
    borderRadius: number;
    showBorder: boolean;
    productNameSize: number;
    productNamePos: { x: number; y: number };
    productNameWidth: number;
    barcodeScale: number;
    barcodeHeight: number;
    barcodeFontSize: number;
    barcodePos: { x: number; y: number };
    barcodeTextPos?: { x: number; y: number };
    barcodeTextFontSize?: number;
    specsFontSize: number;
    specsLineHeight: number;
    specsPos: { x: number; y: number };
    lotFontSize: number;
    lotPos: { x: number; y: number };
}

interface ItemDetails {
    productName: string;
    ram: string;
    storage: string;
    display: string; // display or screen_size
    gpu: string; // graphics_card
    lotNumber: string;
    barcodeValue: string;
    // other fields
    [key: string]: any;
}

export default function ReprintBarcode() {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [itemData, setItemData] = useState<ItemDetails | null>(null);
    const [config, setConfig] = useState<LabelConfig | null>(null);

    const printRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load Label Configuration
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/bch/label-settings?name=default_label', { cache: 'no-store' });
                const data = await res.json();
                if (data.success && data.config) {
                    const defaults: any = {
                        unit: 'cm', width: 10, height: 6, borderRadius: 0, showBorder: true,
                        productNameSize: 14, productNamePos: { x: 0.5, y: 0.5 }, productNameWidth: 9,
                        barcodeScale: 1.5, barcodeHeight: 40, barcodeFontSize: 12, barcodePos: { x: 0.5, y: 2.5 },
                        barcodeTextPos: { x: 0.5, y: 3.8 }, barcodeTextFontSize: 8,
                        specsFontSize: 10, specsLineHeight: 1.4, specsPos: { x: 5.5, y: 2.5 },
                        lotFontSize: 12, lotPos: { x: 5.5, y: 5.0 }
                    };
                    setConfig({ ...defaults, ...data.config, unit: data.config.unit || 'cm' });
                }
            } catch (error) {
                console.error("Failed to load label settings:", error);
            }
        };
        fetchConfig();
        // Focus input on mount
        inputRef.current?.focus();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        setLoading(true);
        setItemData(null);

        try {
            const res = await fetch(`/api/bch/inventory/barcode?barcode=${encodeURIComponent(barcodeInput.trim())}`);
            const data = await res.json();

            if (data.success) {
                const item = data.item;
                setItemData({
                    productName: item.productName,
                    ram: item.ram || '',
                    storage: item.storage || '',
                    display: item.screen_size || '',
                    gpu: item.graphics_card || '',
                    lotNumber: item.lotNumber,
                    barcodeValue: item.barcodeValue
                });
                toast.success('Barcode found!');
            } else {
                toast.error(data.error || 'Barcode not found');
            }
        } catch (error) {
            console.error('Error searching barcode:', error);
            toast.error('Failed to search barcode');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!config || !itemData) return;

        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * { visibility: hidden; }
                .reprint-label-preview, .reprint-label-preview * { visibility: visible; }
                .reprint-label-preview {
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    z-index: 2147483647 !important;
                    margin: 0 !important;
                    width: ${config.width}${config.unit} !important;
                    height: ${config.height}${config.unit} !important;
                    border: ${config.showBorder ? '1px solid #000' : 'none'} !important;
                    border-radius: ${config.borderRadius}px !important;
                    background-color: white !important;
                    overflow: hidden !important;
                }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);

        toast.success('Printed successfully');
        setBarcodeInput('');
        setItemData(null);
        inputRef.current?.focus();
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Reprint Barcode</h1>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            placeholder="Scan or enter Barcode (e.g. BCH-1004)"
                            style={{
                                flex: 1,
                                padding: '1rem',
                                fontSize: '1.2rem',
                                borderRadius: '8px',
                                border: '2px solid #e2e8f0',
                                fontWeight: 700
                            }}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0 2rem',
                                background: '#3b82f6',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: loading ? 'wait' : 'pointer'
                            }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>

                {itemData && config && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', animation: 'fadeIn 0.3s' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Start Printing?</h3>
                            <p style={{ color: '#64748b' }}>Found: <strong>{itemData.productName}</strong></p>
                        </div>

                        {/* Preview Container - Hidden visually normally but used for layout preview if desired, 
                            but crucial for 'ref' to print. We show a scaled down version or actual size. */}
                        <div style={{ border: '1px dashed #cbd5e1', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div
                                ref={printRef}
                                className="reprint-label-preview"
                                style={{
                                    width: `${config.width}${config.unit}`,
                                    height: `${config.height}${config.unit}`,
                                    border: config.showBorder ? '1px solid #000' : 'none',
                                    borderRadius: `${config.borderRadius}px`,
                                    backgroundColor: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                }}
                            >
                                {/* Product Name */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${config.productNamePos.x}${config.unit}`,
                                    top: `${config.productNamePos.y}${config.unit}`,
                                    width: `${config.productNameWidth}${config.unit}`,
                                    fontSize: `${config.productNameSize}pt`,
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                    textTransform: 'uppercase',
                                    color: '#000',
                                    wordWrap: 'break-word'
                                }}>
                                    {itemData.productName}
                                </div>

                                {/* QR Code */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${config.barcodePos.x}${config.unit}`,
                                    top: `${config.barcodePos.y}${config.unit}`,
                                    transformOrigin: 'top left'
                                }}>
                                    <div style={{ transform: 'scale(1)' }}>
                                        <QRCodeSVG
                                            value={itemData.barcodeValue}
                                            size={config.barcodeHeight}
                                            level={"H"}
                                            includeMargin={false}
                                        />
                                    </div>
                                </div>

                                {/* QR Code Text */}
                                {config.barcodeTextPos && (
                                    <div style={{
                                        position: 'absolute',
                                        left: `${config.barcodeTextPos.x}${config.unit}`,
                                        top: `${config.barcodeTextPos.y}${config.unit}`,
                                        fontSize: `${config.barcodeTextFontSize || 8}pt`,
                                        fontWeight: 700,
                                        color: '#000'
                                    }}>
                                        {itemData.barcodeValue}
                                    </div>
                                )}

                                {/* Specs */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${config.specsPos.x}${config.unit}`,
                                    top: `${config.specsPos.y}${config.unit}`,
                                    fontSize: `${config.specsFontSize}pt`,
                                    lineHeight: config.specsLineHeight,
                                    fontWeight: 700,
                                    color: '#000'
                                }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>DISPLAY:</span> {itemData.display}"
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>MEMORY:</span> {itemData.ram}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>STORAGE:</span> {itemData.storage}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>GPU:</span> {itemData.gpu}
                                    </div>
                                </div>

                                {/* Lot Number */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${config.lotPos.x}${config.unit}`,
                                    top: `${config.lotPos.y}${config.unit}`,
                                    fontSize: `${config.lotFontSize}pt`,
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    color: '#000'
                                }}>
                                    LOT: {itemData.lotNumber}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handlePrint}
                                style={{
                                    padding: '1rem 3rem',
                                    background: '#10b981',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <i className="fas fa-print"></i> Print Sticker
                            </button>
                            <button
                                onClick={() => { setItemData(null); setBarcodeInput(''); inputRef.current?.focus(); }}
                                style={{
                                    padding: '1rem 2rem',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
