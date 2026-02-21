
"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import ConfirmModal from '@/app/admin/shared/ConfirmModal';

interface FullImportProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function ImportFullPurchase({ onCancel, onSuccess }: FullImportProps) {
    // 1. Header Metadata State
    const [lotMetadata, setLotMetadata] = useState<{
        lotNumber: string;
        supplierName: string;
        supplierId?: number;
        invoiceDate: string;
        invoiceNumber: string;
        notes: string;
        totalCost: number;
    }>({
        lotNumber: '',
        supplierName: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: '',
        totalCost: 0
    });

    // 2. Data Lists State
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({
        name: '', contactPerson: '', phone: '', email: '', address: ''
    });

    const [dropLists, setDropLists] = useState<{
        brands: string[]; series: string[]; models: string[];
        ram: string[]; storage: string[]; processors: string[];
    }>({
        brands: [], series: [], models: [],
        ram: [], storage: [], processors: []
    });

    // 3. File & Items State
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 4. Manual Add Item Modal State
    const [isManualItemModalOpen, setIsManualItemModalOpen] = useState(false);
    const [manualItem, setManualItem] = useState({
        category: 'Laptop', brand: '', series: '', model: '', productName: '',
        processor: '', gen: '', ram: '', storage: '', graphics: '',
        screenSize: '', resolution: '', keyboard: '', backlit: '', condition: '',
        sku: '', qty: 1, unitCost: 0
    });

    // 5. Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: React.ReactNode;
        onConfirm: () => void; type: 'danger' | 'info' | 'success'; singleButton?: boolean;
    }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger'
    });

    useEffect(() => {
        loadSuppliers();
        fetchDropLists();
    }, []);

    // --- Data Fetching ---
    const loadSuppliers = async () => {
        try {
            const res = await fetch('/api/admin/purchase/suppliers');
            if (res.ok) setSuppliers(await res.json());
        } catch (error) {
            console.error('Failed to load suppliers', error);
        }
    };

    const fetchDropLists = async () => {
        try {
            const categories = 'Laptop,RAM,Storage,Processor';
            const res = await fetch(`/api/admin/inventory/droplists?category=${categories}`);
            const data = await res.json();
            if (data.success && data.categoryData) {
                const laptopData = data.categoryData['Laptop'] || [];
                setDropLists({
                    brands: Array.from(new Set(laptopData.map((l: any) => l.brand))).filter(Boolean).sort() as string[],
                    series: Array.from(new Set(laptopData.map((l: any) => l.series))).filter(Boolean).sort() as string[],
                    models: Array.from(new Set(laptopData.map((l: any) => l.model))).filter(Boolean).sort() as string[],
                    ram: (data.categoryData['RAM'] || []).map((r: any) => r.value).sort(),
                    storage: (data.categoryData['Storage'] || []).map((s: any) => s.value).sort(),
                    processors: (data.categoryData['Processor'] || []).map((p: any) => p.value).sort()
                });
            }
        } catch (error) {
            console.error('Failed to fetch drop lists', error);
        }
    };

    const handleAddSupplier = async () => {
        if (!newSupplierData.name) return;
        try {
            const res = await fetch('/api/admin/purchase/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSupplierData)
            });
            if (res.ok) {
                const newSupplier = await res.json();
                setSuppliers(prev => [newSupplier, ...prev]);
                setLotMetadata(prev => ({ ...prev, supplierName: newSupplier.name, supplierId: newSupplier.supplierId }));
                setShowAddSupplierModal(false);
                setNewSupplierData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
                toast.success("Supplier added successfully");
            }
        } catch (error) {
            toast.error("Failed to add supplier");
        }
    };

    // --- Input Handlers ---
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

    // --- Parsing Logic (Kept from ImportFullPurchase but adapted) ---
    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // 1. Extract Metadata from specific cells (B1, B2, B3, B4, B5)
            const extractedLotNum = worksheet['B1']?.v || '';
            const extractedSupplier = worksheet['B2']?.v || '';
            const extractedDate = worksheet['B3']?.v;
            const extractedInvoiceNum = worksheet['B4']?.v || '';
            const extractedNotes = worksheet['B5']?.v || '';

            // Handle Excel date
            let formattedDate = new Date().toISOString().split('T')[0];

            // Debug log to see what we are getting
            console.log("Raw Extracted Date:", extractedDate);

            if (extractedDate instanceof Date) {
                formattedDate = extractedDate.toISOString().split('T')[0];
            } else if (typeof extractedDate === 'string') {
                const cleanDate = extractedDate.trim();

                // Check if it's accidentally an invoice number starting with INV
                if (cleanDate.toUpperCase().startsWith('INV')) {
                    // It's likely the user swapped the columns or the template is misread
                    // We don't want to use this as a date. 
                    // We'll keep the default today's date or try to find date elsewhere.
                    console.warn("Date field looks like Invoice Number:", cleanDate);
                }
                // Try parsing YYYY-MM-DD or DD-MM-YYYY
                else if (cleanDate.includes('-')) {
                    const parts = cleanDate.split('-');
                    if (parts.length === 3) {
                        // Assumption: if first part is 4 digits, it's YYYY-MM-DD
                        if (parts[0].length === 4) {
                            formattedDate = cleanDate;
                        }
                        // Assumption: if last part is 4 digits, it's DD-MM-YYYY
                        else if (parts[2].length === 4) {
                            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }
                }
            }

            // Only update metadata IF values are found in the Excel
            if (extractedSupplier || extractedInvoiceNum) {
                setLotMetadata(prev => ({
                    ...prev,
                    lotNumber: extractedLotNum?.toString() || prev.lotNumber,
                    supplierName: extractedSupplier?.toString() || prev.supplierName,
                    invoiceNumber: extractedInvoiceNum?.toString() || prev.invoiceNumber,
                    invoiceDate: extractedDate ? formattedDate : prev.invoiceDate,
                    notes: extractedNotes?.toString() || prev.notes
                }));
                if (extractedSupplier) {
                    const existingSup = suppliers.find(s => s.name?.toLowerCase() === extractedSupplier.toString().toLowerCase());
                    if (existingSup) {
                        setLotMetadata(prev => ({ ...prev, supplierId: existingSup.supplierId }));
                    }
                }
            }

            // 2. Parse Items
            let rangeOffset = 6; // Starts reading from row 7 (index 6)

            // If A7 isn't "Category" or "Product", maybe it's a flat file without metadata
            if (!worksheet['A7'] || (worksheet['A7'].v !== 'Category' && worksheet['A7'].v !== 'Product')) {
                rangeOffset = 0;
            }

            const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: rangeOffset, defval: '' });

            const normalized = rawData.map(row => {
                const newRow: any = {};
                const keys = Object.keys(row);
                const findVal = (possible: string[]) => {
                    const k = keys.find(key => possible.some(p => p.toLowerCase() === key.toLowerCase().trim()));
                    return k ? row[k] : undefined;
                };

                // Map Item Fields
                newRow['Category'] = findVal(['Category', 'Type', 'Product Type']) || 'Laptop';
                newRow['Brand'] = findVal(['Brand', 'Make']) || '';
                newRow['Series'] = findVal(['Series']) || '';
                newRow['Model'] = findVal(['Model', 'Product Model']) || '';
                newRow['productName'] = findVal(['Product Name', 'Item Name']) || ''; // internal key
                newRow['Processor'] = findVal(['Processor', 'CPU']) || '';
                newRow['Gen'] = findVal(['Gen', 'Generation', 'Processor Gen']) || '';
                newRow['RAM'] = findVal(['RAM', 'Memory']) || '';
                newRow['Storage'] = findVal(['Storage', 'HDD', 'SSD']) || '';
                newRow['Graphics'] = findVal(['Graphics', 'GPU', 'VGA']) || '';
                newRow['Screen Size'] = findVal(['Screen Size', 'Display Size', 'Size']) || '';
                newRow['Resolution'] = findVal(['Resolution', 'Screen Resolution']) || '';
                newRow['Keyboard'] = findVal(['Keyboard', 'Keyboard Type']) || '';
                newRow['Backlit'] = findVal(['Backlit', 'Keyboard Backlit']) || '';
                newRow['Condition'] = findVal(['Condition', 'Status']) || '';
                newRow['SKU'] = findVal(['SKU', 'Serial', 'Serial Number']) || '';
                newRow['Qty'] = parseInt(findVal(['Qty', 'Quantity', 'Count']) || '1') || 1;
                newRow['Unit Cost'] = parseFloat(findVal(['Unit Cost', 'Price', 'Cost']) || '0') || 0;

                // Auto-generate Product Name if missing
                if (!newRow['productName']) {
                    newRow['productName'] = `${newRow['Brand']} ${newRow['Series']} ${newRow['Model']}`.trim();
                }

                return newRow;
            }).filter(item => item['Brand'] || item['productName'] || item['SKU']); // Filter empty rows

            setPreviewData(normalized);
        };
        reader.readAsBinaryString(file);
    };

    // --- Manual Item Handling ---
    const handleAddManualItem = () => {
        const item = {
            'Category': manualItem.category,
            'Brand': manualItem.brand,
            'Series': manualItem.series,
            'Model': manualItem.model,
            'productName': manualItem.productName || `${manualItem.brand} ${manualItem.series} ${manualItem.model}`.trim(),
            'Processor': manualItem.processor,
            'Gen': manualItem.gen,
            'RAM': manualItem.ram,
            'Storage': manualItem.storage,
            'Graphics': manualItem.graphics,
            'Screen Size': manualItem.screenSize,
            'Resolution': manualItem.resolution,
            'Keyboard': manualItem.keyboard,
            'Backlit': manualItem.backlit,
            'Condition': manualItem.condition,
            'SKU': manualItem.sku,
            'Qty': manualItem.qty,
            'Unit Cost': manualItem.unitCost
        };
        setPreviewData(prev => [...prev, item]);
        setIsManualItemModalOpen(false);
        // Reset (optional)
        setManualItem(prev => ({ ...prev, sku: '', qty: 1 }));
        toast.success("Item added");
    };

    const handleDeleteItem = (index: number) => {
        setPreviewData(prev => prev.filter((_, i) => i !== index));
    };

    // --- Final Import ---
    const handleImport = async () => {
        if (!lotMetadata.supplierName || !lotMetadata.invoiceNumber) {
            toast.error("Please fill in Supplier Name and Invoice Number");
            return;
        }
        if (previewData.length === 0) {
            toast.error("No items to import");
            return;
        }

        setImportLoading(true);

        try {
            // Construct Payload for /api/admin/purchase/import-full
            // It expects { lots: [ { metadata: {...}, items: [...] } ] }

            const lotItems = previewData.map(row => ({
                productType: row['Category'],
                productName: row['productName'],
                brand: row['Brand'],
                series: row['Series'],
                model: row['Model'],
                processor: row['Processor'],
                processorGen: row['Gen'],
                ram: row['RAM'],
                storage: row['Storage'],
                graphics: row['Graphics'],
                screenSize: row['Screen Size'],
                screenResolution: row['Resolution'],
                keyboardType: row['Keyboard'],
                keyboardBacklit: row['Backlit'],
                conditionStatus: row['Condition'],
                sku: row['SKU'],
                quantity: row['Qty'],
                unitCost: row['Unit Cost']
            }));

            const totalCost = lotItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

            const payload = {
                lots: [{
                    metadata: {
                        supplierName: lotMetadata.supplierName,
                        supplierId: lotMetadata.supplierId,
                        invoiceNumber: lotMetadata.invoiceNumber,
                        invoiceDate: lotMetadata.invoiceDate,
                        totalCost: totalCost,
                        notes: lotMetadata.notes, // New field
                        lotNumber: lotMetadata.lotNumber
                    },
                    items: lotItems
                }]
            };

            const res = await fetch('/api/admin/purchase/import-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Successfully imported purchase lot!`);
                onSuccess();
            } else {
                toast.error("Import failed: " + data.error);
            }
        } catch (e) {
            console.error(e);
            toast.error("Error importing data");
        } finally {
            setImportLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        // Create Headers
        const ws = XLSX.utils.aoa_to_sheet([
            ['Lot Number', ''],
            ['Supplier Name', ''],
            ['Invoice Date', 'YYYY-MM-DD'],
            ['Invoice Number', ''],
            ['Notes', ''],
            [], // Empty row for separation
            [
                'Category', 'Brand', 'Series', 'Model',
                'Processor', 'Gen', 'RAM', 'Storage', 'Graphics',
                'Screen Size', 'Resolution', 'Keyboard', 'Backlit', 'Condition',
                'SKU', 'Qty', 'Unit Cost', 'Product Name'
            ]
        ]);

        // Sample Row (Row 8)
        XLSX.utils.sheet_add_json(ws, [
            {
                'Category': 'Laptop',
                'Brand': 'Dell',
                'Series': 'Latitude',
                'Model': '5420',
                'Processor': 'i5-1145G7',
                'Gen': '11th',
                'RAM': '16GB',
                'Storage': '256GB SSD',
                'Graphics': 'Intel Iris Xe',
                'Screen Size': '14 inch',
                'Resolution': '1920x1080',
                'Keyboard': 'US',
                'Backlit': 'Yes',
                'Condition': 'Grade A',
                'SKU': 'DELL-5420-001',
                'Qty': 5,
                'Unit Cost': 450,
                'Product Name': ''
            }
        ], { skipHeader: true, origin: 'A8' });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Full_Purchase_Import_Template.xlsx");
    };

    return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', minHeight: '80vh', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>

            {/* 1. Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Import Purchase (Full Details)</h2>
                    <p style={{ color: '#64748b' }}>Upload an Excel file with detailed specs to bulk import items.</p>
                </div>
                <button
                    onClick={handleDownloadTemplate}
                    style={{
                        padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px',
                        cursor: 'pointer', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem'
                    }}
                >
                    <i className="fas fa-file-download"></i> Download Template
                </button>
            </div>

            {/* 2. Lot Metadata Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Supplier Field */}
                <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Supplier Name *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '100%', position: 'relative' }}>
                            <input
                                type="text"
                                name="supplierName"
                                value={lotMetadata.supplierName}
                                onChange={(e) => { handleMetadataChange(e); setIsSupplierDropdownOpen(true); }}
                                onFocus={() => setIsSupplierDropdownOpen(true)}
                                placeholder="Select or add supplier..."
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                autoComplete="off"
                            />
                            {isSupplierDropdownOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto'
                                }}>
                                    {suppliers.filter(s => s.name?.toLowerCase().includes(lotMetadata.supplierName.toLowerCase())).map(s => (
                                        <div key={s.supplierId}
                                            onClick={() => { setLotMetadata(p => ({ ...p, supplierName: s.name, supplierId: s.supplierId })); setIsSupplierDropdownOpen(false); }}
                                            style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}
                                        >
                                            {s.name}
                                        </div>
                                    ))}
                                    <div onClick={() => { setNewSupplierData(p => ({ ...p, name: lotMetadata.supplierName })); setShowAddSupplierModal(true); setIsSupplierDropdownOpen(false); }}
                                        style={{ padding: '0.5rem', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: '0.9rem', background: '#f8fafc' }}>
                                        <i className="fas fa-plus"></i> Add New
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Lot Number</label>
                    <input
                        type="text"
                        name="lotNumber"
                        value={lotMetadata.lotNumber}
                        onChange={handleMetadataChange}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        placeholder="Optional"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Invoice Number *</label>
                    <input
                        type="text"
                        name="invoiceNumber"
                        value={lotMetadata.invoiceNumber}
                        onChange={handleMetadataChange}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        placeholder="e.g. INV-001"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Invoice Date</label>
                    <input
                        type="date"
                        name="invoiceDate"
                        value={lotMetadata.invoiceDate}
                        onChange={handleMetadataChange}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Notes</label>
                <textarea
                    name="notes"
                    value={lotMetadata.notes}
                    onChange={handleMetadataChange}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                    placeholder="Optional notes..."
                />
            </div>

            {/* 3. Items List Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Item List</h3>

                {/* File Upload Area */}
                {!file && previewData.length === 0 ? (
                    <div style={{ textAlign: 'center' }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed #cbd5e1', padding: '3rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', borderRadius: '12px', marginBottom: '2rem'
                            }}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .csv" style={{ display: 'none' }} />
                            <i className="fas fa-file-excel" style={{ fontSize: '2rem', color: '#10b981', marginBottom: '1rem' }}></i>
                            <p style={{ fontWeight: 600, color: '#475569' }}>Click to Upload Excel Sheet</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Expects columns: Product Name, SKU, Qty, Unit Cost, + Specs</p>
                        </div>
                        <div style={{ position: 'relative', height: '1px', background: '#e2e8f0', margin: '2rem 1rem' }}>
                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '0 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>OR</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => setIsManualItemModalOpen(true)}
                                style={{
                                    padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
                                    fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <i className="fas fa-edit"></i> Manually Add Items
                            </button>
                        </div>
                    </div>
                ) : (
                    // File / Items Info and Actions
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <strong style={{ color: '#0369a1' }}>{file ? file.name : 'Manual Entry List'}</strong>
                                <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#64748b' }}>{previewData.length} Items</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => setIsManualItemModalOpen(true)} style={{ background: 'white', border: '1px solid #bae6fd', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', color: '#0369a1' }}>
                                    <i className="fas fa-plus"></i> Add More
                                </button>
                                <button onClick={() => { setFile(null); setPreviewData([]); }} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '500px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>#</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Product</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Specs</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Qty</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Cost</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Total</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{i + 1}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                                {row['productName']}
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{row['SKU']}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#64748b' }}>
                                                {`${row['Processor'] || ''} ${row['RAM'] || ''} ${row['Storage'] || ''} ${row['Graphics'] || ''}`.trim() || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row['Qty']}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{row['Unit Cost']}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{(row['Qty'] * row['Unit Cost']).toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <button onClick={() => handleDeleteItem(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                    onClick={onCancel}
                    style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleImport}
                    disabled={importLoading}
                    style={{
                        padding: '0.75rem 2rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px',
                        fontWeight: 600, cursor: importLoading ? 'wait' : 'pointer', fontSize: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    {importLoading ? 'Processing...' : 'Import Now'}
                </button>
            </div>

            {/* Add Supplier Modal */}
            {showAddSupplierModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Add New Supplier</h3>
                        <input value={newSupplierData.name} onChange={e => setNewSupplierData(p => ({ ...p, name: e.target.value }))} placeholder="Supplier Name" style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setShowAddSupplierModal(false)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                            <button onClick={handleAddSupplier} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Item Modal (Simplified) */}
            {isManualItemModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>Add Item Manually</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem' }}>Category</label>
                                <select value={manualItem.category} onChange={e => setManualItem({ ...manualItem, category: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                    <option value="Laptop">Laptop</option><option value="Desktop">Desktop</option><option value="Monitor">Monitor</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem' }}>Brand</label>
                                <input value={manualItem.brand} onChange={e => setManualItem({ ...manualItem, brand: e.target.value })} list="brandList" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                <datalist id="brandList">{dropLists.brands.map(b => <option key={b} value={b} />)}</datalist>
                            </div>
                            <div><label style={{ fontSize: '0.8rem' }}>Series</label><input value={manualItem.series} onChange={e => setManualItem({ ...manualItem, series: e.target.value })} list="seriesList" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /><datalist id="seriesList">{dropLists.series.map(s => <option key={s} value={s} />)}</datalist></div>
                            <div><label style={{ fontSize: '0.8rem' }}>Model</label><input value={manualItem.model} onChange={e => setManualItem({ ...manualItem, model: e.target.value })} list="modelList" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /><datalist id="modelList">{dropLists.models.map(m => <option key={m} value={m} />)}</datalist></div>

                            <div><label style={{ fontSize: '0.8rem' }}>Processor</label><input value={manualItem.processor} onChange={e => setManualItem({ ...manualItem, processor: e.target.value })} list="procList" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /><datalist id="procList">{dropLists.processors.map(p => <option key={p} value={p} />)}</datalist></div>
                            <div><label style={{ fontSize: '0.8rem' }}>Gen</label><input value={manualItem.gen} onChange={e => setManualItem({ ...manualItem, gen: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontSize: '0.8rem' }}>RAM</label><input value={manualItem.ram} onChange={e => setManualItem({ ...manualItem, ram: e.target.value })} list="ramList" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /><datalist id="ramList">{dropLists.ram.map(r => <option key={r} value={r} />)}</datalist></div>
                            <div><label style={{ fontSize: '0.8rem' }}>Storage</label><input value={manualItem.storage} onChange={e => setManualItem({ ...manualItem, storage: e.target.value })} list="storageList" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /><datalist id="storageList">{dropLists.storage.map(s => <option key={s} value={s} />)}</datalist></div>

                            {/* Additional Specs */}
                            <div><label style={{ fontSize: '0.8rem' }}>Graphics</label><input value={manualItem.graphics} onChange={e => setManualItem({ ...manualItem, graphics: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontSize: '0.8rem' }}>Screen Size</label><input value={manualItem.screenSize} onChange={e => setManualItem({ ...manualItem, screenSize: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontSize: '0.8rem' }}>Condition</label><input value={manualItem.condition} onChange={e => setManualItem({ ...manualItem, condition: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontSize: '0.8rem' }}>Backlit</label><select value={manualItem.backlit} onChange={e => setManualItem({ ...manualItem, backlit: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}><option value="">-</option><option value="Yes">Yes</option><option value="No">No</option></select></div>

                            <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '0.8rem' }}>SKU</label><input value={manualItem.sku} onChange={e => setManualItem({ ...manualItem, sku: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Qty</label><input type="number" value={manualItem.qty} onChange={e => setManualItem({ ...manualItem, qty: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Unit Cost</label><input type="number" value={manualItem.unitCost} onChange={e => setManualItem({ ...manualItem, unitCost: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setIsManualItemModalOpen(false)} style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', background: 'white', borderRadius: '4px' }}>Cancel</button>
                            <button onClick={handleAddManualItem} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>Add Item</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}
