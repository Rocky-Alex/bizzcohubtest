"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { QRCodeSVG } from 'qrcode.react';



interface PurchaseLot {
    id: number;
    lotId: string;
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

interface Position {
    x: number;
    y: number;
}

interface LabelConfig {
    unit?: 'cm' | 'mm' | 'in';
    width: number;
    height: number;
    borderRadius: number;
    showBorder: boolean;
    productNameSize: number;
    productNamePos: Position;
    productNameWidth: number;
    barcodeScale: number;
    barcodeHeight: number;
    barcodeFontSize: number;
    barcodePos: Position;
    barcodeTextPos?: Position;
    barcodeTextFontSize?: number;
    specsFontSize: number;
    specsLineHeight: number;
    specsPos: Position;
    lotFontSize: number;
    lotPos: Position;
}

// ... existing interfaces ...

export default function QCChecking() {
    // ... existing state ...
    const [labelConfig, setLabelConfig] = useState<LabelConfig | null>(null);

    // Fetch Label Config on mount
    useEffect(() => {
        const fetchLabelConfig = async () => {
            try {
                // Fetch default_label (QC Sticker)
                const res = await fetch('/api/admin/label-settings?name=default_label', { cache: 'no-store' });
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
                    setLabelConfig({ ...defaults, ...data.config, unit: data.config.unit || data.config.unit || defaults.unit });
                }
            } catch (error) {
                console.error("Failed to load label settings:", error);
            }
        };
        fetchLabelConfig();
    }, []);

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

    // Dependent Dropdown Data
    const [laptopModelsList, setLaptopModelsList] = useState<any[]>([]);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [availableSeries, setAvailableSeries] = useState<string[]>([]);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [availableRam, setAvailableRam] = useState<string[]>([]);
    const [availableStorage, setAvailableStorage] = useState<string[]>([]);
    const [availableGraphics, setAvailableGraphics] = useState<string[]>([]);
    const [availableProcessors, setAvailableProcessors] = useState<string[]>([]);
    const [availableGen, setAvailableGen] = useState<{ value: string, parent?: string }[]>([]);
    const [availableScreenSizes, setAvailableScreenSizes] = useState<string[]>([]);
    const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
    const [availableKeyboardTypes, setAvailableKeyboardTypes] = useState<string[]>([]);
    const [availableKeyboardBacklit, setAvailableKeyboardBacklit] = useState<string[]>([]);
    const [availableConditions, setAvailableConditions] = useState<string[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoadingLots(true);
        try {
            // Batch all dropdown and model data into one request
            const categories = [
                {
                    cat: 'Laptop', set: (data: any[]) => {
                        setLaptopModelsList(data);
                        const brands = Array.from(new Set(data.map((m: any) => m.brand))).filter(Boolean) as string[];
                        setAvailableBrands(brands.sort());
                    }
                },
                { cat: 'RAM', set: (data: any[]) => setAvailableRam(data.map(i => i.value)) },
                { cat: 'Storage', set: (data: any[]) => setAvailableStorage(data.map(i => i.value)) },
                { cat: 'Graphics', set: (data: any[]) => setAvailableGraphics(data.map(i => i.value)) },
                { cat: 'Processor', set: (data: any[]) => setAvailableProcessors(data.map(i => i.value)) },
                { cat: 'Gen', set: (data: any[]) => setAvailableGen(data.map(i => ({ value: i.value, parent: i.parent }))) },
                { cat: 'Screen Size', set: (data: any[]) => setAvailableScreenSizes(data.map(i => i.value)) },
                { cat: 'Resolution', set: (data: any[]) => setAvailableResolutions(data.map(i => i.value)) },
                { cat: 'Keyboard Type', set: (data: any[]) => setAvailableKeyboardTypes(data.map(i => i.value)) },
                { cat: 'Keyboard Backlit', set: (data: any[]) => setAvailableKeyboardBacklit(data.map(i => i.value)) },
                { cat: 'Condition', set: (data: any[]) => setAvailableConditions(data.map(i => i.value)) }
            ];

            const categoryList = categories.map(c => c.cat).join(',');

            // Fetch Lots and Droplists in parallel
            const [lotsRes, dropListsRes] = await Promise.all([
                fetch('/api/admin/purchase/lots?status=active', { cache: 'no-store' }),
                fetch(`/api/admin/inventory/droplists?category=${categoryList}`)
            ]);

            const lotsData = await lotsRes.json();
            if (lotsData.success) {
                setLots(lotsData.lots);
            }

            const dropListsData = await dropListsRes.json();
            if (dropListsData.success && dropListsData.categoryData) {
                categories.forEach(c => {
                    const data = dropListsData.categoryData[c.cat] || [];
                    c.set(data);
                });
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoadingLots(false);
        }
    };

    useEffect(() => {
        if (selectedLotId && !isNaN(Number(selectedLotId))) {
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
        if (selectedItem) {
            fetchProductDetails(selectedItem);
        } else {
            setProductDetails(null);
            setFormData({});
        }
    }, [selectedItem]);


    // Derived Memoized Options for SearchableDropdowns
    const lotOptions = useMemo(() => lots.map(lot => ({
        label: `${lot.lotNumber || `Lot #${lot.lotId}`} - ${lot.supplierName}`,
        value: lot.id.toString()
    })), [lots]);

    const itemOptions = useMemo(() => {
        // Group items by unique characteristics (Product Name)
        const grouped = new Map<string, { totalRemaining: number, ids: number[] }>();

        lotItems.forEach(item => {
            const remaining = item.quantity - (item.qcCount || 0);
            if (remaining <= 0) return;

            // Use Product Name as key to group identical items
            const key = item.productName;

            if (!grouped.has(key)) {
                grouped.set(key, { totalRemaining: 0, ids: [] });
            }
            const group = grouped.get(key)!;
            group.totalRemaining += remaining;
            group.ids.push(item.itemId);
        });

        return Array.from(grouped.entries()).map(([name, group]) => ({
            label: `${name} - (Qty: ${group.totalRemaining})`,
            // Use the first ID as the value to select one of them for processing
            value: group.ids[0].toString()
        }));
    }, [lotItems]);

    const totalItemsInLot = useMemo(() => lotItems.reduce((acc, item) => acc + item.quantity, 0), [lotItems]);
    const totalCheckedInLot = useMemo(() => lotItems.reduce((acc, item) => acc + (item.qcCount || 0), 0), [lotItems]);
    const progressPercent = useMemo(() => totalItemsInLot > 0 ? Math.round((totalCheckedInLot / totalItemsInLot) * 100) : 0, [totalItemsInLot, totalCheckedInLot]);


    // Update available Series/Models when Brand/Series changes
    useEffect(() => {
        if (formData.brand) {
            const series = Array.from(new Set(
                laptopModelsList
                    .filter(m => m.brand === formData.brand)
                    .map(m => m.series)
            )).filter(Boolean) as string[];
            setAvailableSeries(series.sort());
        } else {
            setAvailableSeries([]);
        }
    }, [formData.brand, laptopModelsList]);

    useEffect(() => {
        if (formData.brand && formData.series) {
            const models = Array.from(new Set(
                laptopModelsList
                    .filter(m => m.brand === formData.brand && m.series === formData.series)
                    .map(m => m.model)
            )).filter(Boolean) as string[];
            setAvailableModels(models.sort());
        } else if (formData.brand && !formData.series) {
            // If no series exists for brand, show models for brand directly
            const models = Array.from(new Set(
                laptopModelsList
                    .filter(m => m.brand === formData.brand && (!m.series))
                    .map(m => m.model)
            )).filter(Boolean) as string[];
            setAvailableModels(models.sort());
        } else {
            setAvailableModels([]);
        }
    }, [formData.brand, formData.series, laptopModelsList]);


    const fetchLotItems = async (id: string) => {
        setLoadingItems(true);
        try {
            const response = await fetch(`/api/admin/purchase/lots/details?id=${id}`, { cache: 'no-store' });
            const data = await response.json();
            if (data.success && data.lot) {
                setLotItems(data.lot.items || []);
            } else {
                setLotItems([]);
            }
        } catch (error) {
            console.error('Error fetching lot items:', error);
        } finally {
            setLoadingItems(false);
        }
    };

    const fetchProductDetails = async (item: PurchaseLotItem) => {
        setLoadingDetails(true);
        try {
            let product = null;

            // 1. Try SKU first if available
            if (item.sku) {
                const res = await fetch(`/api/admin/inventory/products?sku=${item.sku}`);
                if (res.ok) {
                    product = await res.json();
                }
            }

            // 2. If no SKU or not found, try Product Name
            if (!product && item.productName) {
                const encodedName = encodeURIComponent(item.productName);
                const res = await fetch(`/api/admin/inventory/products?name=${encodedName}`);
                if (res.ok) {
                    product = await res.json();
                }
            }

            if (product) {
                setProductDetails(product);
                // Map DB fields to Form Data
                setFormData({
                    ...product,
                    brand: product.brand || '',
                    series: product.series || '',
                    model: product.model || '',
                    ram: product.ram || '',
                    storage: product.storage || '',
                    graphics_card: product.graphics_card || product.graphics || '',
                    sku: product.product_code || product.sku || '', // Use Master Code if found
                    screen_size: product.screen_size || '',
                    screen_resolution: product.screen_resolution || '',
                    condition_status: product.condition_status || '',
                    keyboard_type: product.keyboard_type || '',
                    keyboard_backlit: product.keyboard_backlit || '',
                    processor: product.processor || '',
                    processor_gen: product.processor_gen || '',
                });
            } else {
                console.warn("Product details not found by SKU or Name in Master DB");
                // Fallback to item details from purchase_lot_items (if any)
                setProductDetails(null);
                setFormData({
                    brand: item.brand || '',
                    model: item.model || '',
                    series: item.series || '',
                    processor: item.processor || '',
                    processor_gen: item.processorGen || '',
                    ram: item.ram || '',
                    storage: item.storage || '',
                    graphics_card: item.graphics || '',
                    product_name: item.productName,
                    sku: item.sku || ''
                });
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
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Clear dependent fields if parent changes
            if (field === 'brand') {
                newData.series = '';
                newData.model = '';
            } else if (field === 'series') {
                newData.model = '';
            } else if (field === 'processor') {
                newData.processor_gen = '';
            }

            return newData;
        });
    };

    // Modified handleSubmit
    const handleSubmit = async () => {
        if (!selectedLotId || !selectedItem) {
            alert("Please select a Purchase Lot and Product.");
            return;
        }

        // Logic to pick a specific Item ID from Staging to "Move"
        // The API now returns raw items or we can just pass the purchase_lot_item_id
        // Since we are moving from Staging -> Master, we don't need a "pendingId" from Master.
        // We need the Staging Item ID.

        const stagingItemId = selectedItem.itemId;

        setSaving(true);
        try {
            console.log(`Submitting QC Check for Staging Item ID: ${stagingItemId}`);

            // Prepare payload for CREATING a new Master Item from Staging
            const payload = {
                // Link back to staging for updating count
                purchaseLotItemId: stagingItemId,
                lotId: parseInt(selectedLotId),

                // Product Data (User might have edited it in form)
                productName: formData.product_name,
                sku: formData.sku, // If supplier provided one, otherwise backend generates BCH-XXX
                brand: formData.brand,
                model: formData.model,
                series: formData.series,
                processor: formData.processor,
                processor_gen: formData.processor_gen,
                ram: formData.ram,
                storage: formData.storage,
                graphics_card: formData.graphics_card,
                screen_size: formData.screen_size,
                screen_resolution: formData.screen_resolution,
                keyboard_type: formData.keyboard_type,
                keyboard_backlit: formData.keyboard_backlit,
                condition_status: formData.condition_status,

                // Status is implied 'Passed' when moving to Inventory
                qc_status: 'Passed'
            };

            console.log("Payload:", payload);

            // POST to Inventory QC -> This should now INSERT into master_inventory
            // We need to revert the API change that made it a PUT, or support POST for "Move from Staging"
            const res = await fetch('/api/admin/inventory/qc', {
                method: 'POST', // Switching back to POST for Creation
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const responseData = await res.json();
                setResultMessage({ type: 'success', text: 'Item Moved to Inventory! ✅' });

                // Calculate serial/barcode (using the ID we just updated)
                const seqNumber = 1000 + responseData.newMasterItemId; // Assuming newMasterItemId is returned
                const barcodeVal = `BCH-${seqNumber}`;

                const selectedLot = lots.find(l => l.id.toString() === selectedLotId);
                const lotNumber = selectedLot?.lotNumber || `Lot #${selectedLotId}`;

                setPrintData({
                    ...payload,
                    barcodeValue: barcodeVal,
                    lotNumber: lotNumber,
                    generatedId: `List-${selectedLotId}-${stagingItemId}`
                });
                setShowPrintModal(true);

                setEditableFields({});
                fetchLotItems(selectedLotId); // Refresh to update list and remove the processed ID from pending
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

        // Dropdown Logic
        const dropdownFields = [
            'brand', 'series', 'model', 'ram', 'storage', 'graphics_card',
            'processor', 'processor_gen', 'screen_size', 'screen_resolution',
            'keyboard_type', 'keyboard_backlit', 'condition_status'
        ];
        const isDropdown = dropdownFields.includes(fieldKey);

        let options: string[] = [];
        if (fieldKey === 'brand') options = availableBrands;
        if (fieldKey === 'series') options = availableSeries;
        if (fieldKey === 'model') options = availableModels;
        if (fieldKey === 'ram') options = availableRam;
        if (fieldKey === 'storage') options = availableStorage;
        if (fieldKey === 'graphics_card') options = availableGraphics;
        if (fieldKey === 'processor') options = availableProcessors;
        if (fieldKey === 'processor') options = availableProcessors;
        if (fieldKey === 'processor_gen') {
            const currentProcessor = formData.processor;
            if (currentProcessor) {
                options = availableGen
                    .filter(g => {
                        if (!g.parent) return true; // Keep independent ones if any
                        try {
                            const parents = JSON.parse(g.parent);
                            // Check if array or single string (backward compatibility)
                            if (Array.isArray(parents)) {
                                return parents.includes(currentProcessor);
                            }
                            return parents === currentProcessor;
                        } catch (e) {
                            return g.parent === currentProcessor;
                        }
                    })
                    .map(g => g.value);
            } else {
                // If no processor selected, maybe show all? Or none? 
                // Showing all might be confusing if they pick an incompatible one. 
                // Let's show all for flexibility but maybe warn? For now show all.
                options = availableGen.map(g => g.value);
            }
        }
        if (fieldKey === 'screen_size') options = availableScreenSizes;
        if (fieldKey === 'screen_resolution') options = availableResolutions;
        if (fieldKey === 'keyboard_type') options = availableKeyboardTypes;
        if (fieldKey === 'keyboard_backlit') options = availableKeyboardBacklit;
        if (fieldKey === 'condition_status') options = availableConditions;

        // Helper to sort by numeric value (KB, MB, GB, TB, or screen size)
        const parseValue = (val: string) => {
            const clean = (val || '').toLowerCase().trim();
            const num = parseFloat(clean);
            if (isNaN(num)) return 0;

            // Handle Storage/RAM units
            if (clean.includes('tb')) return num * 1024 * 1024;
            if (clean.includes('gb')) return num * 1024;
            if (clean.includes('mb')) return num;
            if (clean.includes('kb')) return num / 1024;

            // Handle screen size (e.g., 15.6-inch)
            return num;
        };

        const sortedOptions = [...options].sort((a, b) => {
            if (fieldKey === 'processor_gen') {
                // Descending numeric sort for generations (13, 12, 11...)
                // Use parseValue to extract the number (e.g., "12th" -> 12)
                const valA = parseValue(a);
                const valB = parseValue(b);
                // If both have numbers, sort descending
                if (valA > 0 && valB > 0) return valB - valA;
                // Otherwise fallback to string compare (e.g. "Ryzen")
                return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
            }

            const sizeFields = ['ram', 'storage', 'screen_size'];
            if (sizeFields.includes(fieldKey)) {
                return parseValue(a) - parseValue(b);
            }
            // Default alphabetical sort for everything else
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        const getIcon = (key: string) => {
            switch (key) {
                case 'brand': return 'fa-copyright';
                case 'series': return 'fa-layer-group';
                case 'model': return 'fa-laptop';
                case 'processor': return 'fa-microchip';
                case 'processor_gen': return 'fa-clock';
                case 'ram': return 'fa-memory';
                case 'storage': return 'fa-hdd';
                case 'graphics_card': return 'fa-image';
                case 'sku': return 'fa-barcode';
                case 'screen_size': return 'fa-desktop';
                case 'screen_resolution': return 'fa-compress-arrows-alt';
                case 'keyboard_type': return 'fa-keyboard';
                case 'keyboard_backlit': return 'fa-lightbulb';
                case 'condition_status': return 'fa-check-circle';
                default: return 'fa-info-circle';
            }
        };

        return (
            <div style={{ marginBottom: '1.25rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <label
                        onDoubleClick={() => !isEditing && handleEditToggle(fieldKey)}
                        style={{
                            fontWeight: 800,
                            color: '#334155',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: isEditing ? 'default' : 'pointer'
                        }}
                    >
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: isEditing ? '#eff6ff' : '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.3s'
                        }}>
                            <i className={`fas ${getIcon(fieldKey)}`} style={{ color: isEditing ? '#3b82f6' : '#94a3b8', fontSize: '0.85rem' }}></i>
                        </div>
                        {label}
                    </label>
                    <button
                        onClick={() => handleEditToggle(fieldKey)}
                        style={{
                            background: isEditing ? '#10b981' : 'transparent',
                            border: isEditing ? 'none' : '1px solid #e2e8f0',
                            color: isEditing ? 'white' : '#94a3b8',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: isEditing ? '4px 12px' : '4px 8px',
                            borderRadius: '100px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            height: '24px'
                        }}
                    >
                        {isEditing ? (
                            <i className="fas fa-check"></i>
                        ) : (
                            <i className="fas fa-pen" style={{ fontSize: '0.65rem' }}></i>
                        )}
                    </button>
                </div>
                <div style={{ position: 'relative' }}>
                    {isDropdown && isEditing ? (
                        <select
                            value={value}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            className="modern-input"
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                paddingRight: '2.5rem',
                                backgroundColor: 'white',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                color: value ? '#0f172a' : '#94a3b8',
                                fontSize: '0.95rem',
                                outline: 'none',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 1rem center',
                                backgroundSize: '1.2rem',
                            }}
                        >
                            <option value="" disabled>Select {label}</option>
                            {sortedOptions.map((opt, idx) => (
                                <option key={`${opt}-${idx}`} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            readOnly={!isEditing}
                            onDoubleClick={() => !isEditing && handleEditToggle(fieldKey)}
                            placeholder={placeholder || `Enter ${label}`}
                            className="modern-input"
                            style={{
                                backgroundColor: isEditing ? 'white' : '#f8fafc',
                                border: isEditing ? '2px solid #e2e8f0' : '2px solid transparent',
                                color: value ? '#0f172a' : '#94a3b8',
                                boxShadow: isEditing ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                                fontWeight: value ? 700 : 500,
                                cursor: isEditing ? 'text' : 'pointer',
                                padding: '0.85rem 1rem'
                            }}
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '1rem 2rem', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f8fafc', transition: 'all 0.5s ease' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.04em' }}>Production QC Checking</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Precision verification for inventory assurance.</p>
                </div>
                <div style={{
                    background: 'white', padding: '1rem 2.5rem', borderRadius: '24px',
                    border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
                    display: 'flex', alignItems: 'center', gap: '1.5rem'
                }}>
                    <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <i className="fas fa-calendar-alt" style={{ fontSize: '1.2rem' }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Date</div>
                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* Lot Progress Dashboard */}
            {selectedLotId && (
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: '20px',
                    padding: '1rem 2rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                    color: 'white',
                    animation: 'fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative Background Elements */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', position: 'relative', zIndex: 1 }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>Current Lot</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-tag" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                                {lots.find(l => l.id.toString() === selectedLotId)?.lotNumber || 'Active Lot'}
                            </div>
                        </div>
                        <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>QC Progress</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                                {totalCheckedInLot} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>/</span> {totalItemsInLot}
                                <span style={{ fontSize: '0.85rem', background: '#10b981', color: 'white', padding: '3px 10px', borderRadius: '100px', marginLeft: '0.75rem' }}>{progressPercent}%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, maxWidth: '400px', margin: '0 3rem', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <span style={{ color: '#94a3b8' }}>Completion Rate</span>
                            <span style={{ color: '#3b82f6' }}>{progressPercent}%</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden', padding: '2px' }}>
                            <div style={{
                                height: '100%',
                                width: `${progressPercent}%`,
                                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                                borderRadius: '100px',
                                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                                transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Area Card */}
            <div style={{
                background: 'white',
                padding: '1.75rem 2rem',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                marginBottom: '2.5rem',
                display: 'flex',
                gap: '2rem',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                position: 'relative'
            }}>
                <div style={{ flex: 1, minWidth: '350px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div style={{ width: '24px', height: '24px', background: '#3b82f6', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</div>
                        Select Purchase Lot
                    </label>
                    <SearchableDropdown
                        name="lot"
                        value={selectedLotId}
                        options={lotOptions}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                        placeholder="Search or select a lot..."
                        className="modern-input"
                    />
                </div>

                <div style={{ flex: 1, minWidth: '350px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div style={{ width: '24px', height: '24px', background: '#3b82f6', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</div>
                        Select Product From Lot
                    </label>
                    <SearchableDropdown
                        name="product"
                        value={selectedItem?.itemId.toString() || ''}
                        options={itemOptions}
                        onChange={(e) => {
                            const itemId = parseInt(e.target.value);
                            const item = lotItems.find(i => i.itemId === itemId);
                            setSelectedItem(item || null);
                        }}
                        placeholder={!selectedLotId ? "Select a lot first" : (lotItems.length > 0 ? (itemOptions.length > 0 ? "Search items to check..." : "All items in this lot checked!") : "No items found in this lot")}
                        disabled={!selectedLotId || lotItems.length === 0 || itemOptions.length === 0}
                        className="modern-input"
                    />
                </div>
            </div>

            {/* Product Details Section */}
            {selectedItem && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                background: '#3b82f6', boxShadow: '0 0 15px #3b82f6',
                                animation: 'pulse 2s infinite'
                            }}></div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Checking: <span style={{ color: '#3b82f6' }}>{selectedItem.productName}</span>
                            </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{
                                background: 'white',
                                padding: '0.6rem 1.25rem',
                                borderRadius: '14px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ color: '#94a3b8', marginRight: '8px' }}>SKU</span> {formData.sku || 'PENDING'}
                            </div>
                        </div>
                    </div>

                    {loadingDetails ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem', background: 'white', borderRadius: '24px' }}>
                            <LoadingSpinner />
                            <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 500 }}>Fetching master specifications...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                            {/* Identity Card */}
                            <div style={{
                                background: 'white',
                                padding: '1.75rem',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <i className="fas fa-laptop"></i>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Laptop Identity</h3>
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {renderField('Brand', 'brand')}
                                    {renderField('Series', 'series')}
                                    {renderField('Model', 'model')}
                                    {renderField('Serial Number', 'sku')}
                                </div>
                            </div>

                            {/* Performance Card */}
                            <div style={{
                                background: 'white',
                                padding: '1.75rem',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <i className="fas fa-microchip"></i>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Performance Specs</h3>
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {renderField('Processor', 'processor')}
                                    {renderField('Processor Gen', 'processor_gen')}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {renderField('RAM', 'ram')}
                                        {renderField('Storage', 'storage')}
                                    </div>
                                    {renderField('Graphics Card', 'graphics_card')}
                                </div>
                            </div>

                            {/* Display & Interface Card */}
                            <div style={{
                                background: 'white',
                                padding: '1.75rem',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <i className="fas fa-desktop"></i>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Display & Interface</h3>
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {renderField('Screen Size', 'screen_size')}
                                        {renderField('Resolution', 'screen_resolution')}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {renderField('Keyboard', 'keyboard_type')}
                                        {renderField('Backlit', 'keyboard_backlit')}
                                    </div>
                                </div>
                            </div>

                            {/* Quality & Submission Card */}
                            <div style={{
                                background: 'white',
                                padding: '1.75rem',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            <i className="fas fa-shield-alt"></i>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Quality Assurance</h3>
                                    </div>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {renderField('Working Status', 'condition_status')}

                                        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '16px', border: '1px solid #fee2e2' }}>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fas fa-exclamation-triangle"></i>
                                                Final Check
                                            </h4>
                                            <p style={{ fontSize: '0.9rem', color: '#b91c1c', fontWeight: 500, lineHeight: '1.5' }}>
                                                Ensure all physical keys, ports, and display pixels match the reported specifications before submitting.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem' }}>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        style={{
                                            width: '100%',
                                            padding: '1.25rem',
                                            borderRadius: '20px',
                                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                            color: 'white',
                                            border: 'none',
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            fontWeight: 800,
                                            fontSize: '1.1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            boxShadow: '0 15px 30px -10px rgba(15, 23, 42, 0.4)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseOver={(e) => {
                                            if (!saving) {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(15, 23, 42, 0.5)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (!saving) {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(15, 23, 42, 0.4)';
                                            }
                                        }}
                                    >
                                        {saving ? (
                                            <i className="fas fa-circle-notch fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-save"></i>
                                        )}
                                        {saving ? 'Processing Entry...' : 'Complete QC Check'}
                                    </button>
                                </div>
                            </div>

                            {resultMessage && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    zIndex: 9999,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(8px)',
                                    animation: 'fadeIn 0.3s ease-out'
                                }}>
                                    <div style={{
                                        background: 'white',
                                        padding: '3rem 2rem',
                                        borderRadius: '32px',
                                        maxWidth: '450px',
                                        width: '90%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <div style={{
                                            width: '80px', height: '80px', borderRadius: '30px',
                                            background: resultMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '2rem',
                                            marginBottom: '1.5rem',
                                            color: resultMessage.type === 'success' ? '#166534' : '#991b1b',
                                            transform: 'rotate(-5deg)'
                                        }}>
                                            <i className={`fas ${resultMessage.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                        </div>

                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                                            {resultMessage.type === 'success' ? 'Excellent!' : 'Hold On'}
                                        </h3>

                                        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1rem' }}>
                                            {resultMessage.text}
                                        </p>

                                        <button
                                            onClick={() => setResultMessage(null)}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                borderRadius: '16px',
                                                background: '#0f172a',
                                                color: 'white',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                transition: 'all 0.2s shadow'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            {resultMessage.type === 'success' ? 'Complete' : 'Fix Issues'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Print Label Modal */}
            {showPrintModal && printData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ background: 'white', padding: '3rem', borderRadius: '32px', width: '700px', maxWidth: '95%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Label Generated</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Preview your item label and QR code below.</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setShowPrintModal(false)}>
                                <i className="fas fa-times" style={{ color: '#64748b' }}></i>
                            </div>
                        </div>

                        {/* Label Preview Area */}
                        <div ref={printRef} className="print-label-container" style={{
                            position: 'relative',
                            width: labelConfig ? `${labelConfig.width}${labelConfig.unit || 'cm'}` : '100%',
                            height: labelConfig ? `${labelConfig.height}${labelConfig.unit || 'cm'}` : '260px',
                            border: labelConfig?.showBorder ? '1px solid #000' : 'none',
                            borderRadius: labelConfig ? `${labelConfig.borderRadius}px` : '16px',
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            margin: '0 auto',
                            flexShrink: 0
                        }}>
                            {labelConfig ? (
                                <>
                                    {/* Product Name */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${labelConfig.productNamePos.x}${labelConfig.unit || 'cm'}`,
                                        top: `${labelConfig.productNamePos.y}${labelConfig.unit || 'cm'}`,
                                        width: `${labelConfig.productNameWidth}${labelConfig.unit || 'cm'}`,
                                        fontSize: `${labelConfig.productNameSize}pt`,
                                        fontWeight: 900,
                                        lineHeight: 1.1,
                                        textTransform: 'uppercase',
                                        color: '#000',
                                        wordWrap: 'break-word'
                                    }}>
                                        {printData.productName}
                                    </div>

                                    {/* QR Code */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${labelConfig.barcodePos.x}${labelConfig.unit || 'cm'}`,
                                        top: `${labelConfig.barcodePos.y}${labelConfig.unit || 'cm'}`,
                                        transformOrigin: 'top left'
                                    }}>
                                        <div style={{ transform: 'scale(1)' }}>
                                            <QRCodeSVG
                                                value={printData.barcodeValue}
                                                size={labelConfig.barcodeHeight}
                                                level={"H"}
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>

                                    {/* QR Code Text */}
                                    {labelConfig.barcodeTextPos && (
                                        <div style={{
                                            position: 'absolute',
                                            left: `${labelConfig.barcodeTextPos.x}${labelConfig.unit || 'cm'}`,
                                            top: `${labelConfig.barcodeTextPos.y}${labelConfig.unit || 'cm'}`,
                                            fontSize: `${labelConfig.barcodeTextFontSize || 8}pt`,
                                            fontWeight: 700,
                                            color: '#000'
                                        }}>
                                            {printData.barcodeValue}
                                        </div>
                                    )}

                                    {/* Specs */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${labelConfig.specsPos.x}${labelConfig.unit || 'cm'}`,
                                        top: `${labelConfig.specsPos.y}${labelConfig.unit || 'cm'}`,
                                        fontSize: `${labelConfig.specsFontSize}pt`,
                                        lineHeight: labelConfig.specsLineHeight,
                                        fontWeight: 700,
                                        color: '#000'
                                    }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>DISPLAY:</span> {printData.screen_size}"
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>MEMORY:</span> {printData.ram}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>STORAGE:</span> {printData.storage}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>GPU:</span> {printData.graphics_card}
                                        </div>
                                    </div>

                                    {/* Lot Number */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${labelConfig.lotPos.x}${labelConfig.unit || 'cm'}`,
                                        top: `${labelConfig.lotPos.y}${labelConfig.unit || 'cm'}`,
                                        fontSize: `${labelConfig.lotFontSize}pt`,
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        color: '#000'
                                    }}>
                                        LOT: {printData.lotNumber}
                                    </div>
                                </>
                            ) : (
                                /* Fallback to old layout if no config loaded */
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <h4 style={{ margin: '0 0 1rem 0.5rem', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1, color: '#000', width: '90%', textTransform: 'uppercase' }}>
                                        {printData.productName}
                                    </h4>
                                    <div style={{ display: 'flex', flex: 1, width: '100%', alignItems: 'center' }}>
                                        <div style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <QRCodeSVG value={printData.barcodeValue} size={100} level={"H"} includeMargin={false} />
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', marginTop: '4px' }}>
                                                {printData.barcodeValue}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#000', fontWeight: 700 }}>
                                                <div>DISPLAY: {printData.screen_size}"</div>
                                                <div>MEMORY: {printData.ram}</div>
                                                <div>STORAGE: {printData.storage}</div>
                                                <div>GPU: {printData.graphics_card}</div>
                                                <div style={{ marginTop: '0.5rem', fontWeight: 900, fontSize: '1.2rem' }}>LOT: {printData.lotNumber}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div style={{
                            marginTop: '2.5rem',
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '2px solid #f1f5f9',
                            paddingTop: '2rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>Copies:</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <button onClick={() => setCopyCount(Math.max(1, copyCount - 1))} style={{ padding: '0.5rem 1rem', background: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>-</button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={copyCount}
                                        onChange={(e) => setCopyCount(parseInt(e.target.value) || 1)}
                                        style={{ width: '50px', padding: '0.5rem', textAlign: 'center', border: 'none', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                                    />
                                    <button onClick={() => setCopyCount(copyCount + 1)} style={{ padding: '0.5rem 1rem', background: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowPrintModal(false)}
                                    style={{ padding: '1rem 2rem', borderRadius: '16px', border: '2px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
                                >
                                    Review Again
                                </button>
                                <button
                                    onClick={() => {
                                        const style = document.createElement('style');
                                        style.innerHTML = `
                                            @media print {
                                                @page { size: auto; margin: 0mm; }
                                                body * { visibility: hidden; }
                                                .print-label-container, .print-label-container * { visibility: visible; }
                                                .print-label-container { 
                                                    position: fixed !important; 
                                                    left: 0 !important; 
                                                    top: 0 !important; 
                                                    z-index: 2147483647 !important;
                                                    margin: 0 !important; 
                                                    width: ${labelConfig ? `${labelConfig.width}${labelConfig.unit || 'cm'}` : '100%'} !important; 
                                                    height: ${labelConfig ? `${labelConfig.height}${labelConfig.unit || 'cm'}` : 'auto'} !important;
                                                    border: ${labelConfig?.showBorder ? '1px solid #000' : 'none'} !important;
                                                    border-radius: ${labelConfig?.borderRadius || 0}px !important;
                                                    background-color: white !important;
                                                    overflow: hidden !important;
                                                }
                                            }
                                        `;
                                        document.head.appendChild(style);
                                        window.print();
                                        document.head.removeChild(style);
                                    }}
                                    style={{
                                        padding: '1rem 2.5rem',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                                    }}
                                >
                                    <i className="fas fa-print" style={{ marginRight: '10px' }}></i>
                                    Print {copyCount > 1 ? `${copyCount} Labels` : 'Label'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Animations */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

