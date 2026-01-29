"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { QRCodeCanvas } from 'qrcode.react';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
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

    // Dependent Dropdown Data
    const [laptopModelsList, setLaptopModelsList] = useState<any[]>([]);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [availableSeries, setAvailableSeries] = useState<string[]>([]);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [availableRam, setAvailableRam] = useState<string[]>([]);
    const [availableStorage, setAvailableStorage] = useState<string[]>([]);
    const [availableGraphics, setAvailableGraphics] = useState<string[]>([]);
    const [availableProcessors, setAvailableProcessors] = useState<string[]>([]);
    const [availableGen, setAvailableGen] = useState<string[]>([]);
    const [availableScreenSizes, setAvailableScreenSizes] = useState<string[]>([]);
    const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
    const [availableKeyboardTypes, setAvailableKeyboardTypes] = useState<string[]>([]);
    const [availableKeyboardBacklit, setAvailableKeyboardBacklit] = useState<string[]>([]);
    const [availableConditions, setAvailableConditions] = useState<string[]>([]);

    useEffect(() => {
        fetchLots();
        fetchLaptopModels();
        fetchOtherOptions();
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

    const fetchLaptopModels = async () => {
        try {
            const response = await fetch('/api/admin/inventory/droplists?category=Laptop');
            const data = await response.json();
            if (data.success) {
                setLaptopModelsList(data.data);
                const brands = Array.from(new Set(data.data.map((m: any) => m.brand))).filter(Boolean) as string[];
                setAvailableBrands(brands.sort());
            }
        } catch (error) {
            console.error('Error fetching laptop models:', error);
        }
    };

    // Derived Memoized Options for SearchableDropdowns
    const lotOptions = useMemo(() => lots.map(lot => ({
        label: `${lot.lotNumber || `Lot #${lot.lotId}`} - ${lot.supplierName}`,
        value: lot.lotId.toString()
    })), [lots]);

    const itemOptions = useMemo(() => lotItems.filter(item => (item.qcCount || 0) < item.quantity).map(item => ({
        label: `${item.productName} (${item.quantity - (item.qcCount || 0)} left)`,
        value: item.itemId.toString()
    })), [lotItems]);

    const totalItemsInLot = useMemo(() => lotItems.reduce((acc, item) => acc + item.quantity, 0), [lotItems]);
    const totalCheckedInLot = useMemo(() => lotItems.reduce((acc, item) => acc + (item.qcCount || 0), 0), [lotItems]);
    const progressPercent = useMemo(() => totalItemsInLot > 0 ? Math.round((totalCheckedInLot / totalItemsInLot) * 100) : 0, [totalItemsInLot, totalCheckedInLot]);

    const fetchOtherOptions = async () => {
        try {
            const categories = [
                { cat: 'RAM', set: setAvailableRam },
                { cat: 'Storage', set: setAvailableStorage },
                { cat: 'Graphics', set: setAvailableGraphics },
                { cat: 'Processor', set: setAvailableProcessors },
                { cat: 'Gen', set: setAvailableGen },
                { cat: 'Screen Size', set: setAvailableScreenSizes },
                { cat: 'Resolution', set: setAvailableResolutions },
                { cat: 'Keyboard Type', set: setAvailableKeyboardTypes },
                { cat: 'Keyboard Backlit', set: setAvailableKeyboardBacklit },
                { cat: 'Condition', set: setAvailableConditions }
            ];

            const results = await Promise.all(
                categories.map(c => fetch(`/api/admin/inventory/droplists?category=${c.cat}`).then(r => r.json()))
            );

            results.forEach((res, idx) => {
                if (res.success) {
                    categories[idx].set(res.data.map((i: any) => i.value));
                }
            });
        } catch (error) {
            console.error('Error fetching other options:', error);
        }
    };

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
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Clear dependent fields if parent changes
            if (field === 'brand') {
                newData.series = '';
                newData.model = '';
            } else if (field === 'series') {
                newData.model = '';
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
        if (fieldKey === 'processor_gen') options = availableGen;
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
            const sizeFields = ['ram', 'storage', 'screen_size'];
            if (sizeFields.includes(fieldKey)) {
                return parseValue(a) - parseValue(b);
            }
            // Default alphabetical sort for everything else
            return a.localeCompare(b);
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
            <div style={{ marginBottom: '0.5rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <label
                        onDoubleClick={() => !isEditing && handleEditToggle(fieldKey)}
                        style={{
                            fontWeight: 800,
                            color: '#1e293b',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: isEditing ? 'default' : 'pointer'
                        }}
                    >
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: isEditing ? '#eff6ff' : '#f8fafc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.3s'
                        }}>
                            <i className={`fas ${getIcon(fieldKey)}`} style={{ color: isEditing ? '#3b82f6' : '#94a3b8', fontSize: '0.9rem' }}></i>
                        </div>
                        {label}
                    </label>
                    <button
                        onClick={() => handleEditToggle(fieldKey)}
                        style={{
                            background: isEditing ? '#dcfce7' : 'transparent',
                            border: 'none',
                            color: isEditing ? '#166534' : '#94a3b8',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                        onMouseOver={(e) => { if (!isEditing) e.currentTarget.style.color = '#3b82f6'; }}
                        onMouseOut={(e) => { if (!isEditing) e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        {isEditing ? (
                            <>
                                <i className="fas fa-check"></i>
                                Save
                            </>
                        ) : (
                            <>
                                <i className="fas fa-pen"></i>
                                Edit
                            </>
                        )}
                    </button>
                </div>
                <div style={{ position: 'relative' }}>
                    {isDropdown && isEditing ? (
                        <SearchableDropdown
                            name={fieldKey}
                            value={value}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            options={sortedOptions}
                            placeholder={`Select ${label}`}
                        />
                    ) : (
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            readOnly={!isEditing}
                            onDoubleClick={() => !isEditing && handleEditToggle(fieldKey)}
                            placeholder={placeholder || `Enter ${label}`}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1.1rem',
                                borderRadius: '14px',
                                border: `2px solid ${isEditing ? '#3b82f6' : 'transparent'}`,
                                outline: 'none',
                                color: value ? '#1e293b' : '#94a3b8',
                                backgroundColor: isEditing ? 'white' : 'rgba(241, 245, 249, 0.4)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontSize: '0.875rem',
                                fontWeight: value ? 700 : 500,
                                cursor: isEditing ? 'text' : 'pointer',
                                boxShadow: isEditing ? '0 10px 15px -3px rgba(59, 130, 246, 0.12)' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
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
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.04em' }}>QC Checking</h1>
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
                                {lots.find(l => l.lotId.toString() === selectedLotId)?.lotNumber || 'Active Lot'}
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
                            const item = lotItems.find(i => i.itemId.toString() === e.target.value);
                            setSelectedItem(item || null);
                        }}
                        placeholder={!selectedLotId ? "Select a lot first" : "Search items to check..."}
                        disabled={!selectedLotId || lotItems.length === 0}
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
                            border: '2px solid #000', borderRadius: '16px', padding: '1.5rem',
                            display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', height: '260px',
                            boxSizing: 'border-box', backgroundColor: 'white', overflow: 'hidden'
                        }}>
                            {/* Top: Product Title */}
                            <h4 style={{ margin: '0 0 1rem 0.5rem', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1, color: '#000', width: '90%', textTransform: 'uppercase' }}>
                                {printData.productName}
                            </h4>

                            {/* Bottom Content Row */}
                            <div style={{ display: 'flex', flex: 1, width: '100%', alignItems: 'center' }}>
                                {/* Left: QR Code */}
                                <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ border: '2px solid #f1f5f9', padding: '8px', borderRadius: '12px' }}>
                                        <QRCodeCanvas
                                            value={printData.barcodeValue}
                                            size={120}
                                        />
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '0.75rem', color: '#000', letterSpacing: '0.1em' }}>
                                        #{printData.barcodeValue}
                                    </div>
                                </div>

                                {/* Middle: Details */}
                                <div style={{ flex: 1, paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#000', fontWeight: 700 }}>
                                        <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: 500 }}>DISPLAY:</span> {printData.screen_size}"</div>
                                        <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: 500 }}>MEMORY:</span> {printData.ram}</div>
                                        <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: 500 }}>STORAGE:</span> {printData.storage}</div>
                                        <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: 500 }}>GPU:</span> {printData.graphics_card}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Vertical Text */}
                            <div style={{
                                position: 'absolute', right: '-45px', top: '50%',
                                transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center',
                                whiteSpace: 'nowrap', fontSize: '1.4rem', fontWeight: 900, color: '#000',
                                background: '#f1f5f9', padding: '4px 20px', borderRadius: '4px'
                            }}>
                                LOT: {printData.lotNumber}
                            </div>
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
                                                body * { visibility: hidden; }
                                                .print-label-container, .print-label-container * { visibility: visible; }
                                                .print-label-container { 
                                                    position: absolute; left: 0; top: 0; margin: 0; 
                                                    width: 100% !important; height: auto !important; border: 2px solid #000 !important;
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

