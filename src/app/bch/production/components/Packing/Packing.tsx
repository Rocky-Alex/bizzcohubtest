'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PackingListPDF from '@/components/packing/PackingListPDF';
import "../../../styles/admin.css";
import "../../../styles/dashboard.css";
import { toast } from 'sonner';

// Define Types
interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    items: any[];
}

interface PackingItem {
    id: number;
    product_name: string;
    sku: string;
    barcode?: string;
    ram?: string;
    storage?: string;
    quantity: number;
    qc_id?: number;
    image?: string;
    scanned_at: Date;
    // New fields for PDF
    brand?: string;
    model?: string;
    series?: string;
    processor?: string;
    processor_gen?: string;
}

interface PackedBox {
    id: number;
    box_number: number;
    box_type: string;
    items: PackingItem[];
    isLocal?: boolean;
}

const BOX_TYPES = ['Single Box', '5 Pieces Box', '10 Pieces Box', 'Plastic Bag'];

const BOX_LIMITS: Record<string, number> = {
    'Single Box': 1,
    '5 Pieces Box': 5,
    '10 Pieces Box': 10,
    'Plastic Bag': Infinity
};

export default function Packing() {
    // State
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [boxType, setBoxType] = useState<string>(BOX_TYPES[0]);

    // Packing State
    const [currentBoxNumber, setCurrentBoxNumber] = useState(1);
    const [currentBoxItems, setCurrentBoxItems] = useState<PackingItem[]>([]);
    const [packedHistory, setPackedHistory] = useState<PackedBox[]>([]);

    // Barcode State
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scanQueue, setScanQueue] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Process Queue
    useEffect(() => {
        const processQueue = async () => {
            if (scanQueue.length === 0 || isProcessing) return;

            setIsProcessing(true);
            const code = scanQueue[0];

            try {
                // Try searching in QC first
                let productData: Partial<PackingItem> | null = null;
                const res = await fetch(`/api/bch/inventory/qc?sku=${encodeURIComponent(code)}`);

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data && data.data.length > 0) {
                        const item = data.data[0];
                        productData = {
                            product_name: item.product_name,
                            sku: item.sku,
                            barcode: item.barcode || item.generatedId || `BCH-${999 + item.id}`,
                            ram: item.ram || item.product_ram || '',
                            storage: item.storage || item.product_storage || '',
                            qc_id: item.id,
                            image: '/placeholder.svg',
                            brand: item.brand,
                            model: item.model,
                            series: item.series,
                            processor: item.processor,
                            processor_gen: item.processor_gen
                        };
                    }
                }

                // Fallback to Products
                if (!productData) {
                    const res2 = await fetch(`/api/products?code=${encodeURIComponent(code)}`);
                    if (res2.ok) {
                        const data2 = await res2.json();
                        if (data2.product) {
                            const p = data2.product;
                            productData = {
                                product_name: p.name,
                                sku: p.productCode || code,
                                barcode: '',
                                ram: p.specifications?.RAM || '',
                                storage: p.specifications?.Storage || '',
                                qc_id: undefined,
                                image: p.images && p.images.length > 0 ? p.images[0] : '/placeholder.svg'
                            };
                        }
                    }
                }

                if (productData) {
                    const success = addItemToBox(productData);
                    if (success) {
                        toast.success(`Added ${productData.product_name}`);
                    }
                } else {
                    toast.error(`Product not found: ${code}`);
                }

            } catch (error) {
                console.error("Scan error:", error);
                toast.error(`Error scanning ${code}`);
            } finally {
                setScanQueue(prev => prev.slice(1));
                setIsProcessing(false);
            }
        };

        processQueue();
    }, [scanQueue, isProcessing, currentBoxItems, boxType]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/bch/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to fetch orders");
        }
    };

    const handleOrderSelect = async (orderIdString: string) => {
        const orderId = orderIdString;
        setSelectedOrderId(orderId);

        const order = orders.find(o => o.id.toString() === orderId) || null;
        setSelectedOrder(order);

        if (orderId) {
            fetchPackingHistory(orderId);
        } else {
            setPackedHistory([]);
            setCurrentBoxNumber(1);
        }
    };

    const fetchPackingHistory = async (orderId: string) => {
        try {
            const res = await fetch(`/api/bch/packing/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                const history = data.boxes || [];
                setPackedHistory(history);

                const maxBox = history.reduce((max: number, box: PackedBox) => Math.max(max, box.box_number), 0);
                setCurrentBoxNumber(maxBox + 1);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };

    const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBarcodeInput(e.target.value);
    };

    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim() || !selectedOrder) return;

        const code = barcodeInput.trim();
        setScanQueue(prev => [...prev, code]);
        setBarcodeInput('');

        // Keep focus
        setTimeout(() => barcodeInputRef.current?.focus(), 10);
    };

    const addItemToBox = (product: any) => {
        const currentQty = currentBoxItems.reduce((acc, i) => acc + i.quantity, 0);
        const limit = BOX_LIMITS[boxType] || Infinity;

        if (currentQty >= limit) {
            toast.error(`Box is full! ${boxType} limit is ${limit} items.`);
            return false;
        }

        setCurrentBoxItems(prev => {
            const existingIndex = prev.findIndex(p => p.sku === product.sku && !p.qc_id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex].quantity += 1;
                return updated;
            }
            return [...prev, {
                id: Date.now(),
                product_name: product.product_name,
                sku: product.sku,
                barcode: product.barcode,
                ram: product.ram,
                storage: product.storage,
                quantity: 1,
                qc_id: product.qc_id,
                image: product.image,
                scanned_at: new Date()
            }];
        });
        return true;
    };

    const updateItemQty = (id: number, delta: number) => {
        if (delta > 0) {
            const currentQty = currentBoxItems.reduce((acc, i) => acc + i.quantity, 0);
            const limit = BOX_LIMITS[boxType] || Infinity;
            if (currentQty >= limit) {
                toast.error(`Cannot add more items. Limit is ${limit}.`);
                return;
            }
        }

        setCurrentBoxItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setCurrentBoxItems(prev => prev.filter(item => item.id !== id));
    };

    const handleDeleteBox = async (boxId: number, isLocal?: boolean) => {
        if (!confirm('Are you sure you want to delete this box?')) return;

        if (isLocal) {
            setPackedHistory(prev => prev.filter(box => box.id !== boxId));
            toast.success('Box removed from list');
            return;
        }

        try {
            const res = await fetch(`/api/bch/packing/boxes/${boxId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Box deleted successfully');
                // Optimistic UI update
                setPackedHistory(prev => prev.filter(box => box.id !== boxId));
                // Background refresh to ensure consistency
                if (selectedOrderId) {
                    fetchPackingHistory(selectedOrderId);
                }
            } else {
                toast.error('Failed to delete box');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error deleting box');
        }
    };

    const handleSubmitBox = () => {
        if (!selectedOrderId || currentBoxItems.length === 0) return;

        // Add to local history (batch submission)
        setPackedHistory(prev => [...prev, {
            id: Date.now(),
            box_number: currentBoxNumber,
            box_type: boxType,
            items: currentBoxItems,
            isLocal: true
        }]);

        setCurrentBoxItems([]);
        setCurrentBoxNumber(prev => prev + 1);
        toast.success('Box sealed! Ready to submit.');
    };

    const handleFinalSubmit = async () => {
        const localBoxes = packedHistory.filter(b => b.isLocal);
        if (localBoxes.length === 0) {
            toast.info("No new boxes to submit");
            return;
        }

        try {
            const boxesPayload = localBoxes.map(box => ({
                orderId: parseInt(selectedOrderId),
                boxNumber: box.box_number,
                boxType: box.box_type,
                items: box.items
            }));

            const res = await fetch('/api/bch/packing/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boxes: boxesPayload })
            });

            if (res.ok) {
                toast.success("All boxes saved successfully!");
                if (selectedOrderId) {
                    fetchPackingHistory(selectedOrderId);
                }
            } else {
                const err = await res.json();
                toast.error(`Error: ${err.details}`);
            }

        } catch (error) {
            console.error("Submit error:", error);
            toast.error("Failed to submit packing list");
        }
    };

    return (
        <div className="admin-section active" style={{ minHeight: 'calc(100vh - 60px)', background: '#F9FAFB' }}>
            <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.025em' }}>
                        <span style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                            <i className="fas fa-boxes" style={{ marginRight: '0.75rem', fontSize: '1.5rem', WebkitTextFillColor: '#3b82f6' }}></i>
                            Packing Station
                        </span>
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem', marginTop: '0.25rem' }}>Streamline your fulfillment process.</p>
                </div>

                {selectedOrder && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                {selectedOrder.customer_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1f2937' }}>{selectedOrder.customer_name}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Order #{selectedOrder.order_number}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr) 300px', gap: '1.5rem' }}>

                {/* 1. CONFIGURATION COLUMN (Left Sidebar) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Setup Card */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-sliders-h" style={{ color: '#6366f1' }}></i> Setup Operations
                        </h3>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem' }}>Order No</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="filter-select"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontSize: '0.9rem', cursor: 'pointer' }}
                                    value={selectedOrderId}
                                    onChange={(e) => handleOrderSelect(e.target.value)}
                                >
                                    <option value="">-- Choose Active Order --</option>
                                    {orders.map(o => (
                                        <option key={o.id} value={o.id}>SO-{100 + o.id}</option>
                                    ))}
                                </select>
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
                                    <i className="fas fa-chevron-down" style={{ fontSize: '0.8rem' }}></i>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem' }}>Current Box Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {BOX_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (currentBoxItems.length > 0 && type !== boxType) {
                                                if (!confirm("Changing box type might violate item limits. Continue?")) return;
                                            }
                                            setBoxType(type);
                                        }}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: boxType === type ? '1px solid #6366f1' : '1px solid #e5e7eb',
                                            background: boxType === type ? '#eef2ff' : 'white',
                                            color: boxType === type ? '#4338ca' : '#6b7280',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary - Vertical */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items in Box</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>{currentBoxItems.reduce((acc, item) => acc + item.quantity, 0)}</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-layer-group"></i>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Boxes Sealed</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>{packedHistory.length}</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN OPERATION COLUMN (Center) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Active Box Card */}
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

                        {/* Box Header */}
                        <div style={{ background: 'linear-gradient(to right, #ffffff, #f9fafb)', padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <i className="fas fa-box-open"></i>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Box #{currentBoxNumber}</h3>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{boxType} • {currentBoxItems.length} SKUs</p>
                                </div>
                            </div>

                            {/* Scanner Input */}
                            <div style={{ width: '300px' }}>
                                <form onSubmit={handleBarcodeSubmit} style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Scan Item..."
                                        className="search-input"
                                        style={{
                                            width: '100%',
                                            paddingLeft: '3rem',
                                            height: '48px',
                                            borderRadius: '12px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '0.95rem',
                                            transition: 'border-color 0.2s'
                                        }}
                                        ref={barcodeInputRef}
                                        value={barcodeInput}
                                        onChange={handleBarcodeInput}
                                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        disabled={!selectedOrderId}
                                        autoFocus
                                    />
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                                        <i className="fas fa-barcode" style={{ fontSize: '1.1rem' }}></i>
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            position: 'absolute',
                                            right: '0.5rem',
                                            top: '0.5rem',
                                            bottom: '0.5rem',
                                            padding: '0 1rem',
                                            background: '#6366f1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            opacity: !selectedOrderId ? 0.6 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                        disabled={!selectedOrderId}
                                    >
                                        Add
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Queue Display */}
                        {scanQueue.length > 0 && (
                            <div style={{ background: '#fffbeb', padding: '0.75rem 1.5rem', borderBottom: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontSize: '0.85rem', fontWeight: 600, minWidth: 'fit-content' }}>
                                    <div style={{ width: '16px', height: '16px', border: '2px solid #b45309', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <span>Processing {scanQueue.length}...</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'thin' }}>
                                    {scanQueue.map((code, idx) => (
                                        <span key={idx} style={{ background: 'white', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: '#92400e', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            {code}
                                        </span>
                                    ))}
                                </div>
                                <style jsx>{`
                                    @keyframes spin { to { transform: rotate(360deg); } }
                                `}</style>
                            </div>
                        )}

                        {/* Items List */}
                        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', position: 'relative' }}>
                            {currentBoxItems.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', minHeight: '300px' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <i className="fas fa-search" style={{ fontSize: '2rem', color: '#d1d5db' }}></i>
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#4b5563', fontWeight: 600 }}>Ready to Pack</h4>
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Scan a barcode to add items to Box #{currentBoxNumber}</p>
                                </div>
                            ) : (
                                <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                                        <tr>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Barcode</th>
                                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Product</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>RAM / SSD</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Serial Number</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Charger</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Quantity</th>
                                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentBoxItems.map(item => (
                                            <tr key={item.id} style={{ transition: 'background 0.1s' }} className="hover:bg-gray-50">
                                                <td style={{ padding: '1rem', borderBottom: '1px solid #f9fafb' }}>
                                                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151', background: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                        {item.barcode || '-'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f9fafb' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                            {item.image && item.image !== '/placeholder.svg' ? (
                                                                <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <i className="fas fa-image" style={{ color: '#d1d5db' }}></i>
                                                            )}
                                                        </div>
                                                        <div style={{ overflow: 'hidden' }}>
                                                            <p style={{ margin: 0, fontWeight: 600, color: '#1f2937', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={item.product_name}>{item.product_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', borderBottom: '1px solid #f9fafb', fontSize: '0.85rem', color: '#6b7280' }}>
                                                    {item.ram || ''}{(item.ram && item.storage) ? ' / ' : ''}{item.storage || ''}
                                                </td>
                                                <td style={{ padding: '1rem', borderBottom: '1px solid #f9fafb', fontSize: '0.85rem', color: '#6b7280' }}>
                                                    {item.sku}
                                                </td>
                                                <td style={{ padding: '1rem', borderBottom: '1px solid #f9fafb' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <input type="checkbox" style={{ accentColor: '#10b981', cursor: 'pointer' }} />
                                                        <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>Inc.</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', borderBottom: '1px solid #f9fafb', textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                                        <button onClick={() => updateItemQty(item.id, -1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', borderRadius: '8px 0 0 8px' }} className="hover:bg-gray-50">-</button>
                                                        <span style={{ width: '32px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{item.quantity}</span>
                                                        <button onClick={() => updateItemQty(item.id, 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', borderRadius: '0 8px 8px 0' }} className="hover:bg-gray-50">+</button>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f9fafb', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                        title="Remove"
                                                    >
                                                        <i className="fas fa-trash-alt" style={{ fontSize: '0.85rem' }}></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Complete Button Footer */}
                        <div style={{ padding: '1.25rem 1.5rem', background: 'white', borderTop: '1px solid #f3f4f6' }}>
                            <button
                                onClick={handleSubmitBox}
                                disabled={currentBoxItems.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: currentBoxItems.length > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6',
                                    color: currentBoxItems.length > 0 ? 'white' : '#9ca3af',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    boxShadow: currentBoxItems.length > 0 ? '0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.1)' : 'none',
                                    cursor: currentBoxItems.length > 0 ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem'
                                }}
                            >
                                <i className="fas fa-check-circle" style={{ fontSize: '1.2rem' }}></i>
                                Seal Box & Complete
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. HISTORY COLUMN (Right Sidebar) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '16px', height: '100%', border: '1px dashed #cbd5e1', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sealed Boxes</h3>
                            <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#64748b', fontWeight: 600 }}>{packedHistory.length}</span>
                        </div>

                        {/* Stacked List */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {packedHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#94a3b8' }}>
                                    <i className="fas fa-parachute-box" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                                    <p style={{ fontSize: '0.85rem' }}>No boxes sealed yet.</p>
                                </div>
                            ) : (
                                [...packedHistory].reverse().map(box => (
                                    <div key={box.id} style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', background: '#3b82f6' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Box #{box.box_number}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>{box.box_type}</span>
                                                <button
                                                    onClick={() => handleDeleteBox(box.id, box.isLocal)}
                                                    title="Delete Box"
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#ef4444',
                                                        padding: '4px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        borderRadius: '4px',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    className="hover:bg-red-50"
                                                >
                                                    <i className="fas fa-trash-alt" style={{ fontSize: '0.8rem' }}></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                                            <i className="fas fa-box" style={{ fontSize: '0.7rem' }}></i>
                                            <span>{box.items.reduce((a, b) => a + b.quantity, 0)} Items</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Export Action */}
                        {packedHistory.length > 0 && selectedOrder && (
                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
                                <PDFDownloadLink
                                    document={<PackingListPDF order={selectedOrder} boxes={packedHistory} />}
                                    fileName={`PackingList-${selectedOrder.order_number}.pdf`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    {({ loading }) => (
                                        <button style={{
                                            width: '100%',
                                            padding: '0.875rem',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            color: '#374151',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            transition: 'all 0.2s'
                                        }}>
                                            <i className="fas fa-file-pdf" style={{ color: '#ef4444' }}></i>
                                            {loading ? 'Preparing...' : 'Export PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            </div>
                        )}

                        {/* Submit Button for Local Boxes */}
                        {packedHistory.some(b => b.isLocal) && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    onClick={handleFinalSubmit}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        transition: 'transform 0.1s'
                                    }}
                                >
                                    <i className="fas fa-save"></i>
                                    Submit Packing List ({packedHistory.filter(b => b.isLocal).length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div >
    );
}
