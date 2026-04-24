"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../../components/LoadingSpinner';
import '../../styles/sales-port.css';

const RAM_OPTIONS = ["4GB", "8GB", "12GB", "16GB", "24GB", "32GB", "64GB"];
const STORAGE_OPTIONS = ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD", "500GB HDD", "1TB HDD"];
const GPU_OPTIONS = ["Integrated", "2GB Dedicated", "4GB Dedicated", "6GB Dedicated", "8GB Dedicated", "12GB Dedicated"];

export default function SalesPort() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');
    const [inventoryResults, setInventoryResults] = useState<any[]>([]);
    const [isSearchingInventory, setIsSearchingInventory] = useState(false);
    const [activeManualCheckItem, setActiveManualCheckItem] = useState<any | null>(null);
    const [saleMode, setSaleMode] = useState<'invoice' | 'direct'>('invoice');
    const [directCustomer, setDirectCustomer] = useState('');
    const [directPhone, setDirectPhone] = useState('');
    const [directAmount, setDirectAmount] = useState('');
    const [directInvoiceNo, setDirectInvoiceNo] = useState('');
    const [directSaleItems, setDirectSaleItems] = useState<any[]>([]);
    
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAllDocuments();
    }, []);

    const fetchAllDocuments = async () => {
        try {
            setLoading(true);
            const [invRes, quoRes] = await Promise.all([
                fetch('/api/bch/invoices?salesPort=true'),
                fetch('/api/bch/quotations?salesPort=true')
            ]);
            
            const invData = await invRes.json();
            const quoData = await quoRes.json();
            
            const combined = [
                ...(invData.invoices || []).map((i: any) => ({ ...i, docType: 'Invoice' })),
                ...(quoData.quotations || []).map((q: any) => ({ ...q, docType: 'Proforma', invoice_no: q.quotation_no }))
            ].sort((a, b) => new Date(b.created_date || b.created_at).getTime() - new Date(a.created_date || a.created_at).getTime());
            
            setInvoices(combined);
        } catch (e) {
            toast.error("Failed to load documents.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInvoiceSelect = async (invoice: any) => {
        setSaleMode('invoice');
        setSelectedInvoice(invoice);
        setScannedBarcode('');
        setInvoiceItems([]);
        setItemsLoading(true);
        
        try {
            const endpoint = invoice.docType === 'Invoice' 
                ? `/api/bch/invoices/${invoice.id}` 
                : `/api/bch/quotations/${invoice.id}`;
                
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.items) {
                // Filter out items that are already fully sold
                const pendingItems = data.items.filter((item: any) => 
                    (item.quantity || 0) > (item.sold_quantity || 0)
                ).map((item: any) => {
                    const remaining = (item.quantity || 0) - (item.sold_quantity || 0);
                    return {
                        ...item,
                        quantity: remaining, // Set current confirm quantity to remaining balance
                        max_to_sell: remaining, // Store the limit
                        remaining_qty: remaining
                    };
                });
                setInvoiceItems(pendingItems);
                
                // If no items are pending after filtering (edge case), refresh the whole list
                if (pendingItems.length === 0) {
                    toast.info("Invoice fully processed.");
                    setSelectedInvoice(null);
                    fetchAllDocuments();
                }
            }
        } catch (e) {
            toast.error("Failed to load items.");
        } finally {
            setItemsLoading(false);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    };

    const handleManualSalesOut = async (
        barcode: string, 
        inventoryId?: number, 
        source?: string, 
        quantity: number = 1, 
        silent: boolean = false,
        specs?: { ram?: string; storage?: string; graphics?: string; unit_price?: number }
    ) => {
        if (saleMode === 'invoice' && !selectedInvoice) {
            toast.warning("Please select a document first.");
            return;
        }

        if (saleMode === 'direct' && !directCustomer.trim()) {
            toast.warning("Please enter a customer name for direct sale.");
            return;
        }

        if (!barcode && !inventoryId) return;

        if (!silent) setIsScanning(true);
        
        const invoiceNoToUse = saleMode === 'invoice' 
            ? selectedInvoice.invoice_no 
            : (directInvoiceNo || `DS-${new Date().getTime().toString().slice(-6)}`);
            
        if (saleMode === 'direct' && !directInvoiceNo) {
            setDirectInvoiceNo(invoiceNoToUse);
        }

        try {
            const res = await fetch('/api/bch/sales/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: saleMode === 'invoice' ? selectedInvoice.id : 0,
                    invoiceNo: invoiceNoToUse,
                    docType: saleMode === 'invoice' ? selectedInvoice.docType : 'Direct',
                    barcode: barcode,
                    inventoryId: inventoryId,
                    source: source,
                    quantity: quantity,
                    user: 'Admin',
                    customerName: saleMode === 'direct' ? directCustomer : undefined,
                    ram: specs?.ram,
                    storage: specs?.storage,
                    graphics: specs?.graphics,
                    unit_price: saleMode === 'direct' ? (directAmount || specs?.unit_price) : specs?.unit_price
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (!silent) {
                    toast.success(`Sale processed successfully!`);
                    setInventorySearchQuery('');
                    setInventoryResults([]);
                    setActiveManualCheckItem(null);
                    
                    if (saleMode === 'invoice') {
                        handleInvoiceSelect(selectedInvoice);
                    } else {
                        // For direct sale, clear the inputs after success if needed
                        setDirectAmount('');
                        setDirectInvoiceNo('');
                        // We keep the customer name in case they are buying multiple things
                    }
                    fetchAllDocuments();
                }
                return true;
            } else {
                if (!silent) toast.error(data.error || "Failed to process sales out.");
                return false;
            }
        } catch (e) {
            if (!silent) toast.error("Network error while processing.");
            return false;
        } finally {
            if (!silent) setIsScanning(false);
        }
    };

    const handleAddDirectItem = (res: any, qty: number) => {
        const newItem = {
            id: `temp-${Date.now()}`,
            inventory_id: res.id,
            source: res.type === 'qc_item' ? 'master' : 'purchase',
            product_code: res.code,
            description: res.label,
            quantity: qty,
            unit_price: res.offer_price || res.base_price,
            ram: res.ram,
            storage: res.storage,
            graphics: res.graphics_card,
            brand: res.brand,
            model: res.model,
            processor_gen: res.processor_gen
        };
        setDirectSaleItems(prev => [...prev, newItem]);
        setInventoryResults([]);
        setInventorySearchQuery('');
        toast.info(`Added ${res.label} to session.`);
    };

    const handleUpdateDirectItemField = (id: string, field: string, value: any) => {
        setDirectSaleItems(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveDirectItem = (id: string) => {
        setDirectSaleItems(prev => prev.filter(item => item.id !== id));
    };

    const handleConfirmDirectSale = async () => {
        if (!directCustomer.trim()) {
            toast.warning("Please enter a customer name.");
            return;
        }
        if (directSaleItems.length === 0) {
            toast.warning("No items in session to confirm.");
            return;
        }

        if (!confirm(`Confirm sale of ${directSaleItems.length} items for ${directCustomer}?`)) return;

        setIsScanning(true);
        let successCount = 0;
        const invoiceNoToUse = directInvoiceNo || `DS-${new Date().getTime().toString().slice(-6)}`;
        
        try {
            for (const item of directSaleItems) {
                const res = await fetch('/api/bch/sales/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        invoiceId: 0,
                        invoiceNo: invoiceNoToUse,
                        docType: 'Direct',
                        barcode: item.product_code,
                        inventoryId: item.inventory_id,
                        source: item.source,
                        quantity: item.quantity,
                        user: 'Admin',
                        customerName: directCustomer,
                        customerPhone: directPhone,
                        ram: item.ram,
                        storage: item.storage,
                        graphics: item.graphics,
                        unit_price: item.unit_price
                    })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    successCount++;
                }
            }
            
            if (successCount > 0) {
                toast.success(`Successfully processed ${successCount} direct sales!`);
                setDirectSaleItems([]);
                setDirectInvoiceNo('');
                setDirectAmount('');
                fetchAllDocuments();
            } else {
                toast.error("Failed to process direct sales.");
            }
        } catch (e) {
            toast.error("Error during batch confirmation.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleBulkSalesOut = async () => {
        const readyItems = invoiceItems.filter(item => item.inventory_id && item.source);
        if (readyItems.length === 0) {
            toast.warning("No matched items ready for confirmation. Use 'Manual Check' first.");
            return;
        }

        if (!confirm(`Are you sure you want to confirm all ${readyItems.length} matched items?`)) return;

        setIsScanning(true);
        let successCount = 0;
        try {
            for (const item of readyItems) {
                const success = await handleManualSalesOut(
                    item.product_code, 
                    item.inventory_id, 
                    item.source, 
                    item.quantity, 
                    true,
                    {
                        ram: item.ram,
                        storage: item.storage,
                        graphics: item.graphics,
                        unit_price: item.unit_price
                    }
                );
                if (success) successCount++;
            }
            
            if (successCount > 0) {
                toast.success(`Successfully confirmed ${successCount} items.`);
                setInventorySearchQuery('');
                setInventoryResults([]);
                setActiveManualCheckItem(null);
                handleInvoiceSelect(selectedInvoice);
                fetchAllDocuments();
            } else {
                toast.error("Bulk processing failed.");
            }
        } catch (e) {
            toast.error("Error during bulk processing.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleScanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scannedBarcode.trim()) return;
        await handleManualSalesOut(scannedBarcode.trim());
        setScannedBarcode('');
        inputRef.current?.focus();
    };

    const handleInventorySearch = async (query: string) => {
        setInventorySearchQuery(query);
        if (query.length < 2) {
            setInventoryResults([]);
            return;
        }

        setIsSearchingInventory(true);
        try {
            const res = await fetch(`/api/bch/inventory/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success) {
                setInventoryResults(data.results.filter((r: any) => 
                    r.type === 'qc_item' || r.type === 'purchase_item'
                ));
            } else {
                toast.error(data.error || "Search failed.");
            }
        } catch (e) {
            toast.error("Network error during inventory search.");
            console.error(e);
        } finally {
            setIsSearchingInventory(false);
        }
    };

    const handleManualCheck = (item: any) => {
        setActiveManualCheckItem(item);
        // Extract model keywords - usually the first 3-4 words are best for searching
        const keywords = item.description.split(' ').slice(0, 3).join(' ');
        handleInventorySearch(keywords);
        
        // Scroll to search area if on mobile/small screen
        document.querySelector('.manual-search-area')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSelectItemForManualCheck = (res: any, qty: number) => {
        if (!activeManualCheckItem) return;

        setInvoiceItems(prev => prev.map(item => {
            if (item.id === activeManualCheckItem.id) {
                return {
                    ...item,
                    product_code: res.code,
                    inventory_id: res.id,
                    source: res.type === 'qc_item' ? 'master' : 'purchase',
                    // Update stock display locally for immediate feedback
                    master_stock: res.type === 'qc_item' ? 1 : 0,
                    purchase_stock: res.type === 'purchase_item' ? 1 : 0,
                    // If the user picked a specific quantity, we could update it here
                    // but usually invoice quantity is what we want to fulfill.
                    quantity: qty 
                };
            }
            return item;
        }));

        toast.success(`Matched to "${res.label}"`);
        setActiveManualCheckItem(null);
        setInventorySearchQuery('');
        setInventoryResults([]);
    };

    const handleUpdateItemQuantity = (id: number, delta: number) => {
        setInvoiceItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, (item.quantity || 0) + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="sales-port-container">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="section-header"
            >
                <h2>
                    <i className="fas fa-barcode text-primary"></i>
                    Sales Port
                </h2>
                <div className="sale-mode-toggle">
                    <button 
                        className={`mode-btn ${saleMode === 'invoice' ? 'active' : ''}`}
                        onClick={() => {
                            setSaleMode('invoice');
                            setDirectCustomer('');
                            setDirectPhone('');
                            setDirectAmount('');
                            setDirectSaleItems([]);
                        }}
                    >
                        <i className="fas fa-file-invoice mr-2"></i>
                        Invoice Mode
                    </button>
                    <button 
                        className={`mode-btn ${saleMode === 'direct' ? 'active' : ''}`}
                        onClick={() => {
                            setSaleMode('direct');
                            setSelectedInvoice(null);
                            setInvoiceItems([]);
                            setDirectSaleItems([]);
                        }}
                    >
                        <i className="fas fa-user-tag mr-2"></i>
                        Direct Sale
                    </button>
                </div>
                <p>Record sales through existing invoices or process direct walk-in customers</p>
            </motion.div>
            
            <div className="port-layout">
                
                {/* Top: Invoices List Row */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="invoice-selection-bar"
                >
                    <div className="sidebar-search">
                        <div className="search-input-wrapper">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text"
                                placeholder="Search invoices..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="invoice-list">
                        {loading ? (
                            <LoadingSpinner text="Loading Invoices..." />
                        ) : filteredInvoices.length > 0 ? (
                            <AnimatePresence>
                                {filteredInvoices.map((inv) => (
                                     <motion.div 
                                         key={`${inv.docType}-${inv.id}`} 
                                         initial={{ opacity: 0, scale: 0.95 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         className={`invoice-item ${selectedInvoice?.id === inv.id && selectedInvoice?.docType === inv.docType ? 'active' : ''}`}
                                         onClick={() => handleInvoiceSelect(inv)}
                                     >
                                         <div className="item-header">
                                             <span className="item-no">{inv.invoice_no}</span>
                                             <span className={`doc-badge ${inv.docType.toLowerCase()}`}>{inv.docType}</span>
                                         </div>
                                         <div className="item-customer">
                                             <i className="far fa-user mr-1" style={{ fontSize: '0.7rem' }}></i>
                                             {inv.customer_name}
                                         </div>
                                     </motion.div>
                                 ))}
                            </AnimatePresence>
                        ) : (
                            <div className="empty-state" style={{ padding: '1rem', width: '100%' }}>
                                <i className="far fa-file-alt" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.3 }}></i>
                                <p style={{ fontSize: '0.8rem' }}>No invoices found</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Bottom: Scan & Product Info */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="scan-workspace"
                >
                    <AnimatePresence mode="wait">
                        {selectedInvoice || saleMode === 'direct' ? (
                            <motion.div 
                                key={saleMode === 'direct' ? "direct" : "active"}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                            >
                                <div className="active-session-panel">
                                    <div className="session-inner-header">
                                        <div className="session-title-group">
                                            <span className="session-label">{saleMode === 'direct' ? 'Direct Sale Session' : 'Active Session'}</span>
                                            <div className="invoice-info-row">
                                                <h2 className="invoice-number">
                                                    {saleMode === 'direct' ? (directInvoiceNo || "New Sale") : (selectedInvoice?.invoice_no || '---')}
                                                </h2>
                                                <span className={`doc-badge ${saleMode === 'direct' ? 'direct' : (selectedInvoice?.docType?.toLowerCase() || 'invoice')}`}>
                                                    {saleMode === 'direct' ? 'Direct' : (selectedInvoice?.docType || 'Invoice')}
                                                </span>
                                            </div>
                                            {saleMode === 'direct' ? (
                                                <div className="direct-inputs-row">
                                                    <div className="direct-field">
                                                        <i className="fas fa-user-circle"></i>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Customer Name..."
                                                            value={directCustomer}
                                                            onChange={e => setDirectCustomer(e.target.value)}
                                                            className="direct-customer-input"
                                                        />
                                                    </div>
                                                    <div className="direct-field">
                                                        <i className="fas fa-phone"></i>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Phone Number (Optional)..."
                                                            value={directPhone}
                                                            onChange={e => setDirectPhone(e.target.value)}
                                                            className="direct-customer-input"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="customer-info">
                                                    <i className="fas fa-user-circle"></i>
                                                    {selectedInvoice?.customer_name || 'No Customer'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="session-actions">
                                            {(saleMode === 'direct' ? directSaleItems : invoiceItems).some(item => item.inventory_id && item.source) && (
                                                <button 
                                                    className="bulk-confirm-btn"
                                                    onClick={saleMode === 'direct' ? handleConfirmDirectSale : handleBulkSalesOut}
                                                    disabled={isScanning}
                                                >
                                                    <i className="fas fa-check-double mr-2"></i>
                                                    {saleMode === 'direct' ? 'Confirm All Direct' : 'Confirm All Ready'}
                                                </button>
                                            )}
                                            <div className={`scan-status-pill ${isScanning ? 'processing' : 'waiting'}`}>
                                                <i className={`fas ${isScanning ? 'fa-spinner fa-spin' : 'fa-check-circle'}`}></i>
                                                {isScanning ? 'Processing...' : 'System Ready'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="session-workspace-split">
                                        {/* Left: Scanning Area */}
                                        <div className="scan-zone">
                                            <form onSubmit={handleScanSubmit} className="scan-interface">
                                                <div className="interface-header">
                                                    <i className="fas fa-barcode"></i>
                                                    <span>Barcode Scanner</span>
                                                </div>
                                                <div className="scan-input-group">
                                                    <input 
                                                        ref={inputRef}
                                                        type="text" 
                                                        value={scannedBarcode}
                                                        onChange={(e) => setScannedBarcode(e.target.value)}
                                                        placeholder="Scan product barcode..."
                                                        autoFocus
                                                    />
                                                    <button 
                                                        type="submit" 
                                                        disabled={isScanning || !scannedBarcode.trim()}
                                                        className="scan-submit-btn"
                                                    >
                                                        {isScanning ? (
                                                            <i className="fas fa-circle-notch fa-spin"></i>
                                                        ) : (
                                                            <i className="fas fa-arrow-right"></i>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="scan-hint">
                                                    Connected to session <strong>{saleMode === 'direct' ? (directInvoiceNo || "Direct Sale") : (selectedInvoice?.invoice_no || '---')}</strong>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Right: Manual Inventory Search */}
                                        <div className="manual-zone">
                                            <div className="manual-interface">
                                                <div className="interface-header">
                                                    <i className="fas fa-search"></i>
                                                    <span>{activeManualCheckItem ? 'Matching Item' : 'Manual Search'}</span>
                                                </div>
                                                <div className="search-input-group">
                                                    <input 
                                                        type="text"
                                                        placeholder="Search SKU, Serial or Model..."
                                                        value={inventorySearchQuery}
                                                        onChange={e => handleInventorySearch(e.target.value)}
                                                    />
                                                    {isSearchingInventory && <i className="fas fa-circle-notch fa-spin search-loader"></i>}
                                                </div>
                                                
                                                {activeManualCheckItem && (
                                                    <div className="matching-context">
                                                        <span className="context-label">Fulfilling:</span>
                                                        <span className="context-value">{activeManualCheckItem.description.substring(0, 40)}...</span>
                                                        <button onClick={() => {
                                                            setActiveManualCheckItem(null);
                                                            setInventorySearchQuery('');
                                                            setInventoryResults([]);
                                                        }} className="clear-context">
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search Results Overlay/Panel */}
                                    <AnimatePresence>
                                        {inventoryResults.length > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="inventory-results-overlay"
                                            >
                                                <div className="search-results-table-wrapper">
                                                    <table className="inventory-results-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Lot #</th>
                                                                <th>ID</th>
                                                                <th>Product / Specs</th>
                                                                <th style={{ textAlign: 'center' }}>Sold</th>
                                                                <th style={{ textAlign: 'center' }}>Remaining</th>
                                                                <th style={{ textAlign: 'center' }}>Qty</th>
                                                                <th style={{ textAlign: 'right' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {inventoryResults.map(res => (
                                                                <tr key={res.value}>
                                                                    <td className="col-lot">
                                                                        <span className="lot-badge">{res.lot_number || 'N/A'}</span>
                                                                    </td>
                                                                    <td className="col-id">
                                                                        <span className="id-badge">#{res.id}</span>
                                                                    </td>
                                                                    <td className="col-product">
                                                                        <div className="product-info-compact">
                                                                            <div className="res-label">{res.label}</div>
                                                                            <div className="res-specs">
                                                                                {res.brand} {res.model} {res.processor && `| ${res.processor}`} {res.ram && `| ${res.ram}`} {res.storage && `| ${res.storage}`}
                                                                            </div>
                                                                            <div className="res-source-tiny">{res.displayType}</div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        <span className="qty-badge sold">{res.sold_quantity || 0}</span>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        <span className="qty-badge remaining">{res.stock_quantity || 0}</span>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        <input 
                                                                            type="number"
                                                                            defaultValue={activeManualCheckItem ? activeManualCheckItem.quantity : 1}
                                                                            min={1}
                                                                            className="qty-input-table"
                                                                            id={`qty-${res.value}`}
                                                                        />
                                                                    </td>
                                                                    <td style={{ textAlign: 'right' }}>
                                                                        {saleMode === 'direct' ? (
                                                                            <button 
                                                                                className="table-action-btn select"
                                                                                onClick={() => {
                                                                                    const qty = (document.getElementById(`qty-${res.value}`) as HTMLInputElement).value;
                                                                                    handleAddDirectItem(res, parseInt(qty));
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-plus"></i> Select
                                                                            </button>
                                                                        ) : activeManualCheckItem ? (
                                                                            <button 
                                                                                className="table-action-btn select"
                                                                                onClick={() => {
                                                                                    const qty = (document.getElementById(`qty-${res.value}`) as HTMLInputElement).value;
                                                                                    handleSelectItemForManualCheck(res, parseInt(qty));
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-check"></i> Match
                                                                            </button>
                                                                        ) : (
                                                                            <button 
                                                                                className="table-action-btn sales"
                                                                                onClick={() => {
                                                                                    const qty = (document.getElementById(`qty-${res.value}`) as HTMLInputElement).value;
                                                                                    handleManualSalesOut(
                                                                                        res.code, 
                                                                                        res.id, 
                                                                                        res.type === 'qc_item' ? 'master' : 'purchase', 
                                                                                        parseInt(qty),
                                                                                        false,
                                                                                        activeManualCheckItem ? {
                                                                                            ram: activeManualCheckItem.ram,
                                                                                            storage: activeManualCheckItem.storage,
                                                                                            graphics: activeManualCheckItem.graphics,
                                                                                            unit_price: activeManualCheckItem.unit_price
                                                                                        } : {
                                                                                            ram: res.ram,
                                                                                            storage: res.storage,
                                                                                            graphics: res.graphics_card,
                                                                                            unit_price: res.offer_price || res.base_price
                                                                                        }
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-plus"></i> Sell
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {inventorySearchQuery.length >= 2 && inventoryResults.length === 0 && !isSearchingInventory && (
                                        <div className="no-results-hint">
                                            <i className="fas fa-search"></i>
                                            No matching units found for "{inventorySearchQuery}"
                                        </div>
                                    )}
                                </div>

                                {/* Invoice Items List */}
                                <div className="invoice-items-section">
                                    <h4>
                                        <i className="fas fa-shopping-cart"></i>
                                        {saleMode === 'direct' ? 'Session Cart' : 'Items in this Invoice'}
                                    </h4>
                                    
                                    <div className="items-table-wrapper">
                                        {itemsLoading ? (
                                            <LoadingSpinner text="Loading Items..." />
                                        ) : (saleMode === 'direct' ? directSaleItems : invoiceItems).length > 0 ? (
                                            <table className="items-table">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Price</th>
                                                        <th>RAM</th>
                                                        <th>Storage</th>
                                                        <th>GPU</th>
                                                        <th style={{ textAlign: 'right' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(saleMode === 'direct' ? directSaleItems : invoiceItems).map((item) => (
                                                        <tr key={item.id}>
                                                            <td>
                                                                <div style={{ fontWeight: 700 }}>{item.description}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{item.product_code || 'No SKU'}</div>
                                                            </td>
                                                            <td>
                                                                {saleMode === 'direct' ? (
                                                                    <input 
                                                                        type="number" 
                                                                        className="direct-edit-input" 
                                                                        value={item.unit_price} 
                                                                        onChange={e => handleUpdateDirectItemField(item.id, 'unit_price', e.target.value)}
                                                                    />
                                                                ) : item.unit_price}
                                                            </td>
                                                            <td>
                                                                {saleMode === 'direct' ? (
                                                                    <select 
                                                                        className="direct-edit-input" 
                                                                        value={item.ram || ''} 
                                                                        onChange={e => handleUpdateDirectItemField(item.id, 'ram', e.target.value)}
                                                                    >
                                                                        <option value="">Select RAM</option>
                                                                        {RAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                ) : (item.ram || 'N/A')}
                                                            </td>
                                                            <td>
                                                                {saleMode === 'direct' ? (
                                                                    <select 
                                                                        className="direct-edit-input" 
                                                                        value={item.storage || ''} 
                                                                        onChange={e => handleUpdateDirectItemField(item.id, 'storage', e.target.value)}
                                                                    >
                                                                        <option value="">Select Storage</option>
                                                                        {STORAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                ) : (item.storage || 'N/A')}
                                                            </td>
                                                            <td>
                                                                {saleMode === 'direct' ? (
                                                                    <select 
                                                                        className="direct-edit-input" 
                                                                        value={item.graphics || ''} 
                                                                        onChange={e => handleUpdateDirectItemField(item.id, 'graphics', e.target.value)}
                                                                    >
                                                                        <option value="">Select GPU</option>
                                                                        {GPU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                ) : (item.graphics || 'N/A')}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                {saleMode === 'direct' ? (
                                                                    <button 
                                                                        className="action-btn-small delete"
                                                                        onClick={() => handleRemoveDirectItem(item.id)}
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                ) : (
                                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                        <button 
                                                                            className="action-btn-small manual"
                                                                            onClick={() => handleManualCheck(item)}
                                                                        >
                                                                            Manual Check
                                                                        </button>
                                                                        <button 
                                                                            className="action-btn-small"
                                                                            disabled={isScanning || (!item.product_code && !item.inventory_id)}
                                                                            onClick={() => handleManualSalesOut(
                                                                                item.product_code, 
                                                                                item.inventory_id, 
                                                                                item.source, 
                                                                                item.quantity,
                                                                                false,
                                                                                {
                                                                                    ram: item.ram,
                                                                                    storage: item.storage,
                                                                                    graphics: item.graphics,
                                                                                    unit_price: item.unit_price
                                                                                }
                                                                            )}
                                                                        >
                                                                            Confirm Sales
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                                                <p>{saleMode === 'direct' ? 'Session cart is empty. Search products above to add.' : 'No items found in this invoice.'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="empty-state"
                                style={{ padding: '4rem 0' }}
                            >
                                <div className="empty-icon">
                                    <i className="fas fa-file-invoice"></i>
                                </div>
                                <h3>No Invoice Selected</h3>
                                <p style={{ maxWidth: '300px' }}>Select an invoice from the top row to view items and start scanning products.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Global Loader Overlay */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="global-processing-overlay"
                    >
                        <div className="loader-content">
                            <div className="scanner-animation">
                                <div className="line"></div>
                                <i className="fas fa-barcode"></i>
                            </div>
                            <h3>Processing Sales Out...</h3>
                            <p>Please wait while we update inventory and records</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
