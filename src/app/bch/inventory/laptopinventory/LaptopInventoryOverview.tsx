"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/laptop-inventory.css';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface LaptopItem {
    id: number;
    lot_number: string;
    sku: string;
    barcode: string;
    product_name: string;
    brand: string;
    series: string;
    model: string;
    processor: string;
    processor_gen: string;
    ram: string;
    storage: string;
    graphics_card: string;
    screen_size: string;
    screen_resolution: string;
    keyboard_type: string;
    keyboard_backlit: string;
    condition_status: string;
    qc_status: string;
    quantity: number;
    stock_balance: number;
    base_price: number;
    offer_price: number;
    created_at: string;
    updated_at: string;
}

interface Dropdowns {
    brands: string[];
    processors: string[];
    rams: string[];
    storages: string[];
    conditions: string[];
}

export default function LaptopInventoryOverview() {
    // List & pagination state
    const [items, setItems] = useState<LaptopItem[]>([]);
    const [dropdowns, setDropdowns] = useState<Dropdowns>({
        brands: [],
        processors: [],
        rams: [],
        storages: [],
        conditions: []
    });
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(20);

    // Filter states
    const [search, setSearch] = useState('');
    const [brand, setBrand] = useState('');
    const [processor, setProcessor] = useState('');
    const [ram, setRam] = useState('');
    const [storage, setStorage] = useState('');
    const [condition, setCondition] = useState('');
    const [qcStatus, setQcStatus] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('desc');
    const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

    // Modal states
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LaptopItem | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingBarcode, setTrackingBarcode] = useState('');
    const [trackingData, setTrackingData] = useState<{ product: LaptopItem; timeline: any[] } | null>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [masterOptions, setMasterOptions] = useState<any[]>([]);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // CSV Import drag-and-drop state
    const [importLoading, setImportLoading] = useState(false);
    const [importPreview, setImportPreview] = useState<any[]>([]);
    const [importErrors, setImportErrors] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form inputs state
    const [formState, setFormState] = useState({
        productName: '',
        brand: '',
        series: '',
        model: '',
        sku: '',
        barcode: '',
        processor: '',
        processorGen: '',
        ram: '',
        storage: '',
        graphicsCard: '',
        graphicsModel: '',
        graphicsSize: '',
        screenSize: '',
        screenResolution: '',
        keyboardType: '',
        keyboardBacklit: '',
        conditionStatus: 'Passed',
        qcStatus: 'Passed',
        quantity: 1,
        stockBalance: 1,
        basePrice: '',
        offerPrice: '',
        lotNumber: ''
    });

    // Reset Form fields
    const resetForm = useCallback(() => {
        setFormState({
            productName: '',
            brand: '',
            series: '',
            model: '',
            sku: '',
            barcode: '',
            processor: '',
            processorGen: '',
            ram: '',
            storage: '',
            graphicsCard: '',
            graphicsModel: '',
            graphicsSize: '',
            screenSize: '',
            screenResolution: '',
            keyboardType: '',
            keyboardBacklit: '',
            conditionStatus: 'Passed',
            qcStatus: 'Passed',
            quantity: 1,
            stockBalance: 1,
            basePrice: '',
            offerPrice: '',
            lotNumber: ''
        });
        setEditingItem(null);
    }, []);

    // Helper to parse graphics card into model and size
    const parseGraphicsCard = (fullVal: string | null) => {
        if (!fullVal) return { model: '', size: '' };
        const cleanVal = fullVal.trim();
        const parts = cleanVal.split(/\s+/);
        if (parts.length <= 1) return { model: cleanVal, size: '' };
        
        const lastPart = parts[parts.length - 1];
        const sizePattern = /^\d+(GB|MB|KB|G|M)$/i; // e.g. 6GB, 8GB, 512MB
        const isSize = sizePattern.test(lastPart) || lastPart.toLowerCase() === 'shared' || lastPart.toLowerCase() === 'dedicated';
        
        if (isSize) {
            return {
                model: parts.slice(0, -1).join(' '),
                size: lastPart
            };
        }
        return { model: cleanVal, size: '' };
    };

    useEffect(() => {
        if (editingItem) {
            const parsedGraphics = parseGraphicsCard(editingItem.graphics_card);
            setFormState({
                productName: editingItem.product_name || '',
                brand: editingItem.brand || '',
                series: editingItem.series || '',
                model: editingItem.model || '',
                sku: editingItem.sku || '',
                barcode: editingItem.barcode || '',
                processor: editingItem.processor || '',
                processorGen: editingItem.processor_gen || '',
                ram: editingItem.ram || '',
                storage: editingItem.storage || '',
                graphicsCard: editingItem.graphics_card || '',
                graphicsModel: parsedGraphics.model,
                graphicsSize: parsedGraphics.size,
                screenSize: editingItem.screen_size || '',
                screenResolution: editingItem.screen_resolution || '',
                keyboardType: editingItem.keyboard_type || '',
                keyboardBacklit: editingItem.keyboard_backlit || '',
                conditionStatus: editingItem.condition_status || 'Unknown',
                qcStatus: editingItem.qc_status || 'Passed',
                quantity: editingItem.quantity || 1,
                stockBalance: editingItem.stock_balance || 1,
                basePrice: editingItem.base_price ? String(editingItem.base_price) : '',
                offerPrice: editingItem.offer_price ? String(editingItem.offer_price) : '',
                lotNumber: editingItem.lot_number || ''
            });
        } else {
            resetForm();
        }
    }, [editingItem, resetForm]);

    // Fetch Inventory data
    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (currentPage - 1) * limit;
            const queryParams = new URLSearchParams({
                search,
                brand,
                processor,
                ram,
                storage,
                condition,
                qcStatus,
                sortBy,
                order,
                limit: String(limit),
                offset: String(offset)
            });

            const res = await fetch(`/api/bch/inventory/laptop?${queryParams.toString()}`);
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setItems(result.data || []);
                    setTotalItems(result.total || 0);
                    if (result.dropdowns) {
                        setDropdowns(result.dropdowns);
                    }
                }
            } else {
                toast.error("Failed to load inventory data");
            }
        } catch (error) {
            console.error("Fetch inventory error:", error);
            toast.error("An error occurred while fetching inventory");
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, brand, processor, ram, storage, condition, qcStatus, sortBy, order, limit]);

    const fetchMasterOptions = useCallback(async () => {
        try {
            const res = await fetch('/api/bch/inventory/droplists');
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setMasterOptions(result.data || []);
                }
            }
        } catch (error) {
            console.error("Error fetching master options:", error);
        }
    }, []);

    useEffect(() => {
        if (isAddEditModalOpen) {
            fetchMasterOptions();
        }
    }, [isAddEditModalOpen, fetchMasterOptions]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    // Automatically generate Product Name from specifications
    useEffect(() => {
        const parts = [
            formState.brand,
            formState.series,
            formState.model,
            formState.processor,
            formState.processorGen,
            formState.ram,
            formState.storage,
            formState.graphicsCard
        ].filter(val => val && val.trim() !== '');

        const autoName = parts.join(' ');
        setFormState(prev => {
            if (prev.productName !== autoName) {
                return { ...prev, productName: autoName };
            }
            return prev;
        });
    }, [
        formState.brand,
        formState.series,
        formState.model,
        formState.processor,
        formState.processorGen,
        formState.ram,
        formState.storage,
        formState.graphicsCard
    ]);

    // Assemble graphicsCard from graphicsModel and graphicsSize
    useEffect(() => {
        const fullGraphics = `${formState.graphicsModel} ${formState.graphicsSize}`.trim();
        setFormState(prev => {
            if (prev.graphicsCard !== fullGraphics) {
                return { ...prev, graphicsCard: fullGraphics };
            }
            return prev;
        });
    }, [formState.graphicsModel, formState.graphicsSize]);

    // Handle Form Submit (Add / Edit)
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (submitting) return;
        
        if (!formState.productName) {
            toast.error("Product Name is required");
            return;
        }

        const username = localStorage.getItem('admin_user') 
            ? JSON.parse(localStorage.getItem('admin_user')!).username 
            : 'Admin';

        const payload = {
            ...formState,
            createdBy: username,
            updatedBy: username
        };

        setSubmitting(true);
        try {
            let res;
            if (editingItem) {
                // Edit mode
                res = await fetch('/api/bch/inventory/laptop', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: editingItem.id })
                });
            } else {
                // Add mode
                res = await fetch('/api/bch/inventory/laptop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(editingItem ? "Laptop updated successfully" : "Laptop added successfully");
                setIsAddEditModalOpen(false);
                resetForm();
                fetchInventory();
            } else {
                toast.error(data.error || "Failed to save laptop details");
            }
        } catch (error) {
            console.error("Save inventory error:", error);
            toast.error("An error occurred while saving item");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete Item
    const handleDeleteItem = async (id: number) => {
        const confirmed = window.confirm("Are you sure you want to delete this laptop from inventory?");
        if (!confirmed) return;

        const username = localStorage.getItem('admin_user')
            ? JSON.parse(localStorage.getItem('admin_user')!).username
            : 'Admin';

        try {
            const res = await fetch(`/api/bch/inventory/laptop?id=${id}&deletedBy=${encodeURIComponent(username)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success("Laptop deleted successfully");
                fetchInventory();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete item");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("An error occurred while deleting item");
        }
    };

    // Fetch tracking details for a specific item
    const fetchTracking = async (barcodeVal: string) => {
        setTrackingLoading(true);
        try {
            const res = await fetch(`/api/bch/inventory/laptop/tracking?barcode=${encodeURIComponent(barcodeVal)}`);
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setTrackingData(result);
                }
            } else {
                toast.error("Failed to load tracking history");
            }
        } catch (error) {
            console.error("Tracking fetch error:", error);
            toast.error("An error occurred while fetching tracking details");
        } finally {
            setTrackingLoading(false);
        }
    };

    // Open tracking modal
    const handleOpenTracking = (barcodeVal: string) => {
        setTrackingBarcode(barcodeVal);
        setTrackingData(null);
        setIsTrackingModalOpen(true);
        fetchTracking(barcodeVal);
    };

    // Handle sorting change
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setOrder('asc');
        }
        setCurrentPage(1);
    };

    // Export current filtered inventory to Excel
    const handleExportExcel = () => {
        if (items.length === 0) {
            toast.error("No items available to export");
            return;
        }

        const dataRows = items.map(item => ({
            "ID": item.id,
            "Lot Number": item.lot_number || '',
            "Barcode": item.barcode || '',
            "SKU": item.sku || '',
            "Product Name": item.product_name,
            "Brand": item.brand || '',
            "Series": item.series || '',
            "Model": item.model || '',
            "Processor": item.processor || '',
            "Processor Gen": item.processor_gen || '',
            "RAM": item.ram || '',
            "Storage": item.storage || '',
            "Graphics Card": item.graphics_card || '',
            "Screen Size": item.screen_size || '',
            "Screen Resolution": item.screen_resolution || '',
            "Keyboard Type": item.keyboard_type || '',
            "Keyboard Backlit": item.keyboard_backlit || '',
            "Condition Status": item.condition_status || '',
            "QC Status": item.qc_status || '',
            "Quantity": item.quantity,
            "Stock Balance": item.stock_balance,
            "Base Price (AED)": item.base_price || 0,
            "Offer Price (AED)": item.offer_price || 0,
            "Created At": new Date(item.created_at).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laptop_inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel file exported successfully");
    };

    // Download template Excel file
    const downloadExcelTemplate = () => {
        const headers = [
            "productName", "brand", "series", "model", "sku", 
            "processor", "processorGen", "ram", "storage", "graphicsCard", 
            "screenSize", "screenResolution", "conditionStatus", "qcStatus", 
            "quantity", "basePrice", "offerPrice", "lotNumber", "barcode"
        ];
        const sampleRow = [
            "Dell Latitude 7490", "Dell", "Latitude", "7490", "DELL-7490", 
            "Intel Core i5", "8th Gen", "16GB", "256GB SSD", "Intel UHD 620", 
            "14 inch", "1920x1080", "Excellent", "Passed", 1, 1200, 999, "LOT-2026-01", "BCH-LP-7490"
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'laptop_inventory_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Handle File Selection (CSV / Excel)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    toast.error("The uploaded file is empty");
                    return;
                }
                setImportPreview(jsonData);
                setImportErrors([]);
            } catch (err) {
                console.error("Parse error:", err);
                toast.error("Failed to parse Excel or CSV file");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Execute bulk import
    const handleBulkImport = async () => {
        if (importPreview.length === 0) {
            toast.error("Please load a CSV file first");
            return;
        }

        setImportLoading(true);
        const username = localStorage.getItem('admin_user')
            ? JSON.parse(localStorage.getItem('admin_user')!).username
            : 'Admin';

        try {
            const res = await fetch('/api/bch/inventory/laptop/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    products: importPreview,
                    importedBy: username
                })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success(`Imported ${result.importedCount} products successfully`);
                if (result.errors && result.errors.length > 0) {
                    setImportErrors(result.errors);
                    toast.warning(`${result.errors.length} items failed to import`);
                } else {
                    setIsImportModalOpen(false);
                    setImportPreview([]);
                    setImportErrors([]);
                }
                fetchInventory();
            } else {
                toast.error(result.error || "Failed to complete bulk import");
            }
        } catch (error) {
            console.error("Bulk import error:", error);
            toast.error("An error occurred during import");
        } finally {
            setImportLoading(false);
        }
    };

    // Compute metrics
    const totalValuation = items.reduce((acc, item) => acc + (Number(item.offer_price || item.base_price || 0) * Number(item.stock_balance || 0)), 0);
    const lowStockCount = items.filter(item => item.stock_balance > 0 && item.stock_balance <= 2).length;
    const outOfStockCount = items.filter(item => !item.stock_balance || item.stock_balance <= 0).length;

    const totalPages = Math.ceil(totalItems / limit);

    return (
        <div className="inventory-container">
            {/* Page Header */}
            <div className="section-header">
                <h2>
                    <i className="fas fa-laptop" style={{ color: '#10b981' }}></i>
                    Laptop Inventory Management
                </h2>
                <p>Track, audit, edit, import, and export stock of physical QC-Passed laptops.</p>
            </div>

            {/* KPI Cards Grid */}
            <div className="inventory-summary-grid">
                <div className="kpi-card blue">
                    <div className="kpi-icon-wrapper">
                        <i className="fas fa-cubes"></i>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Unique Models</span>
                        <strong className="kpi-value">{totalItems}</strong>
                    </div>
                </div>
                <div className="kpi-card emerald">
                    <div className="kpi-icon-wrapper">
                        <i className="fas fa-sack-dollar"></i>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Valuation</span>
                        <strong className="kpi-value">AED {totalValuation.toLocaleString()}</strong>
                    </div>
                </div>
                <div className="kpi-card amber">
                    <div className="kpi-icon-wrapper">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Low Stock (≤ 2)</span>
                        <strong className="kpi-value">{lowStockCount}</strong>
                    </div>
                </div>
                <div className="kpi-card rose">
                    <div className="kpi-icon-wrapper">
                        <i className="fas fa-times-circle"></i>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Out of Stock</span>
                        <strong className="kpi-value">{outOfStockCount}</strong>
                    </div>
                </div>
            </div>

            {/* Controls panel: Search, filters, action buttons */}
            <div className="inventory-controls-panel">
                <div className="search-filters-row">
                    <div className="search-input-wrapper">
                        <i className="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="Search by Barcode, SKU, Product Name or Lot Number..." 
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="action-buttons-row">
                        <button 
                            className={`btn-inventory outline ${showFiltersDrawer ? 'active' : ''}`}
                            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                        >
                            <i className="fas fa-filter"></i> Filters
                        </button>
                        <button className="btn-inventory outline" onClick={handleExportExcel}>
                            <i className="fas fa-file-export"></i> Export Excel
                        </button>
                        <button className="btn-inventory outline" onClick={() => setIsImportModalOpen(true)}>
                            <i className="fas fa-file-import"></i> Import Excel/CSV
                        </button>
                        <button className="btn-inventory primary" onClick={() => { resetForm(); setIsAddEditModalOpen(true); }}>
                            <i className="fas fa-plus"></i> Add Laptop
                        </button>
                    </div>
                </div>

                {/* Filters Drawer */}
                {showFiltersDrawer && (
                    <div className="filters-drawer">
                        <div className="filter-select-wrapper">
                            <label>Brand</label>
                            <select value={brand} onChange={e => { setBrand(e.target.value); setCurrentPage(1); }}>
                                <option value="">All Brands</option>
                                {dropdowns.brands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="filter-select-wrapper">
                            <label>Processor</label>
                            <select value={processor} onChange={e => { setProcessor(e.target.value); setCurrentPage(1); }}>
                                <option value="">All Processors</option>
                                {dropdowns.processors.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="filter-select-wrapper">
                            <label>RAM</label>
                            <select value={ram} onChange={e => { setRam(e.target.value); setCurrentPage(1); }}>
                                <option value="">All RAMs</option>
                                {dropdowns.rams.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="filter-select-wrapper">
                            <label>Storage</label>
                            <select value={storage} onChange={e => { setStorage(e.target.value); setCurrentPage(1); }}>
                                <option value="">All Storages</option>
                                {dropdowns.storages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-select-wrapper">
                            <label>Condition</label>
                            <select value={condition} onChange={e => { setCondition(e.target.value); setCurrentPage(1); }}>
                                <option value="">All Conditions</option>
                                {dropdowns.conditions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="filter-select-wrapper">
                            <label>QC Status</label>
                            <select value={qcStatus} onChange={e => { setQcStatus(e.target.value); setCurrentPage(1); }}>
                                <option value="">All Statuses</option>
                                <option value="Passed">Passed</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Laptop Inventory Table */}
            <div className="table-card">
                <div className="inventory-table-wrapper">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('barcode')}>Barcode <i className={`fas fa-sort${sortBy === 'barcode' ? (order === 'asc' ? '-up' : '-down') : ''}`}></i></th>
                                <th onClick={() => handleSort('sku')}>SKU <i className={`fas fa-sort${sortBy === 'sku' ? (order === 'asc' ? '-up' : '-down') : ''}`}></i></th>
                                <th onClick={() => handleSort('product_name')}>Product Details <i className={`fas fa-sort${sortBy === 'product_name' ? (order === 'asc' ? '-up' : '-down') : ''}`}></i></th>
                                <th onClick={() => handleSort('condition_status')}>Condition <i className={`fas fa-sort${sortBy === 'condition_status' ? (order === 'asc' ? '-up' : '-down') : ''}`}></i></th>
                                <th onClick={() => handleSort('stock_balance')}>Stock <i className={`fas fa-sort${sortBy === 'stock_balance' ? (order === 'asc' ? '-up' : '-down') : ''}`}></i></th>
                                <th onClick={() => handleSort('offer_price')}>Price <i className={`fas fa-sort${sortBy === 'offer_price' ? (order === 'asc' ? '-up' : '-down') : ''}`}></i></th>
                                <th onClick={() => handleSort('qc_status')}>QC Status <i className={`fas fa-sort${sortBy === 'qc_status' ? (order === 'asc' ? '-up' : '-down') : ''}`}></i></th>
                                <th style={{ cursor: 'default' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--secondary)' }}></i>
                                        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading inventory records...</p>
                                    </td>
                                </tr>
                            ) : items.length > 0 ? (
                                items.map((item) => (
                                    <tr key={item.id}>
                                        <td><span className="code-badge barcode">{item.barcode || 'N/A'}</span></td>
                                        <td><span className="code-badge sku">{item.sku || 'N/A'}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.product_name}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {item.brand} • {item.processor} • {item.ram} • {item.storage}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                                {item.condition_status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${item.stock_balance <= 0 ? 'low' : item.stock_balance <= 2 ? 'pending' : 'passed'}`}>
                                                {item.stock_balance || 0} left
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 700 }}>AED {item.offer_price || item.base_price || 0}</span>
                                                {item.base_price !== item.offer_price && (
                                                    <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>
                                                        AED {item.base_price}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${(item.qc_status || 'Passed').toLowerCase()}`}>
                                                {item.qc_status || 'Passed'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="btn-action" 
                                                    title="Tracking & Timeline"
                                                    onClick={() => handleOpenTracking(item.barcode)}
                                                >
                                                    <i className="fas fa-history"></i>
                                                </button>
                                                <button 
                                                    className="btn-action edit" 
                                                    title="Edit Laptop"
                                                    onClick={() => { setEditingItem(item); setIsAddEditModalOpen(true); }}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn-action delete" 
                                                    title="Delete Laptop"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                                        No matching inventory products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="pagination-row">
                        <span className="pagination-info">
                            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} items
                        </span>
                        <div className="pagination-controls">
                            <button 
                                className="btn-page" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                            >
                                <i className="fas fa-angle-double-left"></i>
                            </button>
                            <button 
                                className="btn-page" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                <i className="fas fa-angle-left"></i>
                            </button>
                            {Array.from({ length: totalPages }).map((_, index) => {
                                const pageNum = index + 1;
                                // Limit visible pagination pages
                                if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                                    return (
                                        <button 
                                            key={pageNum} 
                                            className={`btn-page ${currentPage === pageNum ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                                if (pageNum === 2 || pageNum === totalPages - 1) {
                                    return <span key={pageNum} style={{ padding: '0 0.25rem' }}>...</span>;
                                }
                                return null;
                            })}
                            <button 
                                className="btn-page" 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                <i className="fas fa-angle-right"></i>
                            </button>
                            <button 
                                className="btn-page" 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                            >
                                <i className="fas fa-angle-double-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Laptop Modal */}
            {isAddEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAddEditModalOpen(false)}>
                    <form 
                        className="modal-card" 
                        onClick={e => e.stopPropagation()} 
                        onSubmit={handleFormSubmit}
                    >
                        <div className="modal-header">
                            <h3>{editingItem ? "Edit Laptop Specifications" : "Add Laptop to Inventory"}</h3>
                            <button className="btn-close-modal" onClick={() => setIsAddEditModalOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                            <div className="modal-content-scroll">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Product Name (Auto-generated) *</label>
                                        <input 
                                            type="text" 
                                            required
                                            disabled
                                            style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                                            placeholder="Auto-generated from specifications..." 
                                            value={formState.productName}
                                            onChange={e => setFormState(prev => ({ ...prev, productName: e.target.value }))}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Brand</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Dell, HP, Lenovo" 
                                                value={formState.brand}
                                                onFocus={() => setFocusedField('brand')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, brand: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'brand' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'Brand')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.brand || val.toLowerCase().includes(formState.brand.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, brand: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Series</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Latitude, ThinkPad" 
                                                value={formState.series}
                                                onFocus={() => setFocusedField('series')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, series: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'series' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'Series' && (!formState.brand || o.parent === formState.brand))
                                                        .map(o => o.value)
                                                        .filter(val => !formState.series || val.toLowerCase().includes(formState.series.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, series: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Model</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 7490, T480" 
                                                value={formState.model}
                                                onFocus={() => setFocusedField('model')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, model: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'model' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'Model' && (!formState.series || o.parent === formState.series))
                                                        .map(o => o.value)
                                                        .filter(val => !formState.model || val.toLowerCase().includes(formState.model.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, model: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>SKU Code</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. DELL-LAT-7490" 
                                            value={formState.sku}
                                            onChange={e => setFormState(prev => ({ ...prev, sku: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Barcode</label>
                                        <input 
                                            type="text" 
                                            placeholder={editingItem ? "e.g. BCH-LP-XXXX" : "Auto-generated if empty"} 
                                            value={formState.barcode}
                                            onChange={e => setFormState(prev => ({ ...prev, barcode: e.target.value }))}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Processor</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Intel Core i5" 
                                                value={formState.processor}
                                                onFocus={() => setFocusedField('processor')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, processor: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'processor' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'Core' || o.category === 'Processor')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.processor || val.toLowerCase().includes(formState.processor.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, processor: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Processor Gen</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 8th Gen" 
                                                value={formState.processorGen}
                                                onFocus={() => setFocusedField('processorGen')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, processorGen: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'processorGen' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => (o.category === 'Gen' || o.category === 'Generation') && (!formState.processor || o.parent === formState.processor))
                                                        .map(o => o.value)
                                                        .filter(val => !formState.processorGen || val.toLowerCase().includes(formState.processorGen.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, processorGen: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>RAM Memory</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 16GB" 
                                                value={formState.ram}
                                                onFocus={() => setFocusedField('ram')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, ram: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'ram' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'RAM')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.ram || val.toLowerCase().includes(formState.ram.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, ram: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Storage Disk</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 256GB SSD" 
                                                value={formState.storage}
                                                onFocus={() => setFocusedField('storage')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, storage: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'storage' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'SSD' || o.category === 'Storage')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.storage || val.toLowerCase().includes(formState.storage.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, storage: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Graphics Model</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Intel UHD Graphics 620, NVIDIA GeForce RTX" 
                                                value={formState.graphicsModel}
                                                onFocus={() => setFocusedField('graphicsModel')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, graphicsModel: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'graphicsModel' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'GraphicsModel' || o.category === 'Graphics Model' || o.category === 'Graphics')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.graphicsModel || val.toLowerCase().includes(formState.graphicsModel.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, graphicsModel: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Graphics Size</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 6GB, Shared, 4GB" 
                                                value={formState.graphicsSize}
                                                onFocus={() => setFocusedField('graphicsSize')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, graphicsSize: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'graphicsSize' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'GraphicsSize' || o.category === 'Graphics Size')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.graphicsSize || val.toLowerCase().includes(formState.graphicsSize.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, graphicsSize: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Screen Size</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 14 inch" 
                                                value={formState.screenSize}
                                                onFocus={() => setFocusedField('screenSize')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, screenSize: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'screenSize' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'ScreenSize' || o.category === 'Screen Size')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.screenSize || val.toLowerCase().includes(formState.screenSize.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, screenSize: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Screen Resolution</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 1920x1080" 
                                                value={formState.screenResolution}
                                                onFocus={() => setFocusedField('screenResolution')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, screenResolution: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'screenResolution' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'ScreenResolution' || o.category === 'Screen Resolution')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.screenResolution || val.toLowerCase().includes(formState.screenResolution.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, screenResolution: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Condition Status</label>
                                        <div className="custom-autocomplete-wrapper">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Excellent, A Grade" 
                                                value={formState.conditionStatus}
                                                onFocus={() => setFocusedField('conditionStatus')}
                                                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                                                onChange={e => setFormState(prev => ({ ...prev, conditionStatus: e.target.value }))}
                                            />
                                            <span className="dropdown-arrow-icon"><i className="fas fa-chevron-down"></i></span>
                                            {focusedField === 'conditionStatus' && (
                                                <div className="custom-dropdown-popup">
                                                    {masterOptions
                                                        .filter(o => o.category === 'Condition')
                                                        .map(o => o.value)
                                                        .filter(val => !formState.conditionStatus || val.toLowerCase().includes(formState.conditionStatus.toLowerCase()))
                                                        .map((val, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="custom-dropdown-option"
                                                                onMouseDown={() => setFormState(prev => ({ ...prev, conditionStatus: val }))}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Lot Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. LOT-2026-001" 
                                            value={formState.lotNumber}
                                            onChange={e => setFormState(prev => ({ ...prev, lotNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Base Price (AED)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            placeholder="e.g. 1200" 
                                            value={formState.basePrice}
                                            onChange={e => setFormState(prev => ({ ...prev, basePrice: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Offer Price (AED)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            placeholder="e.g. 999" 
                                            value={formState.offerPrice}
                                            onChange={e => setFormState(prev => ({ ...prev, offerPrice: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>QC Status</label>
                                        <select 
                                            value={formState.qcStatus} 
                                            onChange={e => setFormState(prev => ({ ...prev, qcStatus: e.target.value }))}
                                        >
                                            <option value="Passed">Passed</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Failed">Failed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn-inventory outline" 
                                    onClick={() => setIsAddEditModalOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-inventory primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                                            Saving...
                                        </>
                                    ) : (
                                        editingItem ? "Update Laptop" : "Save Laptop"
                                    )}
                                </button>
                            </div>
                    </form>
                </div>
            )}

            {/* CSV/Excel Import Modal */}
            {isImportModalOpen && (
                <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Bulk Excel/CSV Import Laptop Inventory</h3>
                            <button className="btn-close-modal" onClick={() => setIsImportModalOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-content-scroll">
                            <div 
                                className="csv-drag-box" 
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <i className={`fas ${importPreview.length > 0 ? 'fa-file-excel success' : 'fa-cloud-upload-alt'}`}></i>
                                {importPreview.length > 0 ? (
                                    <div>
                                        <strong>Loaded: {importPreview.length} products ready to import</strong>
                                        <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click or drag a different file to replace.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <strong>Click to select an Excel or CSV file</strong>
                                        <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File must have headers mapping specs details.</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    accept=".csv, .xlsx, .xls" 
                                    style={{ display: 'none' }} 
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Options help */}
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Required header: <strong>productName</strong></span>
                                <button className="btn-inventory outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={downloadExcelTemplate}>
                                    <i className="fas fa-download"></i> Download Template Excel
                                </button>
                            </div>

                            {/* Preview table */}
                            {importPreview.length > 0 && (
                                <div className="import-preview-table-wrapper">
                                    <table className="inventory-table">
                                        <thead>
                                            <tr>
                                                <th>Product Name</th>
                                                <th>Brand</th>
                                                <th>Processor</th>
                                                <th>RAM</th>
                                                <th>Storage</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importPreview.slice(0, 5).map((row, idx) => (
                                                <tr key={idx}>
                                                    <td>{row.productName || row.product_name || 'N/A'}</td>
                                                    <td>{row.brand || 'N/A'}</td>
                                                    <td>{row.processor || 'N/A'}</td>
                                                    <td>{row.ram || 'N/A'}</td>
                                                    <td>{row.storage || 'N/A'}</td>
                                                    <td>AED {row.offerPrice || row.price || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {importPreview.length > 5 && (
                                        <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
                                            ... and {importPreview.length - 5} more rows.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Import error log */}
                            {importErrors.length > 0 && (
                                <div className="import-error-list">
                                    <h4>Import Issues ({importErrors.length})</h4>
                                    <ul>
                                        {importErrors.slice(0, 10).map((err, idx) => (
                                            <li key={idx}><strong>{err.product || err.item}</strong>: {err.error}</li>
                                        ))}
                                        {importErrors.length > 10 && <li>... and {importErrors.length - 10} more errors.</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-inventory outline" onClick={() => { setIsImportModalOpen(false); setImportPreview([]); setImportErrors([]); }}>
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn-inventory primary" 
                                disabled={importLoading || importPreview.length === 0}
                                onClick={handleBulkImport}
                            >
                                {importLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} Import Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Laptop History / Timeline Tracking Modal */}
            {isTrackingModalOpen && (
                <div className="modal-overlay" onClick={() => setIsTrackingModalOpen(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Laptop Tracking History & Audit Timeline</h3>
                            <button className="btn-close-modal" onClick={() => setIsTrackingModalOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-content-scroll">
                            {trackingLoading ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--secondary)' }}></i>
                                    <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Fetching history log timeline...</p>
                                </div>
                            ) : trackingData ? (
                                <div>
                                    {/* Product summary card */}
                                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{trackingData.product.product_name}</h4>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                Lot Number: <strong>{trackingData.product.lot_number || 'N/A'}</strong> | Condition: <strong>{trackingData.product.condition_status || 'N/A'}</strong>
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span className="code-badge barcode">{trackingData.product.barcode}</span>
                                            {trackingData.product.sku && <span className="code-badge sku">{trackingData.product.sku}</span>}
                                        </div>
                                    </div>

                                    {/* Timeline list */}
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Stock adjustments & Lifecycle tracking</h4>
                                    
                                    {trackingData.timeline && trackingData.timeline.length > 0 ? (
                                        <div className="timeline-list">
                                            {trackingData.timeline.map((event: any, index: number) => (
                                                <div key={index} className={`timeline-item ${event.type}`}>
                                                    <div className="timeline-dot"></div>
                                                    <div className="timeline-body">
                                                        <div className="timeline-meta">
                                                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                                                            <span>Action by: {event.user || 'Admin'}</span>
                                                        </div>
                                                        <div className="timeline-title">{event.title}</div>
                                                        <div className="timeline-desc">{event.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                                            No history tracking logs found for this barcode.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                                    No data loaded.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-inventory primary" onClick={() => setIsTrackingModalOpen(false)}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
