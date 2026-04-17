"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Printer, AlertCircle, CheckCircle2, ChevronDown, Loader2, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import styles from './sticker.module.css';

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

interface PurchaseLot {
    id: number;
    lotId: string;
    lotNumber: string | null;
    supplierName: string;
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
    screenSize?: string | null;
    screenResolution?: string | null;
    qcCount?: number;
}

export default function StickerPrintingPage() {
    // Label Config
    const [labelConfig, setLabelConfig] = useState<LabelConfig | null>(null);

    // Lot and Item State
    const [lots, setLots] = useState<PurchaseLot[]>([]);
    const [selectedLotId, setSelectedLotId] = useState<string>('');
    const [lotItems, setLotItems] = useState<PurchaseLotItem[]>([]);
    const [isLoadingLots, setIsLoadingLots] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    const [selectedItemGroup, setSelectedItemGroup] = useState<{ ids: number[], item: PurchaseLotItem, remaining: number } | null>(null);

    // Form Fields
    const [productSerial, setProductSerial] = useState('');
    const [bchSerialNumber, setBchSerialNumber] = useState('BCH-XXXX'); // Dynamically set after saving
    const [ram, setRam] = useState('');
    const [ssd, setSsd] = useState('');
    const [graphics, setGraphics] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Print tracking
    const [printQueue, setPrintQueue] = useState<string | null>(null);

    const printRef = useRef<HTMLDivElement>(null);

    // Initial Fetch for Label Config and active Lots
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingLots(true);
            try {
                // 1. Fetch Label
                const labelRes = await fetch('/api/bch/label-settings?name=default_label', { cache: 'no-store' });
                const labelData = await labelRes.json();
                if (labelData.success && labelData.config) {
                    const defaults: any = {
                        unit: 'cm', width: 10, height: 6, borderRadius: 0, showBorder: true,
                        productNameSize: 14, productNamePos: { x: 0.5, y: 0.5 }, productNameWidth: 9,
                        barcodeScale: 1.5, barcodeHeight: 40, barcodeFontSize: 12, barcodePos: { x: 0.5, y: 2.5 },
                        barcodeTextPos: { x: 0.5, y: 3.8 }, barcodeTextFontSize: 8,
                        specsFontSize: 10, specsLineHeight: 1.4, specsPos: { x: 5.5, y: 2.5 },
                        lotFontSize: 12, lotPos: { x: 5.5, y: 5.0 }
                    };
                    setLabelConfig({ ...defaults, ...labelData.config, unit: labelData.config.unit || defaults.unit });
                }

                // 2. Fetch Lots
                const lotRes = await fetch('/api/bch/purchase/lots?status=active', { cache: 'no-store' });
                const lotData = await lotRes.json();
                if (lotData.success) {
                    setLots(lotData.lots);
                }
            } catch (error) {
                console.error("Failed to load initial data:", error);
                toast.error("Failed to load initialization data.");
            } finally {
                setIsLoadingLots(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Lot Items when a Lot is selected
    useEffect(() => {
        if (selectedLotId && !isNaN(Number(selectedLotId))) {
            const fetchItems = async () => {
                setIsLoadingItems(true);
                try {
                    const response = await fetch(`/api/bch/purchase/lots/details?id=${selectedLotId}&_=${Date.now()}`, { cache: 'no-store' });
                    const data = await response.json();
                    if (data.success && data.lot) {
                        setLotItems(data.lot.items || []);
                    } else {
                        setLotItems([]);
                    }
                } catch (error) {
                    console.error('Error fetching lot items:', error);
                    toast.error('Failed to load products for this lot.');
                } finally {
                    setIsLoadingItems(false);
                }
            };
            fetchItems();

            // Reset lower selections
            setSelectedItemGroup(null);
            setRam('');
            setSsd('');
            setGraphics('');
            setProductSerial('');
            setBchSerialNumber('BCH-XXXX');
        } else {
            setLotItems([]);
            setSelectedItemGroup(null);
        }
    }, [selectedLotId]);

    // Group Identical Products similar to QCChecking
    const itemOptions = useMemo(() => {
        const grouped = new Map<string, { remaining: number, ids: number[], item: PurchaseLotItem }>();

        lotItems.forEach(item => {
            const remaining = item.quantity - (item.qcCount || 0);
            if (remaining <= 0) return; // Skip fully processed items

            const key = item.productName || item.model || 'Unknown Product';

            if (!grouped.has(key)) {
                grouped.set(key, { remaining: 0, ids: [], item });
            }
            const group = grouped.get(key)!;
            group.remaining += remaining;
            group.ids.push(item.itemId); // Pool of staging IDs available for this model
        });

        return Array.from(grouped.entries()).map(([name, group]) => ({
            label: `${name} (Qty: ${group.remaining})`,
            value: name,
            group: group
        }));
    }, [lotItems]);

    // Keep selectedItemGroup in sync with real quantity so UI always shows updated remaining items 
    useEffect(() => {
        if (selectedItemGroup) {
            const currentSelectedName = selectedItemGroup.item.productName || selectedItemGroup.item.model || 'Unknown Product';
            const updatedGroup = itemOptions.find(opt => opt.value === currentSelectedName);

            if (updatedGroup) {
                // If it changed, quietly update the underlying state so it points to the new IDs and count
                // We stringify IDs because checking reference equality for arrays always fails if it's recreated
                if (updatedGroup.group.remaining !== selectedItemGroup.remaining ||
                    updatedGroup.group.ids.join(',') !== selectedItemGroup.ids.join(',')) {
                    setSelectedItemGroup(updatedGroup.group);
                }
            } else {
                // If the product is fully exhausted (qty dropped to 0), it disappears from itemOptions
                setSelectedItemGroup(null);
                setBchSerialNumber('BCH-XXXX');
                setProductSerial('');
            }
        }
    }, [itemOptions, selectedItemGroup]);
    // Listen for the print queue update allowing React to render the final Barcode SVG
    useEffect(() => {
        if (printQueue && bchSerialNumber === printQueue) {
            // Give the browser DOM a tiny fraction to physically construct the SVG
            setTimeout(() => {
                printBrowserAction();
                setPrintQueue(null);
            }, 150);
        }
    }, [printQueue, bchSerialNumber]);

    const handleSelectProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedKey = e.target.value;
        if (!selectedKey) {
            setSelectedItemGroup(null);
            return;
        }

        const option = itemOptions.find(opt => opt.value === selectedKey);
        if (option) {
            const product = option.group.item;
            setSelectedItemGroup(option.group);
            setRam(product.ram || '');
            setSsd(product.storage || '');
            setGraphics(product.graphics || '');
            setProductSerial('');
            setBchSerialNumber('BCH-XXXX');
            toast.info(`Selected product loaded.`);
        }
    };

    const handleSaveAndPrint = async () => {
        if (!selectedLotId || !selectedItemGroup) {
            toast.error("Please select a Lot and Product.");
            return;
        }
        if (!productSerial) {
            toast.error("Please enter a Product Serial Number.");
            return;
        }

        // Pop an available Staging Item ID
        const stagingItemId = selectedItemGroup.ids[0];
        const rawItem = selectedItemGroup.item;

        setIsSaving(true);
        try {
            // POST to Inventory QC -> Inserts to master_inventory & marks as QC Passed
            const payload = {
                purchaseLotItemId: stagingItemId,
                lotId: parseInt(selectedLotId),

                // Construct product data
                productName: rawItem.productName,
                sku: productSerial, // Store manual Serial Number as SKU
                brand: rawItem.brand || '',
                model: rawItem.model || '',
                series: rawItem.series || '',
                processor: rawItem.processor || '',
                processor_gen: rawItem.processorGen || '',

                // User Overrides
                ram: ram,
                storage: ssd,
                graphics_card: graphics,

                screen_size: rawItem.screenSize || '',
                screen_resolution: rawItem.screenResolution || '',
                qc_status: 'Passed'
            };

            const res = await fetch('/api/bch/inventory/qc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Saved to Master Inventory!');

                // Formulate the Barcode string based on inserted ID
                const seqNumber = 999 + data.newMasterItemId;
                const barcodeVal = `BCH-${seqNumber}`;

                // Set the barcode in state so the QR constructs itself
                setBchSerialNumber(barcodeVal);

                // Add to queue so the useEffect prints it once visually rendered
                setPrintQueue(barcodeVal);

                // Refresh the items count for the dropdown by re-fetching
                const refreshRes = await fetch(`/api/bch/purchase/lots/details?id=${selectedLotId}&_=${Date.now()}`, { cache: 'no-store' });
                const refreshData = await refreshRes.json();
                if (refreshData.success && refreshData.lot) {
                    setLotItems(refreshData.lot.items || []);
                }

                // Clear manual entries for the next sticker in the queue
                setProductSerial('');
            } else {
                toast.error(`Failed to save: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("An error occurred while saving the data.");
        } finally {
            setIsSaving(false);
        }
    };

    const printBrowserAction = () => {
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
                    width: ${labelConfig ? `${labelConfig.width}${labelConfig.unit || 'cm'}` : '10cm'} !important; 
                    height: ${labelConfig ? `${labelConfig.height}${labelConfig.unit || 'cm'}` : '6cm'} !important;
                    border: ${labelConfig?.showBorder ? '1px solid #000' : 'none'} !important;
                    border-radius: ${labelConfig?.borderRadius || 0}px !important;
                    background-color: white !important;
                    overflow: hidden !important;
                }
            }
        `;
        document.head.appendChild(style);
        window.print();
        setTimeout(() => document.head.removeChild(style), 100);
    };

    const selectedLotObj = lots.find(l => l.id.toString() === selectedLotId);
    const activeLotNumber = selectedLotObj ? (selectedLotObj.lotNumber || `Lot #${selectedLotObj.lotId}`) : '';
    const activeProductName = selectedItemGroup?.item.productName || 'Select a product...';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Sticker Printing & Inventory Processor</h1>
                <p>Select imported Lots, override specs, generate serial stickers, and save directly to Master Inventory.</p>
            </div>

            <div className={styles.grid}>
                {/* Form Section */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <PackageOpen size={22} />
                        Data Selection
                    </h2>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>1. Select Purchase Lot</label>
                        <select
                            className={styles.input}
                            value={selectedLotId}
                            onChange={(e) => setSelectedLotId(e.target.value)}
                            disabled={isLoadingLots}
                            style={{ cursor: isLoadingLots ? 'wait' : 'pointer' }}
                        >
                            <option value="">-- Choose a Lot --</option>
                            {lots.map(lot => (
                                <option key={lot.id} value={lot.id.toString()}>
                                    {lot.lotNumber || `Lot #${lot.lotId}`} - {lot.supplierName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>2. Select Product Model</label>
                        <select
                            className={styles.input}
                            value={selectedItemGroup?.item.productName || ''}
                            onChange={handleSelectProduct}
                            disabled={!selectedLotId || isLoadingItems}
                            style={{ cursor: (!selectedLotId || isLoadingItems) ? 'not-allowed' : 'pointer' }}
                        >
                            <option value="">-- Choose a Product --</option>
                            {itemOptions.map((opt, idx) => (
                                <option key={idx} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {isLoadingItems && <p className={styles.hint} style={{ color: '#6366f1' }}>Loading lot items...</p>}
                    </div>

                    <div className={styles.formGroup} style={{ marginTop: '2rem' }}>
                        <label className={styles.label}>
                            Product Serial Number <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g. 17JW2F3 (Service Tag / S/N)"
                            value={productSerial}
                            onChange={(e) => setProductSerial(e.target.value.toUpperCase())}
                        />
                        <p className={styles.hint}>Found on the manufacturer sticker. This will be saved as the product SKU.</p>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>RAM Override</label>
                            <select
                                className={styles.input}
                                value={ram}
                                onChange={(e) => setRam(e.target.value)}
                            >
                                <option value="">-- Clear / None --</option>
                                {ram && !['4GB', '8GB', '16GB', '32GB'].includes(ram) && (
                                    <option value={ram}>{ram} (Original)</option>
                                )}
                                <option value="4GB">4GB</option>
                                <option value="8GB">8GB</option>
                                <option value="16GB">16GB</option>
                                <option value="32GB">32GB</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>SSD Override</label>
                            <select
                                className={styles.input}
                                value={ssd}
                                onChange={(e) => setSsd(e.target.value)}
                            >
                                <option value="">-- Clear / None --</option>
                                {ssd && !['128GB', '256GB', '500GB', '512GB', '1TB', '2TB'].includes(ssd) && (
                                    <option value={ssd}>{ssd} (Original)</option>
                                )}
                                <option value="128GB">128GB</option>
                                <option value="256GB">256GB</option>
                                <option value="500GB">500GB</option>
                                <option value="512GB">512GB</option>
                                <option value="1TB">1TB</option>
                                <option value="2TB">2TB</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Graphics Override</label>
                        <select
                            className={styles.input}
                            value={graphics}
                            onChange={(e) => setGraphics(e.target.value)}
                        >
                            <option value="">-- Clear / None --</option>
                            {graphics && !['No Graphics', 'Onboard Graphics', 'Intel UHD Graphics', 'Intel Iris Xe', 'AMD Radeon Graphics', '2GB Dedicated', '4GB Dedicated', '6GB Dedicated', '8GB Dedicated', '12GB Dedicated', '16GB Dedicated'].includes(graphics) && (
                                <option value={graphics}>{graphics} (Original)</option>
                            )}
                            <option value="No Graphics">No Graphics</option>
                            <option value="Onboard Graphics">Onboard Graphics</option>
                            <option value="Intel UHD Graphics">Intel UHD Graphics</option>
                            <option value="Intel Iris Xe">Intel Iris Xe</option>
                            <option value="AMD Radeon Graphics">AMD Radeon Graphics</option>
                            <option value="2GB Dedicated">2GB Dedicated</option>
                            <option value="4GB Dedicated">4GB Dedicated</option>
                            <option value="6GB Dedicated">6GB Dedicated</option>
                            <option value="8GB Dedicated">8GB Dedicated</option>
                            <option value="12GB Dedicated">12GB Dedicated</option>
                            <option value="16GB Dedicated">16GB Dedicated</option>
                        </select>
                    </div>
                </div>

                {/* Preview and Action Section */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <Printer size={22} />
                        Dynamic Layout Preview
                    </h2>

                    <div className={styles.previewStage}>
                        <div className={styles.previewCard} style={{ display: 'inline-block' }}>
                            {/* The precise printable area mimicking QCChecking layout */}
                            <div ref={printRef} className="print-label-container" style={{
                                position: 'relative',
                                width: labelConfig ? `${labelConfig.width}${labelConfig.unit || 'cm'}` : '10cm',
                                height: labelConfig ? `${labelConfig.height}${labelConfig.unit || 'cm'}` : '6cm',
                                border: labelConfig?.showBorder ? '1px solid #000' : 'none',
                                borderRadius: labelConfig ? `${labelConfig.borderRadius}px` : '0px',
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                margin: '0 auto',
                                flexShrink: 0
                            }}>
                                {labelConfig ? (
                                    <>
                                        {/* Product Name & Serial */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${labelConfig.productNamePos?.x || 0}${labelConfig.unit || 'cm'}`,
                                            top: `${labelConfig.productNamePos?.y || 0}${labelConfig.unit || 'cm'}`,
                                            width: `${labelConfig.productNameWidth || 9}${labelConfig.unit || 'cm'}`,
                                            fontSize: `${labelConfig.productNameSize || 14}pt`,
                                            fontWeight: 900,
                                            lineHeight: 1.1,
                                            color: '#000',
                                            wordWrap: 'break-word',
                                            textTransform: 'uppercase'
                                        }}>
                                            <div style={{ fontSize: '0.85em', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '2px', marginBottom: '4px' }}>
                                                S/N: {productSerial || '_____________'}
                                            </div>
                                            {activeProductName}
                                        </div>

                                        {/* QR Code */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${labelConfig.barcodePos?.x || 0}${labelConfig.unit || 'cm'}`,
                                            top: `${labelConfig.barcodePos?.y || 0}${labelConfig.unit || 'cm'}`,
                                            transformOrigin: 'top left'
                                        }}>
                                            <div style={{ transform: 'scale(1)' }}>
                                                <QRCodeSVG
                                                    value={bchSerialNumber !== 'BCH-XXXX' ? bchSerialNumber : 'BCH-PREVIEW'}
                                                    size={labelConfig.barcodeHeight || 40}
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
                                                {bchSerialNumber !== 'BCH-XXXX' ? bchSerialNumber : 'BCH-PVW'}
                                            </div>
                                        )}

                                        {/* Specs */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${labelConfig.specsPos?.x || 0}${labelConfig.unit || 'cm'}`,
                                            top: `${labelConfig.specsPos?.y || 0}${labelConfig.unit || 'cm'}`,
                                            fontSize: `${labelConfig.specsFontSize || 10}pt`,
                                            lineHeight: labelConfig.specsLineHeight || 1.4,
                                            fontWeight: 700,
                                            color: '#000'
                                        }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>MEMORY:</span> {ram}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>STORAGE:</span> {ssd}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>GPU:</span> {graphics}
                                            </div>
                                        </div>

                                        {/* Lot Number */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${labelConfig.lotPos?.x || 0}${labelConfig.unit || 'cm'}`,
                                            top: `${labelConfig.lotPos?.y || 0}${labelConfig.unit || 'cm'}`,
                                            fontSize: `${labelConfig.lotFontSize || 12}pt`,
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            color: '#000'
                                        }}>
                                            LOT: {activeLotNumber}
                                        </div>
                                    </>
                                ) : (
                                    /* Fallback to old layout if no config loaded */
                                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                                        <h4 style={{ margin: '0 0 1rem 0.5rem', fontSize: '1.3rem', fontWeight: 900, lineHeight: 1.1, color: '#000', width: '90%', textTransform: 'uppercase' }}>
                                            <div style={{ fontSize: '0.7em', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '2px', marginBottom: '4px' }}>
                                                S/N: {productSerial || '_____________'}
                                            </div>
                                            {activeProductName}
                                        </h4>
                                        <div style={{ display: 'flex', flex: 1, width: '100%', alignItems: 'center' }}>
                                            <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <QRCodeSVG value={bchSerialNumber !== 'BCH-XXXX' ? bchSerialNumber : 'BCH-PREVIEW'} size={80} level={"H"} includeMargin={false} />
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, textAlign: 'center', marginTop: '4px' }}>
                                                    {bchSerialNumber !== 'BCH-XXXX' ? bchSerialNumber : 'BCH-PVW'}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#000', fontWeight: 700 }}>
                                                    <div>MEMORY: {ram}</div>
                                                    <div>STORAGE: {ssd}</div>
                                                    <div>GPU: {graphics}</div>
                                                    <div style={{ marginTop: '0.5rem', fontWeight: 900, fontSize: '1.1rem' }}>LOT: {activeLotNumber}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        {!selectedLotId || !selectedItemGroup ? (
                            <div className={`${styles.status} ${styles.warning}`}>
                                <AlertCircle /> Please select a lot and product
                            </div>
                        ) : !productSerial ? (
                            <div className={`${styles.status} ${styles.warning}`}>
                                <AlertCircle /> Serial number is required
                            </div>
                        ) : (
                            <div className={`${styles.status} ${styles.ready}`}>
                                <CheckCircle2 /> Ready to Process
                            </div>
                        )}
                        <button
                            onClick={handleSaveAndPrint}
                            disabled={!selectedLotId || !selectedItemGroup || !productSerial || isSaving}
                            className={styles.printBtn}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                            {isSaving ? 'Processing...' : 'Save & Print Sticker'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
