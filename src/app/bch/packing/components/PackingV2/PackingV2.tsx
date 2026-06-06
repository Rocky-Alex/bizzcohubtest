"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { DetailedPackingList } from './DetailedPackingList';
import { QtyPackingList } from './QtyPackingList';

// --- Interfaces ---

export interface Order {
    id: number;
    order_number: string;
    customer_name: string;
}

export interface ProductDetails {
    barcode: string;
    brand: string;
    model: string;
    series: string;
    core: string; // Processor
    generation: string;
    ram: string;
    ssd: string; // Storage
    graphic: string;
    screen_size?: string;
    serial_number: string;
    touch: string;
    battery_health: string;
    ssd_health: string;
    body_condition: string;
}

export interface PackedItemRecord {
    id: number;
    no: number;
    salesOrder: string;     // e.g. "SO-1001"
    barcode: string;
    serialNumber: string;
    productName: string;
    brand: string;
    model: string;
    series: string;
    core: string;
    generation: string;
    ram: string;
    ssd: string;
    graphic: string;
    screenSize: string;
    deviceSerialNumber: string; // New Serial Key to avoid conflict if any
    touch: string;
    batteryHealth: string;
    ssdHealth: string;
    bodyCondition: string;
    charger: string;
    startedTime: string;
    endedTime: string;
    timeDuration: string;
    boxNumber: string;
    currentStatus: string;  // e.g. "Packed"
    result: number;         // e.g. 1
}

// --- Component ---

const BOX_TYPES = ['Single Box', '5 Pieces Box', '10 Pieces Box', 'Plastic Bag'];
const BOX_LIMITS: Record<string, number> = {
    'Single Box': 1,
    '5 Pieces Box': 5,
    '10 Pieces Box': 10,
    'Plastic Bag': Infinity
};

export default function PackingV2() {
    // --- State ---

    const [showPrintView, setShowPrintView] = useState(false);
    const [printViewType, setPrintViewType] = useState<'detailed' | 'qty'>('detailed');

    // Form Inputs
    const [barcode, setBarcode] = useState('');
    const [product, setProduct] = useState<ProductDetails>({
        barcode: '', brand: '', model: '', series: '', core: '', generation: '', ram: '', ssd: '', graphic: '', screen_size: '',
        serial_number: '', touch: 'Non-Touch', battery_health: '', ssd_health: '', body_condition: ''
    });

    const [withCharger, setWithCharger] = useState(false);
    const [chargerWatts, setChargerWatts] = useState('');

    // Lists
    const [brandList, setBrandList] = useState<string[]>([]);
    const [processorList, setProcessorList] = useState<string[]>([]);
    const [generationList, setGenerationList] = useState<string[]>([]);
    const [ramList, setRamList] = useState<string[]>([]);
    const [storageList, setStorageList] = useState<string[]>([]);
    const [graphicsList, setGraphicsList] = useState<string[]>([]);
    const [seriesList, setSeriesList] = useState<string[]>([]);
    const [modelList, setModelList] = useState<string[]>([]);
    const [laptopModelsList, setLaptopModelsList] = useState<any[]>([]);
    const [masterGenerationList, setMasterGenerationList] = useState<any[]>([]);

    // Process Inputs
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [boxType, setBoxType] = useState(BOX_TYPES[0]);
    const [boxNumber, setBoxNumber] = useState('');
    const [warrantyNumber, setWarrantyNumber] = useState('');

    // Data List
    const [packedItems, setPackedItems] = useState<PackedItemRecord[]>([]);

    // Process State
    const [startTime, setStartTime] = useState<Date | null>(null);

    // Refs
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---

    useEffect(() => {
        fetchOrders();
        fetchMasterData();
    }, []);

    useEffect(() => {
        if (selectedOrderId) {
            const orderIdNum = Number(orders.find(o => o.id.toString() === selectedOrderId)?.id || 0);
            const soString = `SO-${orderIdNum + 100}`;
            const itemsForOrder = packedItems.filter(i => i.salesOrder === soString);
            const maxBox = itemsForOrder.reduce((max, item) => Math.max(max, parseInt(item.boxNumber) || 0), 0);

            const itemsInMaxBox = itemsForOrder.filter(i => i.boxNumber === maxBox.toString()).length;
            const limit = BOX_LIMITS[boxType] || 1;

            if (maxBox > 0) {
                if (itemsInMaxBox >= limit) {
                    setBoxNumber((maxBox + 1).toString());
                } else {
                    setBoxNumber(maxBox.toString());
                }
            } else {
                setBoxNumber('1');
            }
        } else {
            setBoxNumber('');
        }
    }, [selectedOrderId, packedItems, orders, boxType]);

    // --- Functions ---

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/bch/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        }
    };

    const fetchMasterData = async () => {
        try {
            const categories = ['Laptop', 'Processor', 'Gen', 'RAM', 'Storage', 'Graphics'];
            const promises = categories.map(cat =>
                fetch(`/api/bch/inventory/droplists?category=${cat}`).then(r => r.json())
            );

            const results = await Promise.all(promises);

            if (results[0]?.success && results[0].data) {
                const laptopData = results[0].data;
                setLaptopModelsList(laptopData);
                const uniqueBrands = Array.from(new Set(laptopData.map((d: any) => d.brand))).filter(Boolean) as string[];
                setBrandList(uniqueBrands.sort());
            }

            if (results[1]?.success && results[1].data) setProcessorList(results[1].data.map((d: any) => d.value));
            if (results[2]?.success && results[2].data) {
                setMasterGenerationList(results[2].data);
                setGenerationList(results[2].data.map((d: any) => d.value));
            }
            if (results[3]?.success && results[3].data) setRamList(results[3].data.map((d: any) => d.value));
            if (results[4]?.success && results[4].data) setStorageList(results[4].data.map((d: any) => d.value));
            if (results[5]?.success && results[5].data) setGraphicsList(results[5].data.map((d: any) => d.value));

        } catch (e) {
            console.error("Failed to fetch master data", e);
        }
    };

    const renderFieldOptions = (fieldKey: string, options: string[]) => {
        const parseValue = (val: string) => {
            const clean = (val || '').toLowerCase().trim();
            const num = parseFloat(clean);
            if (isNaN(num)) return 0;
            if (clean.includes('tb')) return num * 1024 * 1024;
            if (clean.includes('gb')) return num * 1024;
            if (clean.includes('mb')) return num;
            return num;
        };

        const sortedOptions = [...(options || [])].sort((a, b) => {
            const sizeFields = ['RAM', 'SSD', 'screen_size'];
            if (sizeFields.includes(fieldKey)) {
                return parseValue(a) - parseValue(b);
            }
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        return sortedOptions.map((opt, i) => <option key={`${opt}-${i}`} value={opt}>{opt}</option>);
    };

    const ensureInList = (list: string[], value: string) => {
        if (!value) return list || [];
        const safeList = Array.isArray(list) ? list : [];
        const normalized = value.trim();
        if (safeList.some(item => typeof item === 'string' && item.trim() === normalized)) return safeList;
        return [...safeList, normalized];
    };

    const handleProductChange = (field: keyof ProductDetails, value: string) => {
        setProduct(prev => ({ ...prev, [field]: value }));

        if (field === 'brand') {
            setProduct(prev => ({ ...prev, brand: value, series: '', model: '' }));
            const series = Array.from(new Set(laptopModelsList.filter(m => m.brand === value).map(m => m.series))).filter(Boolean).sort();
            setSeriesList(series as string[]);
            setModelList([]);
        } else if (field === 'series') {
            setProduct(prev => ({ ...prev, series: value, model: '' }));
            const models = Array.from(new Set(laptopModelsList.filter(m => m.brand === product.brand && m.series === value).map(m => m.model))).filter(Boolean).sort();
            setModelList(models as string[]);
        } else if (field === 'core') {
            if (!value) {
                setGenerationList(masterGenerationList.map(g => g.value));
            } else {
                const filtered = masterGenerationList.filter(g => {
                    if (!g.parent) return true;
                    try {
                        const p = JSON.parse(g.parent);
                        return Array.isArray(p) ? p.includes(value) : p == value;
                    } catch (e) {
                        return g.parent == value;
                    }
                }).map(g => g.value);
                setGenerationList(filtered);
            }
        }
    };

    const executeBarcodeSearch = async () => {
        if (!barcode) return;

        const scanTime = new Date();

        try {
            let found = false;
            // Try QC
            try {
                const res = await fetch(`/api/bch/inventory/qc?sku=${encodeURIComponent(barcode)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data && data.data.length > 0) {
                        setStartTime(scanTime);
                        const item = data.data[0];
                        const newBrand = (item.brand || '').trim();
                        const newModel = (item.model || '').trim();
                        const newSeries = (item.series || '').trim();
                        const newCore = (item.processor || '').trim();
                        const newGen = (item.processor_gen || '').trim();
                        const newRam = (item.ram || item.product_ram || '').trim();
                        const newSsd = (item.storage || item.product_storage || '').trim();
                        const newGraphic = (item.graphics || '').trim();

                        setProduct({
                            barcode: barcode,
                            brand: newBrand,
                            model: newModel,
                            series: newSeries,
                            core: newCore,
                            generation: newGen,
                            ram: newRam,
                            ssd: newSsd,
                            graphic: newGraphic,
                            screen_size: '',
                            serial_number: '',
                            touch: 'Non-Touch',
                            battery_health: '',
                            ssd_health: '',
                            body_condition: ''
                        });

                        setBrandList(prev => ensureInList(prev, newBrand));
                        setSeriesList(prev => ensureInList(prev, newSeries));
                        setModelList(prev => ensureInList(prev, newModel));
                        setProcessorList(prev => ensureInList(prev, newCore));
                        setGenerationList(prev => ensureInList(prev, newGen));
                        setRamList(prev => ensureInList(prev, newRam));
                        setStorageList(prev => ensureInList(prev, newSsd));
                        setGraphicsList(prev => ensureInList(prev, newGraphic));

                        found = true;
                        toast.success("Product found!");
                    }
                }
            } catch (err) { console.error(err); }

            if (!found) {
                // Try Products
                const res2 = await fetch(`/api/products?code=${encodeURIComponent(barcode)}`);
                if (res2.ok) {
                    const data2 = await res2.json();
                    if (data2.product) {
                        setStartTime(scanTime);
                        const p = data2.product;
                        const sp = p.specifications || {};
                        const newBrand = (p.brand || '').trim();
                        const newModel = (p.name || '').trim();
                        const newSeries = (p.series || '').trim();
                        const newCore = (sp.Processor || '').trim();
                        const newGen = (sp.Generation || '').trim();
                        const newRam = (sp.RAM || '').trim();
                        const newSsd = (sp.Storage || '').trim();
                        const newGraphic = (sp.Graphics || '').trim();

                        setProduct({
                            barcode: barcode,
                            brand: newBrand,
                            model: newModel,
                            series: newSeries,
                            core: newCore,
                            generation: newGen,
                            ram: newRam,
                            ssd: newSsd,
                            graphic: newGraphic,
                            screen_size: '',
                            serial_number: '',
                            touch: 'Non-Touch',
                            battery_health: '',
                            ssd_health: '',
                            body_condition: ''
                        });

                        setBrandList(prev => ensureInList(prev, newBrand));
                        setProcessorList(prev => ensureInList(prev, newCore));
                        // ... implicit list updates

                        found = true;
                        toast.success("Product found!");
                    }
                }
            }
            if (!found) toast.error("Product not found");
        } catch (error) { console.error("Scan error", error); }
    };

    const handleBarcodeScan = async (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        const isEnter = e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter';
        const isBlur = e.type === 'blur';
        if (isEnter || isBlur) {
            await executeBarcodeSearch();
        }
    };

    const handleConfirm = () => {
        if (!barcode || !product.model) {
            toast.error("Please scan a valid product first");
            return;
        }
        if (!selectedOrderId) {
            toast.error("Please select a Sales Order");
            return;
        }

        const limit = BOX_LIMITS[boxType] || Infinity;
        const orderIdNum = Number(orders.find(o => o.id.toString() === selectedOrderId)?.id || 0);
        const soNumber = `SO-${orderIdNum + 100}`;
        const currentBoxItemsCount = packedItems.filter(i => i.salesOrder === soNumber && i.boxNumber === boxNumber).length;

        if (currentBoxItemsCount >= limit) {
            toast.error(`Box Limit Reached! (${limit} items max for ${boxType})`);
            return;
        }

        const endTime = new Date();
        const start = startTime || endTime; // Fallback to now if no start time captured
        const durationMs = endTime.getTime() - start.getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        const durationString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        const newItem: PackedItemRecord = {
            id: Date.now(),
            no: packedItems.length + 1,
            salesOrder: soNumber,
            barcode: barcode,
            serialNumber: warrantyNumber || '',
            productName: `${product.brand} ${product.series} ${product.model}`.trim(),
            brand: product.brand,
            model: product.model,
            series: product.series,
            core: product.core,
            generation: product.generation,
            ram: product.ram,
            ssd: product.ssd,
            graphic: product.graphic,
            screenSize: product.screen_size || '',
            deviceSerialNumber: product.serial_number,
            touch: product.touch,
            batteryHealth: product.battery_health,
            ssdHealth: product.ssd_health,
            bodyCondition: product.body_condition,
            charger: withCharger ? (chargerWatts || '') : 'N',
            startedTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endedTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timeDuration: durationString,
            boxNumber: boxNumber || '1',
            currentStatus: 'Packed',
            result: 1
        };

        setPackedItems([newItem, ...packedItems]);
        toast.success("Item packed successfully");



        // Reset
        setBarcode('');
        setProduct({
            barcode: '', brand: '', model: '', series: '', core: '', generation: '', ram: '', ssd: '', graphic: '', screen_size: '',
            serial_number: '', touch: 'Non-Touch', battery_health: '', ssd_health: '', body_condition: ''
        });
        setWithCharger(false);
        setChargerWatts('');
        setWarrantyNumber('');
        setStartTime(null);
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
    };

    const handleCancel = () => {
        setBarcode('');
        setProduct({
            barcode: '', brand: '', model: '', series: '', core: '', generation: '', ram: '', ssd: '', graphic: '', screen_size: '',
            serial_number: '', touch: 'Non-Touch', battery_health: '', ssd_health: '', body_condition: ''
        });
        setWithCharger(false);
        setChargerWatts('');
        setStartTime(null);
    };

    const handleExportExcel = async () => {
        if (!selectedOrderId) return;
        const currentOrder = orders.find(o => o.id.toString() === selectedOrderId);
        const soNumber = currentOrder ? `SO-${Number(currentOrder.id) + 100}` : 'Unknown';

        const XLSX = await import('xlsx');

        if (printViewType === 'detailed') {
            const data = packedItems.map(item => ({
                'No': item.no,
                'Barcode': item.barcode,
                'Serial No': item.deviceSerialNumber || item.serialNumber,
                'Product Name': item.productName,
                'Core': item.core,
                'Gen': item.generation,
                'RAM': item.ram,
                'SSD': item.ssd,
                'Graphic': item.graphic,
                'Screen Size': item.screenSize,
                'Touch': item.touch,
                'Battery Health': item.batteryHealth,
                'SSD Health': item.ssdHealth,
                'Grade/Cond.': item.bodyCondition,
                'AC': item.charger,
                'Box': item.boxNumber
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Detailed Packing List");

            const wscols = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
            ws['!cols'] = wscols;

            XLSX.writeFile(wb, `Detailed_Packing_List_${soNumber}.xlsx`);

        } else {
            // Qty Wise Aggregation
            const groupedItems = packedItems.reduce((acc, item) => {
                const key = [item.productName, item.core, item.generation, item.ram, item.ssd, item.graphic, item.touch, item.charger].join('|');
                if (!acc[key]) {
                    acc[key] = { ...item, qty: 0 };
                }
                acc[key].qty += 1;
                return acc;
            }, {} as Record<string, PackedItemRecord & { qty: number }>);

            const sortedGroups = Object.values(groupedItems).sort((a, b) => a.productName.localeCompare(b.productName));

            const data = sortedGroups.map((item, i) => ({
                'No': i + 1,
                'Product Name': item.productName,
                'Core': item.core,
                'Gen': item.generation,
                'RAM': item.ram,
                'SSD': item.ssd,
                'Gra.': item.graphic,
                'Tou/Non': item.touch === 'Touch' ? 'Touch' : 'Non',
                'AC': item.charger !== 'N' ? 'Yes' : 'No',
                'Qty.': item.qty
            }));

            // Add Total Row
            const totalQty = sortedGroups.reduce((sum, item) => sum + item.qty, 0);
            data.push({
                'No': '', 'Product Name': 'Total Quantity', 'Core': '', 'Gen': '', 'RAM': '', 'SSD': '', 'Gra.': '', 'Tou/Non': '', 'AC': '', 'Qty.': totalQty
            } as any);

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Packing List");

            const wscols = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 10) }));
            ws['!cols'] = wscols;

            XLSX.writeFile(wb, `Packing_List_${soNumber}.xlsx`);
        }
    };

    const handleEmail = () => {
        const currentOrder = orders.find(o => o.id.toString() === selectedOrderId);
        const soNumber = currentOrder ? `SO-${Number(currentOrder.id) + 100}` : 'Unknown';

        const listName = printViewType === 'detailed' ? 'Detailed Packing List' : 'Packing List';
        const fileName = printViewType === 'detailed' ? `Detailed_Packing_List_${soNumber}` : `Packing_List_${soNumber}`;

        const subject = `${listName} - ${soNumber}`;
        const body = `Please find the ${listName.toLowerCase()} for ${soNumber} attached.`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // --- Styles ---
    const darkBg = 'var(--bg-tertiary)';
    const cardBg = 'var(--bg-primary)';
    const inputBg = 'var(--bg-secondary)';
    const textLight = 'var(--text-primary)';
    const textMuted = 'var(--text-secondary)';
    const accentColor = 'var(--primary)';
    const borderDark = 'var(--border)';

    const containerStyle: React.CSSProperties = {
        backgroundColor: darkBg,
        minHeight: '100vh',
        padding: '0.5rem',
        color: textLight,
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)'
    };

    const labelStyle: React.CSSProperties = {
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        fontWeight: 500,
        marginBottom: '0.25rem',
        display: 'block'
    };

    const inputStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem 0.75rem',
        width: '100%',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.15s ease-in-out',
    };

    const readOnlyInputStyle: React.CSSProperties = {
        ...inputStyle,
        backgroundColor: 'var(--bg-tertiary)',
        cursor: 'default',
        color: 'var(--text-secondary)'
    };

    const buttonBaseStyle: React.CSSProperties = {
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <div style={containerStyle}>
            {showPrintView && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#525659', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
                    <div className="no-print" style={{ padding: '1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <button
                            onClick={handleExportExcel}
                            style={{ padding: '0.5rem 1.5rem', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            <i className="fas fa-file-excel" style={{ marginRight: '8px' }}></i> Excel
                        </button>
                        <button
                            onClick={() => window.print()}
                            style={{ padding: '0.5rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            <i className="fas fa-print" style={{ marginRight: '8px' }}></i> PDF / Print
                        </button>
                        <button
                            onClick={handleEmail}
                            style={{ padding: '0.5rem 1.5rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            <i className="fas fa-envelope" style={{ marginRight: '8px' }}></i> Send to Mail
                        </button>
                        <button
                            onClick={() => setShowPrintView(false)}
                            style={{ padding: '0.5rem 1.5rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Close
                        </button>
                    </div>

                    {/* Preview Container - Centered & Scaled */}
                    <div className="print-preview-container" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '20px' }}>
                        <div style={{
                            transform: printViewType === 'detailed' ? 'scale(.5)' : 'scale(.95)',
                            transformOrigin: 'top center', // Changed to top center to prevent top alignment issues when scrolling
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            marginTop: '220px',
                            marginBottom: '20px'
                        }}>
                            {printViewType === 'detailed' ? (
                                <DetailedPackingList items={packedItems} order={orders.find(o => o.id.toString() === selectedOrderId)} />
                            ) : (
                                <QtyPackingList items={packedItems} order={orders.find(o => o.id.toString() === selectedOrderId)} />
                            )}
                        </div>
                    </div>

                    <style>{`
                        @media print {
                            .no-print { display: none !important; }
                            .main-content-area { display: none !important; }
                            .print-preview-container {
                                display: block !important;
                                overflow: visible !important;
                                height: auto !important;
                                padding: 0 !important;
                                background: white !important;
                            }
                            .print-preview-container > div {
                                transform: none !important;
                                box-shadow: none !important;
                                margin: 0 !important;
                            }
                            body { background: white; }
                        }
                    `}</style>
                </div>
            )}

            <div className="main-content-area" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em', background: 'linear-gradient(to right, #000000, #000000)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Packing Department
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => {
                                if (!selectedOrderId) {
                                    toast.error("Please select an Order to print");
                                    return;
                                }
                                if (packedItems.length === 0) {
                                    toast.warning("No items packed yet");
                                }
                                setPrintViewType('detailed');
                                setShowPrintView(true);
                            }}
                            style={{ ...buttonBaseStyle, backgroundColor: '#059669', color: 'white', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                        >
                            Detailed Packing List
                        </button>
                        <button
                            onClick={() => {
                                if (!selectedOrderId) {
                                    toast.error("Please select an Order to print");
                                    return;
                                }
                                setPrintViewType('qty');
                                setShowPrintView(true);
                            }}
                            style={{ ...buttonBaseStyle, backgroundColor: '#D97706', color: 'white', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                        >
                            Qty Wise Packing List
                        </button>
                        <button style={{ ...buttonBaseStyle, backgroundColor: '#EA580C', color: 'white', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                            Packing Removing
                        </button>
                    </div>
                </div>

                {/* Main Work Area */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) minmax(400px, 1fr)', gap: '1.5rem' }}>

                    {/* Left Panel: Product Identity */}
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: `1px solid ${borderDark}`, paddingBottom: '0.75rem' }}>
                            Product Identification
                        </h2>
                        {/* ... (rest of Left Panel content implicitly included by context matching or I need to include it all?) */}
                        {/* Wait, replace_file_content needs to match exactly. I cannot just wrap heavily nested content easily with a small snippet if the target is huge. */}
                        {/* I will target the START of the content and the END of the content separately? No, replace must be contiguous. */}
                        {/* I'll use a larger block replacement. */}
                        {/* Actually, I can just wrap the Header, Main Work Area, and Bottom Table by checking what is inside the main div. */}
                        {/* The main div contains {showPrintView && ...} then the rest. */}
                        {/* I'll replace everything after the showPrintView block. */}
                        {/* See below for target. */}


                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ ...labelStyle, color: accentColor }}>Scan Barcode / MFG</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    style={{ ...inputStyle, borderColor: accentColor, boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.1)', flex: 1 }}
                                    placeholder="Scan barcode here..."
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={handleBarcodeScan}
                                    autoFocus
                                />
                                <button
                                    onClick={executeBarcodeSearch}
                                    onMouseDown={(e) => e.preventDefault()}
                                    style={{
                                        ...buttonBaseStyle,
                                        backgroundColor: accentColor,
                                        color: 'white',
                                        padding: '0 1.5rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <i className="fas fa-search" style={{ marginRight: '8px' }}></i>
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Brand, Series, Model Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {/* Brand */}
                            <div>
                                <label style={labelStyle}>Brand</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.brand}
                                    onChange={(e) => handleProductChange('brand', e.target.value)}
                                >
                                    <option value="">-- Brand --</option>
                                    {renderFieldOptions('brand', brandList)}
                                </select>
                            </div>
                            {/* Series */}
                            <div>
                                <label style={labelStyle}>Series</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.series}
                                    onChange={(e) => handleProductChange('series', e.target.value)}
                                    disabled={!product.brand}
                                >
                                    <option value="">-- Series --</option>
                                    {renderFieldOptions('series', seriesList)}
                                </select>
                            </div>
                            {/* Model */}
                            <div>
                                <label style={labelStyle}>Model</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.model}
                                    onChange={(e) => handleProductChange('model', e.target.value)}
                                    disabled={!product.series}
                                >
                                    <option value="">-- Model --</option>
                                    {renderFieldOptions('model', modelList)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            {/* Core */}
                            <div>
                                <label style={labelStyle}>Core</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.core}
                                    onChange={(e) => handleProductChange('core', e.target.value)}
                                >
                                    <option value="">-- Select Core --</option>
                                    {renderFieldOptions('core', processorList)}
                                </select>
                            </div>

                            {/* Generation */}
                            <div>
                                <label style={labelStyle}>Generation</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.generation}
                                    onChange={(e) => handleProductChange('generation', e.target.value)}
                                >
                                    <option value="">-- Select Gen --</option>
                                    {renderFieldOptions('generation', generationList)}
                                </select>
                            </div>

                            {/* RAM */}
                            <div>
                                <label style={labelStyle}>RAM</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.ram}
                                    onChange={(e) => handleProductChange('ram', e.target.value)}
                                >
                                    <option value="">-- Select RAM --</option>
                                    {renderFieldOptions('RAM', ramList)}
                                </select>
                            </div>

                            {/* SSD */}
                            <div>
                                <label style={labelStyle}>SSD</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.ssd}
                                    onChange={(e) => handleProductChange('ssd', e.target.value)}
                                >
                                    <option value="">-- Select SSD --</option>
                                    {renderFieldOptions('SSD', storageList)}
                                </select>
                            </div>

                            {/* Graphic */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Graphic</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.graphic}
                                    onChange={(e) => handleProductChange('graphic', e.target.value)}
                                >
                                    <option value="">-- Select Graphic --</option>
                                    {renderFieldOptions('graphic', graphicsList)}
                                </select>
                            </div>
                            {/* Screen Size */}
                            <div>
                                <label style={labelStyle}>Screen Size</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.screen_size || ''}
                                    onChange={(e) => handleProductChange('screen_size', e.target.value)}
                                >
                                    <option value="">-- Size --</option>
                                    {["11.6", "12.0", "12.3", "12.5", "13.0", "13.3", "13.4", "13.5", "13.6", "14.0", "14.2", "15.0", "15.4", "15.6", "16.0", "16.1", "16.2", "17.0", "17.3"].map(s => (
                                        <option key={s} value={s}>{s}"</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* New Columns: Serial, Touch, Health, Condition */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            {/* Serial Number */}
                            <div>
                                <label style={labelStyle}>Serial Number</label>
                                <input
                                    style={inputStyle}
                                    placeholder="Serial Number"
                                    value={product.serial_number}
                                    onChange={(e) => handleProductChange('serial_number', e.target.value)}
                                />
                            </div>
                            {/* Touch / Non-Touch */}
                            <div>
                                <label style={labelStyle}>Touch Screen</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.touch}
                                    onChange={(e) => handleProductChange('touch', e.target.value)}
                                >
                                    <option value="Non-Touch">Non-Touch</option>
                                    <option value="Touch">Touch</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {/* Battery Health */}
                            <div>
                                <label style={labelStyle}>Battery Health</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.battery_health}
                                    onChange={(e) => handleProductChange('battery_health', e.target.value)}
                                >
                                    <option value="">-- Health --</option>
                                    {["100% to 75%", "74% to 50%", "49% to 0%", "No Battery", "Health not mentioned"].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            {/* SSD Health */}
                            <div>
                                <label style={labelStyle}>SSD Health</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.ssd_health}
                                    onChange={(e) => handleProductChange('ssd_health', e.target.value)}
                                >
                                    <option value="">-- Health --</option>
                                    {["100% to 75%", "74% to 50%", "49% to 0%", "No SSD", "Health not mentioned"].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Body Condition */}
                            <div>
                                <label style={labelStyle}>Body Condition</label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={product.body_condition}
                                    onChange={(e) => handleProductChange('body_condition', e.target.value)}
                                >
                                    <option value="">-- Condition --</option>
                                    {["Brand New", "Open Box", "A+ Grade", "A Grade", "B Grade", "C Grade", "D Grade", "For Parts"].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${borderDark}` }}>
                            <label style={labelStyle}>Charger Configuration</label>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                                <button
                                    onClick={() => setWithCharger(true)}
                                    style={{ ...buttonBaseStyle, flex: 1, padding: '0.5rem', backgroundColor: withCharger ? accentColor : inputBg, color: withCharger ? 'white' : textMuted, border: withCharger ? 'none' : `1px solid ${borderDark}` }}
                                >
                                    With Charger
                                </button>
                                <button
                                    onClick={() => setWithCharger(false)}
                                    style={{ ...buttonBaseStyle, flex: 1, padding: '0.5rem', backgroundColor: !withCharger ? accentColor : inputBg, color: !withCharger ? 'white' : textMuted, border: !withCharger ? 'none' : `1px solid ${borderDark}` }}
                                >
                                    Without Charger
                                </button>
                            </div>
                            <select
                                style={withCharger ? { ...inputStyle, cursor: 'pointer' } : { ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                                value={chargerWatts}
                                onChange={(e) => setChargerWatts(e.target.value)}
                                disabled={!withCharger}
                            >
                                <option value="">-- Select Watts --</option>
                                {["45W", "65W", "90W", "120W", "130W", "150W", "180W", "230W", "240W"].map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Right Panel: Packaging Process */}
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: `1px solid ${borderDark}`, paddingBottom: '0.75rem' }}>
                            Packaging Details
                        </h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={labelStyle}>Select Sales Order</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer', flex: 2 }}
                                    value={selectedOrderId}
                                    onChange={(e) => setSelectedOrderId(e.target.value)}
                                >
                                    <option value="">-- Choose Order --</option>
                                    {orders.map(o => (
                                        <option key={o.id} value={o.id}>SO-{100 + o.id} - {o.customer_name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    style={{ ...readOnlyInputStyle, flex: 1, textAlign: 'center' }}
                                    value={selectedOrderId ? `SO-${Number(orders.find(o => o.id.toString() === selectedOrderId)?.id || 0) + 100}` : ''}
                                    placeholder="SO-###"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={labelStyle}>Box Configuration</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                {BOX_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setBoxType(type)}
                                        style={{
                                            ...buttonBaseStyle,
                                            padding: '0.4rem 0.8rem',
                                            fontSize: '0.8rem',
                                            backgroundColor: boxType === type ? '#0EA5E9' : inputBg,
                                            color: boxType === type ? 'white' : textMuted,
                                            border: boxType === type ? 'none' : `1px solid ${borderDark}`
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Box Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            style={inputStyle}
                                            placeholder="#"
                                            value={boxNumber}
                                            onChange={(e) => setBoxNumber(e.target.value)}
                                        />
                                        {boxType && (
                                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: textMuted }}>
                                                Max: {BOX_LIMITS[boxType] === Infinity ? '∞' : BOX_LIMITS[boxType]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Warranty Number</label>
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        placeholder="Scan/Enter Warranty"
                                        value={warrantyNumber}
                                        onChange={(e) => setWarrantyNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                            <button
                                onClick={handleConfirm}
                                style={{
                                    ...buttonBaseStyle,
                                    backgroundColor: accentColor,
                                    color: 'white',
                                    padding: '1rem',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
                                }}
                            >
                                Confirm Item
                            </button>

                            <button
                                onClick={handleCancel}
                                style={{
                                    ...buttonBaseStyle,
                                    backgroundColor: 'transparent',
                                    color: '#EF4444',
                                    border: '1px solid #EF4444',
                                    padding: '1rem',
                                    fontSize: '1.1rem'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div> {/* End main-content-area */}

            {/* Bottom Table */}
            <div className="no-print" style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: textLight, fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: '#111827', borderBottom: `1px solid ${borderDark}` }}>
                            <tr>
                                {['No', 'Sales Order', 'Barcode', 'Product Name', 'Core', 'Gen', 'RAM', 'SSD', 'Start Time', 'End Time', 'Duration', 'Box', 'Status', 'Result'].map(h => (
                                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: textMuted }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {packedItems.map((item, idx) => (
                                <tr key={item.id} style={{ borderBottom: `1px solid ${borderDark}`, backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.no}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: accentColor }}>{item.salesOrder}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{item.barcode}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.productName}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.core}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.generation}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.ram}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.ssd}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.startedTime}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.endedTime}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.timeDuration}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.boxNumber}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                            {item.currentStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{item.result}</td>
                                </tr>
                            ))}
                            {packedItems.length === 0 && (
                                <tr>
                                    <td colSpan={13} style={{ padding: '3rem', textAlign: 'center', color: textMuted }}>
                                        No items packed in this session.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
