"use client";

import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { QRCodeCanvas } from 'qrcode.react';
// import Barcode from 'react-barcode'; // User requested QR Code instead



interface PurchaseLot {
    lotId: number;
    lotNumber: string | null;
    supplierName: string;
    invoiceDate: string;
    invoiceNumber: string;
    totalItems?: number;
}

interface PurchaseLotItem {
    itemId: number;
    productName: string;
    sku: string | null;
    quantity: number;
    brand: string | null;
    model: string | null;
    series?: string | null;
    processor?: string | null;
    processorGen?: string | null;
    ram?: string | null;
    storage?: string | null;
    graphics?: string | null;
    qcCount?: number;
}

// Full product details based on DB schema
interface ProductDetails {
    id: number;
    product_code?: string;
    sku?: string;
    product_name: string;
    brand: string;
    series?: string;
    model: string;
    ram: string;
    storage: string;
    graphics_card?: string; // or graphics
    screen_size?: string;
    screen_resolution?: string;
    condition_status?: string;
    // Fields that might not map directly but are in UI req:
    keyboard_type?: string;
    keyboard_backlit?: string;

    [key: string]: any;
}

export default function QCChecking() {
    const [lots, setLots] = useState<PurchaseLot[]>([]);
    const [selectedLotId, setSelectedLotId] = useState<string>('');
    const [lotItems, setLotItems] = useState<PurchaseLotItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<PurchaseLotItem | null>(null);

    const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
    const [loadingLots, setLoadingLots] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Print Modal State
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printData, setPrintData] = useState<any>(null); // Data to print
    const [copyCount, setCopyCount] = useState<number>(1);
    const printRef = useRef<HTMLDivElement>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<ProductDetails>>({});
    // Track which fields are currently editable
    const [editableFields, setEditableFields] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchLots();
    }, []);

    useEffect(() => {
        if (selectedLotId) {
            fetchLotItems(selectedLotId);
            setSelectedItem(null);
            setProductDetails(null);
            setFormData({});
        } else {
            setLotItems([]);
            setSelectedItem(null);
        }
    }, [selectedLotId]);

    useEffect(() => {
        if (selectedItem?.sku) {
            fetchProductDetails(selectedItem.sku);
        } else if (selectedItem) {
            // No SKU, maybe just init form with available item info
            setProductDetails(null);
            setFormData({
                brand: selectedItem.brand || '',
                model: selectedItem.model || '',
                series: selectedItem.series || '',
                processor: selectedItem.processor || '',
                processor_gen: selectedItem.processorGen || '',
                ram: selectedItem.ram || '',
                storage: selectedItem.storage || '',
                graphics_card: selectedItem.graphics || '',
                product_name: selectedItem.productName
            });
        }
    }, [selectedItem]);

    const fetchLots = async () => {
        try {
            const response = await fetch('/api/admin/inventory/purchase-lots', { cache: 'no-store' });
            const data = await response.json();
            if (data.success) {
                setLots(data.lots);
            }
        } catch (error) {
            console.error('Error fetching lots:', error);
        } finally {
            setLoadingLots(false);
        }
    };

    const fetchLotItems = async (id: string) => {
        setLoadingItems(true);
        try {
            const response = await fetch(`/api/admin/inventory/purchase-lots/details?id=${id}`, { cache: 'no-store' });
            const data = await response.json();
            if (data.success && data.lot) {
                setLotItems(data.lot.items);
            }
        } catch (error) {
            console.error('Error fetching lot items:', error);
        } finally {
            setLoadingItems(false);
        }
    };

    const fetchProductDetails = async (sku: string) => {
        setLoadingDetails(true);
        try {
            const response = await fetch(`/api/admin/inventory/products?sku=${sku}`);
            if (response.ok) {
                const product = await response.json();
                setProductDetails(product);
                // Map DB fields to Form Data
                setFormData({
                    ...product,
                    // Ensure text fields are strings
                    brand: product.brand || '',
                    series: product.series || '',
                    model: product.model || '',
                    ram: product.ram || '',
                    storage: product.storage || '',
                    graphics_card: product.graphics_card || product.graphics || '',
                    sku: product.sku || product.product_code || '',
                    screen_size: product.screen_size || '',
                    screen_resolution: product.screen_resolution || '',
                    condition_status: product.condition_status || '',
                    // Flatten optional fields or handle extras
                    keyboard_type: product.keyboard_type || '', // Not in DB schema yet
                    keyboard_backlit: product.keyboard_backlit || '',
                });
            } else {
                console.warn("Product details not found by SKU");
                // Fallback to item details
                if (selectedItem) {
                    setFormData({
                        brand: selectedItem.brand || '',
                        model: selectedItem.model || '',
                        series: selectedItem.series || '',
                        processor: selectedItem.processor || '',
                        processor_gen: selectedItem.processorGen || '',
                        ram: selectedItem.ram || '',
                        storage: selectedItem.storage || '',
                        graphics_card: selectedItem.graphics || '',
                        product_name: selectedItem.productName,
                        sku: selectedItem.sku || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching product details', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleEditToggle = (field: string) => {
        setEditableFields(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Modified handleSubmit
    const handleSubmit = async () => {
        if (!selectedLotId || !selectedItem) {
            alert("Please select a Purchase Lot and Product.");
            return;
        }
        setSaving(true);
        try {
            console.log("Submitting QC Check...");
            // Prepare payload
            const payload = {
                // IDs to link back
                lotId: parseInt(selectedLotId),
                productId: productDetails?.id || null, // Allow null if product missing in master
                purchaseLotItemId: selectedItem.itemId, // Send the item ID to track count

                // Ensure proper field mapping for API
                productName: formData.product_name || selectedItem.productName,
                sku: formData.sku || selectedItem.sku, // Explicitly map SKU

                // Form Data
                ...formData
            };

            console.log("Payload:", payload);

            // Post to QC Inventory
            const res = await fetch('/api/admin/inventory/qc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const responseData = await res.json();
                setResultMessage({ type: 'success', text: 'Saved to Database Successfully! ✅' });

                // Calculate sequential number starting from 1000
                // Assuming ID starts at 1, we want 1000, 1001, 1002...
                // So: 999 + insertedId
                const seqNumber = responseData.insertedId ? (999 + responseData.insertedId) : 1000;
                const barcodeVal = seqNumber.toString();

                const selectedLot = lots.find(l => l.lotId.toString() === selectedLotId);
                const lotNumber = selectedLot?.lotNumber || `Lot #${selectedLotId}`;

                setPrintData({
                    ...payload,
                    barcodeValue: barcodeVal,
                    lotNumber: lotNumber, // Pass the actual Lot Number
                    // generatedId for vertical text
                    generatedId: `List-${payload.lotId}-${payload.productId || 'GEN'}-${seqNumber}`
                });
                setShowPrintModal(true);

                setEditableFields({});
                fetchLotItems(selectedLotId); // Refresh the list to update counts/filter dropdown
                // setTimeout removed to keep modal open for confirmation
            } else {
                const err = await res.json();
                console.error("QC Submit Error:", err);
                setResultMessage({ type: 'error', text: `Failed to save: ${err.error || 'Unknown error'}` });
            }
        } catch (e) {
            console.error("Submit Exception:", e);
            setResultMessage({ type: 'error', text: 'Error submitting QC check.' });
        } finally {
            setSaving(false);
        }
    };

    // Render Helper
    const renderField = (label: string, fieldKey: string, placeholder: string = "") => {
        const isEditing = editableFields[fieldKey];
        const value = formData[fieldKey as keyof typeof formData] || '';

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <label style={{ width: '150px', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{label}</label>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                        disabled={!isEditing}
                        placeholder={placeholder || `Auto Fetching ${label}`}
                        style={{
                            flex: 1,
                            padding: '0.6rem 1rem',
                            borderRadius: '10px', // Updated to 10px
                            border: '1px solid #cbd5e1',
                            outline: 'none',
                            color: '#334155',
                            backgroundColor: isEditing ? 'white' : '#f8fafc',
                            transition: 'all 0.2s',
                            boxShadow: isEditing ? '0 0 0 2px rgba(37,99,235,0.1)' : 'none'
                        }}
                    />
                    <button
                        onClick={() => handleEditToggle(fieldKey)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '6px',
                            background: '#0ea5e9', // Light blue link button
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        {isEditing ? 'Done' : 'Edit'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '2rem' }}>QC Checking</h2>

            {/* Top Selection Row */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <select
                        value={selectedLotId}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            outline: 'none',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="">-- Select a Purchase Lot --</option>
                        {lots.map(lot => (
                            <option key={lot.lotId} value={lot.lotId}>
                                {lot.lotNumber || `Lot #${lot.lotId}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                    <select
                        value={selectedItem?.itemId || ''}
                        onChange={(e) => {
                            const item = lotItems.find(i => i.itemId.toString() === e.target.value);
                            setSelectedItem(item || null);
                        }}
                        disabled={!selectedLotId || lotItems.length === 0}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            outline: 'none',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="">-- Select Products --</option>
                        {lotItems.filter(item => (item.qcCount || 0) < item.quantity).map(item => (
                            <option key={item.itemId} value={item.itemId}>
                                {item.productName} (Qty: {item.quantity - (item.qcCount || 0)})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product Details Section */}
            {selectedItem && (
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Product Details</h3>

                    {loadingDetails ? (
                        <div style={{ padding: '2rem' }}><LoadingSpinner /></div>
                    ) : (
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem 4rem' }}>
                                {/* Left Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {renderField('Brand', 'brand')}
                                    {renderField('Series', 'series')}
                                    {renderField('Model', 'model')}
                                    {renderField('Processor', 'processor')}
                                    {renderField('Processor Gen', 'processor_gen')}
                                    {renderField('Memory', 'ram')}
                                    {renderField('Storage', 'storage')}
                                </div>

                                {/* Right Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {renderField('Graphics', 'graphics_card')}
                                    {renderField('Serial Number', 'sku')}
                                    {renderField('Display Size', 'screen_size')}
                                    {renderField('Display Resolution', 'screen_resolution')}
                                    {renderField('Keyboard Type', 'keyboard_type')}
                                    {renderField('Keyboard Backlit', 'keyboard_backlit')}
                                    {renderField('Working Condition', 'condition_status')}
                                </div>
                            </div>

                            {/* Submit Button Area */}
                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                                {resultMessage && (
                                    <div style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        width: '100vw',
                                        height: '100vh',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        zIndex: 9999,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <div style={{
                                            background: 'white',
                                            padding: '2rem',
                                            borderRadius: '16px',
                                            maxWidth: '400px',
                                            width: '90%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                            animation: 'scaleIn 0.2s ease-out'
                                        }}>
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '50%',
                                                background: resultMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.75rem',
                                                marginBottom: '1rem',
                                                color: resultMessage.type === 'success' ? '#166534' : '#991b1b'
                                            }}>
                                                <i className={`fas ${resultMessage.type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                                            </div>

                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                                {resultMessage.type === 'success' ? 'Success!' : 'Error'}
                                            </h3>

                                            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                                {resultMessage.text}
                                            </p>

                                            <button
                                                onClick={() => setResultMessage(null)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: '#0f172a',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                {resultMessage.type === 'success' ? 'Continue' : 'Close'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    style={{
                                        padding: '0.8rem 2.5rem',
                                        background: '#0f172a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        opacity: saving ? 0.7 : 1
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Print Label Modal */}
            {showPrintModal && printData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '600px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>Print Barcode Label</h3>

                        {/* Label Preview Area */}
                        <div ref={printRef} className="print-label-container" style={{
                            border: '1px solid #000', borderRadius: '10px', padding: '1rem',
                            display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', height: '220px',
                            boxSizing: 'border-box', backgroundColor: 'white', overflow: 'hidden'
                        }}>
                            {/* Top: Product Title */}
                            <h4 style={{ margin: '0 0 0.5rem 0.9rem', fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.2, color: '#000', width: '100%' }}>
                                {printData.productName} with Backlit
                            </h4>

                            {/* Bottom Content Row */}
                            <div style={{ display: 'flex', flex: 1, width: '100%', alignItems: 'center' }}>
                                {/* Left: QR Code */}
                                <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <QRCodeCanvas
                                        value={printData.barcodeValue}
                                        size={110}
                                    />
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem', textAlign: 'left', color: '#000' }}>
                                        Bar Code : {printData.barcodeValue}
                                    </div>
                                </div>

                                {/* Middle: Details */}
                                <div style={{ flex: 1, paddingLeft: '1rem', paddingRight: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '1rem', lineHeight: 2, color: '#000', fontWeight: 600 }}>
                                        <div>Display Size : {printData.screen_size} Inches</div>
                                        <div>RAM : {printData.ram}</div>
                                        <div>SSD : {printData.storage}</div>
                                        <div>GPU : {printData.graphics_card}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Vertical Text */}
                            <div style={{
                                position: 'absolute', right: '-25px', top: '50%',
                                transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center',
                                whiteSpace: 'nowrap', fontSize: '1.2rem', fontWeight: 700, color: '#000'
                            }}>
                                {printData.lotNumber}
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Copies:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={copyCount}
                                    onChange={(e) => setCopyCount(parseInt(e.target.value) || 1)}
                                    style={{ width: '60px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <button
                                onClick={() => setShowPrintModal(false)}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Trigger Print Logic
                                    const style = document.createElement('style');
                                    style.innerHTML = `
                                        @media print {
                                            body * { visibility: hidden; }
                                            .print-label-container, .print-label-container * { visibility: visible; }
                                            .print-label-container { 
                                                position: absolute; left: 0; top: 0; margin: 0; 
                                                width: 100% !important; height: auto !important; border: none !important;
                                            }
                                        }
                                    `;
                                    document.head.appendChild(style);
                                    window.print();
                                    document.head.removeChild(style);
                                }}
                                style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Print Label
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

