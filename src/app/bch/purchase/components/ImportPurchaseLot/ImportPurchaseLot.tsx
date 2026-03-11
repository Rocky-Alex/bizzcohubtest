"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ConfirmModal from '@/app/bch/shared/ConfirmModal';

interface ImportPurchaseLotProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function ImportPurchaseLot({ onCancel, onSuccess }: ImportPurchaseLotProps) {
    const [lotMetadata, setLotMetadata] = useState<{
        lotNumber: string;
        supplierName: string;
        supplierId?: number;
        invoiceDate: string;
        invoiceNumber: string;
        notes: string;
        totalCost: string;
    }>({
        lotNumber: '',
        supplierName: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: '',
        totalCost: '0'
    });

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: ''
    });

    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    const [dropLists, setDropLists] = useState<{
        brands: string[];
        series: string[];
        models: string[];
        ram: string[];
        storage: string[];
        processors: string[];
    }>({
        brands: [],
        series: [],
        models: [],
        ram: [],
        storage: [],
        processors: [
            'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
            'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
            'Apple M1', 'Apple M1 Pro', 'Apple M1 Max', 'Apple M2', 'Apple M3'
        ]
    });

    useEffect(() => {
        loadSuppliers();
        fetchDropLists();
    }, []);

    const fetchDropLists = async () => {
        try {
            const categories = 'Laptop,RAM,Storage,Processor';
            const res = await fetch(`/api/bch/inventory/droplists?category=${categories}`);
            const data = await res.json();

            if (data.success && data.categoryData) {
                const laptopData = data.categoryData['Laptop'] || [];
                const ramData = data.categoryData['RAM'] || [];
                const storageData = data.categoryData['Storage'] || [];
                const processorData = data.categoryData['Processor'] || [];

                setDropLists(prev => ({
                    ...prev,
                    brands: Array.from(new Set(laptopData.map((l: any) => l.brand))).filter(Boolean).sort() as string[],
                    series: Array.from(new Set(laptopData.map((l: any) => l.series))).filter(Boolean).sort() as string[],
                    models: Array.from(new Set(laptopData.map((l: any) => l.model))).filter(Boolean).sort() as string[],
                    ram: ramData.map((r: any) => r.value).sort(),
                    storage: storageData.map((s: any) => s.value).sort(),
                    processors: processorData.map((p: any) => p.value).sort()
                }));
            }
        } catch (error) {
            console.error('Failed to fetch drop lists', error);
        }
    };

    const loadSuppliers = async () => {
        try {
            const res = await fetch('/api/bch/purchase/suppliers');
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Failed to load suppliers', error);
        }
    };

    const handleAddSupplier = async () => {
        if (!newSupplierData.name) return;
        try {
            const res = await fetch('/api/bch/purchase/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSupplierData)
            });
            if (res.ok) {
                const newSupplier = await res.json();
                setSuppliers(prev => [newSupplier, ...prev]);
                setLotMetadata(prev => ({
                    ...prev,
                    supplierName: newSupplier.name,
                    supplierId: newSupplier.supplierId
                }));
                setShowAddSupplierModal(false);
                setNewSupplierData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
            }
        } catch (error) {
            console.error('Failed to create supplier', error);
        }
    };

    const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLotMetadata(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // 1. Extract Metadata from specific cells (B1, B2, B3, B4 as per user image)
            const extractedLotNum = worksheet['B1']?.v || '';
            const extractedSupplier = worksheet['B2']?.v || '';
            const extractedDate = worksheet['B3']?.v;
            const extractedInvoiceNum = worksheet['B4']?.v || '';

            // Handle Excel date object vs string
            let formattedDate = new Date().toISOString().split('T')[0];
            if (extractedDate instanceof Date) {
                formattedDate = extractedDate.toISOString().split('T')[0];
            } else if (typeof extractedDate === 'string' && extractedDate.includes('-')) {
                // If it's DD-MM-YYYY, convert to YYYY-MM-DD
                const parts = extractedDate.split('-');
                if (parts.length === 3 && parts[2].length === 4) {
                    formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                    formattedDate = extractedDate;
                }
            }

            setLotMetadata(prev => ({
                ...prev,
                lotNumber: extractedLotNum?.toString() || prev.lotNumber,
                supplierName: extractedSupplier?.toString() || prev.supplierName,
                invoiceNumber: extractedInvoiceNum?.toString() || prev.invoiceNumber,
                invoiceDate: formattedDate,
            }));

            // 2. Extract Items Table starting from Row 6 (index 5)
            // sheet_to_json with range: 5 treats Row 6 as the header row
            const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: 5 });

            // Normalize keys to match our internal schema
            const normalizedData = rawData.map(row => {
                const newRow: any = {};
                const keys = Object.keys(row);

                const getRawVal = (possibleNames: string[]) => {
                    const match = keys.find(k =>
                        possibleNames.some(p => p.toLowerCase() === k.toLowerCase().trim())
                    );
                    return match ? row[match] : undefined;
                };

                newRow['Category'] = getRawVal(['Category', 'Product Type', 'Product Types', 'Type']) || '';
                newRow['Brand'] = getRawVal(['Brand', 'Make', 'Manufacturer', 'Brand Name']) || '';
                newRow['Series'] = getRawVal(['Series', 'Brand Series', 'Line', 'Brand_Series']) || '';
                newRow['Model'] = getRawVal(['Model', 'Product Model', 'Model Name', 'Model No']) || '';
                newRow['Processor'] = getRawVal(['Processor', 'CPU', 'Processor Name']) || '';
                newRow['Processor Gen'] = getRawVal(['Processor Gen', 'Gen', 'Generation', 'Processor Generation', 'Processor_Gen']) || '';
                newRow['RAM'] = getRawVal(['RAM', 'Memory', 'Ram Size']) || '';
                newRow['Storage'] = getRawVal(['Storage', 'HDD', 'SSD', 'Disk', 'Hard Drive']) || '';
                newRow['Graphics'] = getRawVal(['Graphics', 'GPU', 'Video Card', 'Graphic Card']) || '';
                newRow['Screen Size'] = getRawVal(['Screen Size', 'Screen', 'Display', 'Size', 'Inches']) || '';
                newRow['Resolution'] = getRawVal(['Resolution', 'Screen Resolution', 'Display Resolution', 'Res']) || '';
                newRow['Keyboard'] = getRawVal(['Keyboard', 'Keyboard Layout', 'KB']) || '';
                newRow['Backlit'] = getRawVal(['Backlit', 'Backlight', 'Keyboard Backlight']) || '';
                newRow['Condition'] = getRawVal(['Condition', 'Grade', 'Status', 'Condition Status']) || '';
                newRow['Product Name'] = getRawVal(['Product Name', 'Item Name', 'Name']) || '';
                newRow['SKU'] = getRawVal(['SKU', 'Serial', 'Serial Number', 'Product Code', 'Serial #']) || '';
                newRow['Qty'] = getRawVal(['Qty', 'Quantity', 'QTY', 'Count']) || 1;
                newRow['Unit Cost'] = getRawVal(['Unit Cost', 'Cost', 'Price', 'Rate', 'unit_cost']) || 0;

                // Copy any other fields that weren't mapped
                const mappedKeys = ['Category', 'Brand', 'Series', 'Model', 'Processor', 'Processor Gen', 'Product Name', 'SKU', 'Qty', 'Unit Cost'];
                keys.forEach(k => {
                    const isAlreadyMapped = mappedKeys.some(mk => mk.toLowerCase() === k.toLowerCase().trim());
                    if (!isAlreadyMapped) {
                        newRow[k] = row[k];
                    }
                });

                return newRow;
            });

            setPreviewData(normalizedData);
        };
        reader.readAsBinaryString(file);
    };

    const handleUpload = async () => {
        if (!lotMetadata.supplierName || !lotMetadata.invoiceNumber) {
            setConfirmModal({
                isOpen: true,
                title: 'Missing Info',
                message: 'Please provide Supplier Name and Invoice Number.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        if (!previewData.length) {
            setConfirmModal({
                isOpen: true,
                title: 'No Items',
                message: 'Please upload an Excel file or add items manually.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setImportLoading(true);

        try {
            const parseNumber = (val: any) => {
                if (typeof val === 'number') return val;
                if (!val) return 0;
                // Remove any non-numeric chars except dot and minus
                const str = val.toString().replace(/[^0-9.-]/g, '');
                return parseFloat(str) || 0;
            };

            const items = previewData.map((row: any) => {
                // Since we normalize keys in parseFile or manual entry, we can use them directly
                const brand = (row['Brand'] || '').toString().trim();
                const series = (row['Series'] || '').toString().trim();
                const model = (row['Model'] || '').toString().trim();
                const processor = (row['Processor'] || '').toString().trim();
                const gen = (row['Processor Gen'] || '').toString().trim();

                const productType = row['Category'] || 'Product';
                const sku = (row['SKU'] || '').toString().trim();
                const qty = row['Qty'] || 1;
                const cost = row['Unit Cost'] || 0;

                const constructedName = `${brand} ${series} ${model} ${processor} ${gen}`.trim().replace(/\s+/g, ' ');

                return {
                    productType: productType,
                    brand: brand,
                    series: series,
                    model: model,
                    processor: processor,
                    processorGen: gen,
                    ram: (row['RAM'] || '').toString().trim(),
                    storage: (row['Storage'] || '').toString().trim(),
                    graphics: (row['Graphics'] || '').toString().trim(),
                    screenSize: (row['Screen Size'] || '').toString().trim(),
                    screenResolution: (row['Resolution'] || '').toString().trim(),
                    keyboard: (row['Keyboard'] || '').toString().trim(),
                    backlit: (row['Backlit'] || '').toString().trim(),
                    conditionStatus: (row['Condition'] || '').toString().trim(),
                    productName: constructedName || row['Product Name'] || 'Unnamed Product',
                    sku: sku,
                    quantity: parseNumber(qty),
                    unitCost: parseNumber(cost),
                    description: `${brand} ${model} ${processor} ${row['RAM'] || ''} ${row['Storage'] || ''}`.trim(),
                    metadata: row
                };
            }).filter(item => item.productName && item.productName !== 'Unnamed Product');

            if (items.length === 0) {
                throw new Error('No valid items found. Ensure you have a "Product Name" column or valid manual entries.');
            }

            // Calculate Grand Total for the Lot
            const grandTotal = items.reduce((sum: number, item: any) => {
                return sum + (item.quantity * item.unitCost);
            }, 0);

            const response = await fetch('/api/bch/purchase/lots/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotMetadata: { ...lotMetadata, totalCost: grandTotal },
                    items
                })
            });

            if (response.ok) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Success',
                    message: `Successfully imported purchase lot with ${items.length} items!`,
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        onSuccess();
                    }
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to import');
            }
        } catch (error: any) {
            console.error('Error importing purchase lot:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: error.message,
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setImportLoading(false);
        }
    };

    const handleManualAdd = () => {
        const newItem = {
            'Category': '',
            'Brand': '',
            'Series': '',
            'Model': '',
            'Processor': '',
            'Processor Gen': '',
            'Product Name': '',
            'SKU': '',
            'Qty': 1,
            'Unit Cost': 0
        };
        setPreviewData(prev => [...prev, newItem]);
    };

    const handleItemChange = (index: number, key: string, value: string) => {
        const newData = [...previewData];
        newData[index] = { ...newData[index], [key]: value };
        setPreviewData(newData);
    };

    const handleDeleteItem = (index: number) => {
        setPreviewData(prev => prev.filter((_, i) => i !== index));
    };

    const downloadTemplate = () => {
        // Create a worksheet with metadata fields and headers
        const ws = XLSX.utils.aoa_to_sheet([
            ['Lot Number', ''],
            ['Supplier', ''],
            ['Date', 'YYYY-MM-DD'],
            ['Invoice #', ''],
            [],
            ['Category', 'Brand', 'Series', 'Model', 'Processor', 'Gen', 'RAM', 'Storage', 'Graphics', 'Screen Size', 'Resolution', 'Keyboard', 'Backlit', 'Condition', 'SKU', 'Qty', 'Unit Cost', 'Product Name']
        ]);

        // Add sample data starting at Row 7
        XLSX.utils.sheet_add_json(ws, [
            {
                'Category': 'Laptop',
                'Brand': 'Dell',
                'Series': 'Latitude',
                'Model': '5420',
                'Processor': 'Intel Core i5',
                'Gen': '11th',
                'RAM': '16 GB',
                'Storage': '256 GB',
                'Graphics': 'Intel Iris Xe',
                'Screen Size': '14 inch',
                'Resolution': '1920x1080',
                'Keyboard': 'US',
                'Backlit': 'Yes',
                'Condition': 'Grade A',
                'SKU': '5CG22707J5',
                'Qty': 10,
                'Unit Cost': 450,
                'Product Name': 'Dell Latitude 5420'
            }
        ], { skipHeader: true, origin: 'A7' });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "purchase_lot_template.xlsx");
    };

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Import Purchase Lot</h2>
                    <p style={{ color: '#64748b' }}>Upload an Excel file to bulk import items.</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: 'white',
                        color: '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                    <i className="fas fa-download" style={{ color: '#2563eb' }}></i> Download Template
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Supplier Name *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                name="supplierName"
                                value={lotMetadata.supplierName}
                                onChange={(e) => {
                                    handleMetadataChange(e);
                                    setIsSupplierDropdownOpen(true);
                                }}
                                onFocus={() => setIsSupplierDropdownOpen(true)}
                                placeholder="Select or add supplier..."
                                autoComplete="off"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                            />
                            {isSupplierDropdownOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50,
                                    maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
                                }}>
                                    {suppliers
                                        .filter(s => s.name?.toLowerCase().includes(lotMetadata.supplierName.toLowerCase()))
                                        .map(s => (
                                            <div
                                                key={s.supplierId}
                                                onClick={() => {
                                                    setLotMetadata(prev => ({ ...prev, supplierName: s.name, supplierId: s.supplierId }));
                                                    setIsSupplierDropdownOpen(false);
                                                }}
                                                style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#334155' }}
                                            >
                                                {s.name}
                                            </div>
                                        ))
                                    }
                                    <div
                                        onClick={() => {
                                            setNewSupplierData(prev => ({ ...prev, name: lotMetadata.supplierName }));
                                            setShowAddSupplierModal(true);
                                            setIsSupplierDropdownOpen(false);
                                        }}
                                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <i className="fas fa-plus"></i> Add "{lotMetadata.supplierName || 'New Supplier'}"
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setNewSupplierData(prev => ({ ...prev, name: lotMetadata.supplierName }));
                                setShowAddSupplierModal(true);
                            }}
                            title="Add New Supplier"
                            style={{
                                width: '46px',
                                flexShrink: 0,
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2563eb',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                </div>

                {/* Add Supplier Modal */}
                {showAddSupplierModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add New Supplier</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Supplier Name *</label>
                                    <input
                                        value={newSupplierData.name}
                                        onChange={e => setNewSupplierData(prev => ({ ...prev, name: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button onClick={() => setShowAddSupplierModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={handleAddSupplier} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>Save Supplier</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Lot Number</label>
                    <input
                        type="text"
                        name="lotNumber"
                        value={lotMetadata.lotNumber}
                        onChange={handleMetadataChange}
                        placeholder="e.g. CUST-LISTON-CATE-QTY"
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Invoice Number *</label>
                    <input
                        type="text"
                        name="invoiceNumber"
                        value={lotMetadata.invoiceNumber}
                        onChange={handleMetadataChange}
                        placeholder="e.g. INV-001"
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Invoice Date</label>
                    <input
                        type="date"
                        name="invoiceDate"
                        value={lotMetadata.invoiceDate}
                        onChange={handleMetadataChange}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Notes</label>
                <textarea
                    name="notes"
                    value={lotMetadata.notes}
                    onChange={handleMetadataChange}
                    placeholder="Optional notes about this purchase lot..."
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Item List *</label>
                {!file && previewData.length === 0 ? (
                    <div style={{ textAlign: 'center' }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: '12px',
                                padding: '3rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: '#f8fafc',
                                transition: 'all 0.2s',
                                marginBottom: '1rem'
                            }}
                        >
                            <i className="fas fa-file-excel" style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '1rem' }}></i>
                            <p style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Click to upload or drag Excel file</p>
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Expects columns: Product Name, SKU, Quantity, Unit Cost</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls, .csv"
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div style={{ position: 'relative', height: '1px', background: '#e2e8f0', margin: '2rem 1rem' }}>
                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '0 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>OR</span>
                        </div>
                        <button
                            onClick={handleManualAdd}
                            style={{
                                background: 'white',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <i className="fas fa-edit"></i> Manually Add Items
                        </button>
                    </div>
                ) : (
                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className="fas fa-file-alt" style={{ fontSize: '1.25rem', color: '#0284c7' }}></i>
                            <div>
                                <p style={{ fontWeight: 600, color: '#0369a1', marginBottom: '0' }}>{file ? file.name : 'Manual Entry'}</p>
                                <p style={{ fontSize: '0.75rem', color: '#0ea5e9', margin: '0' }}>{previewData.length} items</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleManualAdd}
                                style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', color: '#0369a1', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                <i className="fas fa-plus"></i> Add More
                            </button>
                            <button
                                onClick={() => { setFile(null); setPreviewData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {previewData.length > 0 && (
                <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
                                <tr>
                                    <th style={{ width: '40px', padding: '0.75rem' }}></th>
                                    {Object.keys(previewData[0]).map(k => (
                                        <th key={k} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>{k}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeleteItem(i)}
                                                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                                title="Remove Item"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                        {Object.keys(row).map((key) => (
                                            <td key={key} style={{ padding: '0.25rem 0.5rem' }}>
                                                <input
                                                    list={
                                                        key === 'Category' ? "categoryOptions" :
                                                            key === 'Brand' ? "brandOptions" :
                                                                key === 'Series' ? "seriesOptions" :
                                                                    key === 'Model' ? "modelOptions" :
                                                                        (key.includes('RAM') || key.includes('Memory')) ? "ramOptions" :
                                                                            (key.includes('Storage') || key.includes('HDD') || key.includes('SSD')) ? "storageOptions" :
                                                                                (key.includes('Processor') || key.includes('CPU')) ? "processorOptions" :
                                                                                    undefined
                                                    }
                                                    value={row[key]}
                                                    onChange={(e) => handleItemChange(i, key, e.target.value)}
                                                    placeholder={key === 'Category' ? "Select..." : undefined}
                                                    style={{
                                                        width: '100%',
                                                        minWidth: key === 'Product Name' ? '180px' : (key === 'Category' ? '150px' : '80px'),
                                                        padding: '0.4rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '0.85rem'
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                    onClick={onCancel}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleUpload}
                    disabled={importLoading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: importLoading ? '#94a3b8' : '#2563eb',
                        color: 'white',
                        fontWeight: 600,
                        cursor: importLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {importLoading ? <><i className="fas fa-spinner fa-spin"></i> Importing...</> : <><i className="fas fa-cloud-upload-alt"></i> Import Now</>}
                </button>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />
            <datalist id="categoryOptions">
                <option value="Renewed Laptops" />
                <option value="MacBook" />
                <option value="Accessories" />
                <option value="Gaming Laptop" />
            </datalist>
            <datalist id="brandOptions">
                {dropLists.brands.map(b => (
                    <option key={b} value={b} />
                ))}
            </datalist>
            <datalist id="seriesOptions">
                {dropLists.series.map(s => (
                    <option key={s} value={s} />
                ))}
            </datalist>
            <datalist id="modelOptions">
                {dropLists.models.map(m => (
                    <option key={m} value={m} />
                ))}
            </datalist>
            <datalist id="ramOptions">
                {dropLists.ram.map(r => (
                    <option key={r} value={r} />
                ))}
            </datalist>
            <datalist id="storageOptions">
                {dropLists.storage.map(s => (
                    <option key={s} value={s} />
                ))}
            </datalist>
            <datalist id="processorOptions">
                {dropLists.processors.map(p => (
                    <option key={p} value={p} />
                ))}
            </datalist>
        </div>
    );
}
