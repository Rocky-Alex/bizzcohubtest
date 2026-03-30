import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import ConfirmModal from '@/app/bch/shared/ConfirmModal';

interface InventoryItem {
    id: number;
    barcode: string;
    lot_number: string;
    lot_id: number;
    brand: string;
    model: string;
    series: string;
    product_name: string;
    category: string;
    processor: string;
    processor_gen: string;
    ram: string;
    storage: string;
    condition_status: string;
    quantity: number;
    unit_cost: number;
    base_price: number;
    offer_price: number;
}

interface PurchaseItem {
    id: number;
    lot_number: string;
    lot_id: number;
    brand: string;
    model: string;
    series: string;
    product_name: string;
    category: string;
    processor: string;
    processor_gen: string;
    ram: string;
    storage: string;
    condition_status: string;
    quantity: number;
    qc_count: number;
    unit_cost: number;
    total_cost: number;
    supplier_name: string;
    lot_status: string;
}

interface SearchResults {
    master: InventoryItem[];
    purchase: PurchaseItem[];
}

interface SelectedEntry {
    id: number;
    ids?: number[];
    source: 'master' | 'purchase' | 'purchase-group';
    brand: string;
    model: string;
    series: string;
    lot_number: string;
    product_name: string;
    barcode: string;
    quantity: number;     // available
    qtySold: number;      // how many to sell
}

interface SaleRecord {
    id: number;
    barcode: string;
    lot_number: string;
    brand: string;
    model: string;
    series: string;
    product_name: string;
    qty_sold: number;
    sold_by: string;
    notes: string;
    sold_at: string;
    source: string;
}

export default function SaleOut() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResults | null>(null);

    // Multi-select
    const [selected, setSelected] = useState<Map<string, SelectedEntry>>(new Map());
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Notes autocomplete
    const [notesSuggestions, setNotesSuggestions] = useState<{type: string; label: string; value: string}[]>([]);
    const [notesSearchLoading, setNotesSearchLoading] = useState(false);
    const [showNotesSuggestions, setShowNotesSuggestions] = useState(false);
    const [saleMode, setSaleMode] = useState<'none' | 'invoice' | 'customer'>('none');
    const [selectedInvoice, setSelectedInvoice] = useState<string>('');
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');

    // Fulfillment Context
    const searchParams = useSearchParams();
    const [fulfillmentData, setFulfillmentData] = useState<{ document: any, items: any[] } | null>(null);
    const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
    const [fulfillmentMatches, setFulfillmentMatches] = useState<Record<number, any>>({});
    const [matchingLoading, setMatchingLoading] = useState<Record<number, boolean>>({});

    const notesDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const notesContainerRef = useRef<HTMLDivElement | null>(null);

    // Sale history
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const groupedHistory = useMemo(() => {
        const groups: any[] = [];
        history.forEach(item => {
            // Group by Invoice NO, Customer Name, Model, and exact timestamp
            const key = `${item.invoice_no || 'none'}-${item.customer_name || 'none'}-${item.model || 'none'}-${item.sold_at}`;
            const existing = groups.find(g => g.key === key);
            if (existing) {
                existing.qty_sold += item.qty_sold;
            } else {
                groups.push({
                    key,
                    ...item
                });
            }
        });
        return groups;
    }, [history]);

    // Scanner
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Confirm modal
    const [showConfirm, setShowConfirm] = useState(false);

    // Helpers
    const makeKey = (source: string, id: number) => `${source}-${id}`;

    const toggleSelect = (item: any, source: 'master' | 'purchase') => {
        const key = makeKey(source, item.id);
        setSelected(prev => {
            const next = new Map(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.set(key, { ...item, source, qtySold: item.quantity });
            }
            return next;
        });
    };

    const toggleGroupSelect = (group: any) => {
        const key = `purchaseGroup-${group.specKey}`;
        setSelected(prev => {
            const next = new Map(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.set(key, { ...group, source: 'purchase-group', qtySold: group.quantity });
            }
            return next;
        });
    };

    const isGroupSelected = (specKey: string) => selected.has(`purchaseGroup-${specKey}`);

    const updateQty = (key: string, qty: number) => {
        setSelected(prev => {
            const next = new Map(prev);
            const entry = next.get(key);
            if (entry) {
                next.set(key, { ...entry, qtySold: Math.max(1, Math.min(entry.quantity, qty)) });
            }
            return next;
        });
    };

    const removeSelected = (key: string) => {
        setSelected(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
        });
    };

    const clearAll = () => setSelected(new Map());

    const isSelected = (source: string, id: number) => selected.has(makeKey(source, id));

    const selectAllMaster = (lotNum?: string) => {
        if (!results) return;
        setSelected(prev => {
            const next = new Map(prev);
            results.master.forEach(item => {
                if (lotNum && item.lot_number !== lotNum) return;
                const key = makeKey('master', item.id);
                if (!next.has(key)) {
                    next.set(key, {
                        id: item.id, source: 'master', brand: item.brand || '', model: item.model || '',
                        series: item.series || '', lot_number: item.lot_number || '', product_name: item.product_name || '',
                        barcode: item.barcode || '', quantity: item.quantity, qtySold: item.quantity
                    });
                }
            });
            return next;
        });
    };

    const selectAllPurchase = (lotNum?: string) => {
        if (!results) return;
        setSelected(prev => {
            const next = new Map(prev);
            Object.entries(purchaseGroupedByLot).forEach(([lot, groups]: [string, any]) => {
                if (lotNum && lot !== lotNum) return;
                groups.forEach((group: any) => {
                    const key = `purchaseGroup-${group.specKey}`;
                    if (!next.has(key)) {
                        next.set(key, { ...group, source: 'purchase-group', qtySold: group.quantity });
                    }
                });
            });
            return next;
        });
    };

    // Fetch sale history
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/bch/inventory/soldout?limit=50', { cache: 'no-store' });
            if (res.ok) { setHistory(await res.json()); }
        } catch (err) { console.error('Failed to fetch history:', err); }
        finally { setHistoryLoading(false); }
    };

    useEffect(() => { fetchHistory(); }, []);

    // Handle URL parameters for assisted fulfillment
    useEffect(() => {
        const invNo = searchParams.get('invoice');
        const qtnNo = searchParams.get('proforma') || searchParams.get('quotation');
        
        const docNo = invNo || qtnNo;
        const type = invNo ? 'invoice' : 'quotation';

        const fetchMatchesForItem = async (desc: string, index: number) => {
            setMatchingLoading(prev => ({ ...prev, [index]: true }));
            try {
                // Try to extract a searchable model (e.g. "P51", "P53") 
                // Heuristic: look for words with numbers or just use first 3-4 words
                const parts = desc.split(' ');
                const modelPart = parts.find(p => /\d/.test(p) && p.length > 2) || parts.slice(0, 3).join(' ');
                
                const res = await fetch(`/api/bch/inventory/soldout/lookup?query=${encodeURIComponent(modelPart)}`);
                if (res.ok) {
                    const data = await res.json();
                    setFulfillmentMatches(prev => ({ ...prev, [index]: data }));
                }
            } catch (err) {
                console.error(`Match fetch error for ${desc}:`, err);
            } finally {
                setMatchingLoading(prev => ({ ...prev, [index]: false }));
            }
        };

        if (docNo) {
            const fetchFulfillment = async () => {
                setFulfillmentLoading(true);
                try {
                    const res = await fetch(`/api/bch/invoices/lookup-by-number?number=${encodeURIComponent(docNo)}&type=${type}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFulfillmentData(data);
                        setSaleMode('invoice');
                        setSelectedInvoice(`${data.document.invoice_no || data.document.quotation_no} — ${data.document.customer_name}`);
                        toast.info(`Fulfilling ${type === 'invoice' ? 'Invoice' : 'Proforma'} ${docNo}`);
                        
                        // Fetch matches for each item
                        data.items.forEach((item: any, idx: number) => {
                            fetchMatchesForItem(item.description, idx);
                        });
                    }
                } catch (err) {
                    console.error('Fulfillment fetch error:', err);
                } finally {
                    setFulfillmentLoading(false);
                }
            };
            fetchFulfillment();
        }
    }, [searchParams]);

    // Search
    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) { setResults(null); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/bch/inventory/soldout/lookup?query=${encodeURIComponent(searchQuery.trim())}`);
            if (res.ok) { setResults(await res.json()); }
            else { toast.error('Search failed'); }
        } catch (err) { console.error(err); toast.error('Error searching'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) { setResults(null); return; }
        if (!isScanning) {
            debounceRef.current = setTimeout(() => performSearch(query), 400);
        }
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, isScanning]);

    // Scanner
    const startScanner = async () => {
        setIsScanning(true);
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("sale-out-reader");
                scannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                    (decodedText) => {
                        setQuery(decodedText);
                        stopScanner();
                        performSearch(decodedText);
                        toast.success('Barcode detected!');
                    },
                    () => { }
                );
            } catch (err) {
                console.error("Error starting scanner:", err);
                toast.error("Failed to start camera.");
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); scannerRef.current.clear(); scannerRef.current = null; }
            catch (err) { console.error("Failed to stop scanner", err); }
        }
        setIsScanning(false);
    };

    useEffect(() => {
        return () => { if (scannerRef.current && isScanning) { scannerRef.current.stop().catch(console.error); } };
    }, [isScanning]);

    const searchNotes = async (q: string) => {
        setNotesSearchLoading(true);
        try {
            const res = await fetch(`/api/bch/inventory/soldout/notes-search?query=${encodeURIComponent(q.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setNotesSuggestions(data.suggestions || []);
                setShowNotesSuggestions(true);
            }
        } catch (err) {
            console.error('Notes search error:', err);
        } finally {
            setNotesSearchLoading(false);
        }
    };

    const handleNotesChange = (val: string) => {
        setNotes(val);
        if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
        if (!val.trim() || val.trim().length < 2) {
            setNotesSuggestions([]);
            setShowNotesSuggestions(false);
            return;
        }
        notesDebounceRef.current = setTimeout(() => searchNotes(val), 300);
    };

    const selectNotesSuggestion = (suggestion: {type: string; label: string; value: string}) => {
        if (saleMode === 'none') setNotes(suggestion.value);
        else if (saleMode === 'invoice') setSelectedInvoice(suggestion.value);
        else setSelectedCustomer(suggestion.value);
        
        setShowNotesSuggestions(false);
        setNotesSuggestions([]);
    };

    // Close notes dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notesContainerRef.current && !notesContainerRef.current.contains(e.target as Node)) {
                setShowNotesSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Bulk confirm sale
    const handleBulkConfirmSale = async () => {
        if (selected.size === 0) return;
        setShowConfirm(false);
        setSubmitting(true);
        const toastId = toast.loading(`Processing ${selected.size} items...`);

        try {
            const saleItems: any[] = [];
            selected.forEach((entry, key) => {
                if (key.startsWith('purchaseGroup-') && entry.ids) {
                    let toSell = entry.qtySold;
                    // Distribute total quantity across the collected primary keys (IDs) in this group
                    entry.ids.forEach((id: number) => {
                        if (toSell <= 0) return;
                        const originalItem = results?.purchase.find((p: any) => p.id === id);
                        const canSell = Math.min(toSell, originalItem?.quantity || 1);
                        if (canSell > 0) {
                            saleItems.push({ id, source: 'purchase', qtySold: canSell });
                            toSell -= canSell;
                        }
                    });
                } else {
                    saleItems.push({ id: entry.id, source: entry.source === 'purchase-group' ? 'purchase' : entry.source, qtySold: entry.qtySold });
                }
            });

            const res = await fetch('/api/bch/inventory/soldout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items: saleItems, 
                    notes: saleMode === 'none' ? notes : '', 
                    invoiceNo: saleMode === 'invoice' ? selectedInvoice : null,
                    customerName: saleMode === 'customer' ? selectedCustomer : (saleMode === 'invoice' ? (selectedInvoice.includes(' — ') ? selectedInvoice.split(' — ')[1] : null) : null),
                    soldBy: 'Admin' 
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message, { id: toastId });
                if (data.errors?.length) {
                    data.errors.forEach((err: string) => toast.error(err));
                }
                setSelected(new Map());
                setNotes('');
                setResults(null);
                setQuery('');
                fetchHistory();
            } else {
                toast.error(data.error || 'Sale failed', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('An unexpected error occurred', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    // Aggregates
    const totalResults = (results?.master?.length || 0) + (results?.purchase?.length || 0);
    const totalSelectedQty = Array.from(selected.values()).reduce((s, e) => s + e.qtySold, 0);

    // Group results by lot_number
    const masterGroupedByLot: Record<string, InventoryItem[]> = {};
    (results?.master || []).forEach(item => {
        const key = item.lot_number || 'No Lot';
        if (!masterGroupedByLot[key]) masterGroupedByLot[key] = [];
        masterGroupedByLot[key].push(item);
    });

    const purchaseGroupedByLot = useMemo(() => {
        if (!results) return {};
        const lotGroups: Record<string, any[]> = {};
        
        results.purchase.forEach((item: any) => {
            const lot = item.lot_number || 'No Lot';
            if (!lotGroups[lot]) lotGroups[lot] = [];
            
            // Group by specifications
            const specKey = `${item.brand}-${item.model}-${item.series}-${item.processor}-${item.ram}-${item.storage}`;
            const existing = lotGroups[lot].find((g: any) => g.specKey === specKey);
            
            if (existing) {
                existing.quantity += item.quantity;
                existing.ids.push(item.id);
            } else {
                lotGroups[lot].push({
                    ...item,
                    specKey,
                    ids: [item.id]
                });
            }
        });
        return lotGroups;
    }, [results]);

    const thStyle: React.CSSProperties = { padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
    const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#334155', fontSize: '0.9rem' };
    const checkboxStyle: React.CSSProperties = { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>

            {/* Fullscreen Scanner Modal */}
            {isScanning && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                        <button onClick={stopScanner} style={{
                            position: 'absolute', top: '-40px', right: '10px',
                            background: 'transparent', border: 'none', color: 'white',
                            fontSize: '2rem', cursor: 'pointer', zIndex: 10000
                        }}>&times;</button>
                        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '1rem' }}>
                            <i className="fas fa-barcode" style={{ marginRight: '8px' }}></i>Scan Barcode
                        </h3>
                        <div id="sale-out-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'black' }}></div>
                        <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '1rem', padding: '0 20px' }}>
                            Point your device camera at a barcode.
                        </p>
                    </div>
                </div>
            )}

            {/* Fulfillment Checklist */}
            {fulfillmentData && (
                <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-clipboard-check"></i>
                            Fulfillment Checklist: {fulfillmentData.document.invoice_no || fulfillmentData.document.quotation_no}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                                {fulfillmentData.document.customer_name}
                            </div>
                            <button 
                                onClick={() => { setFulfillmentData(null); setSaleMode('none'); setSelectedInvoice(''); }}
                                style={{ background: '#dbeafe', border: 'none', padding: '4px 8px', borderRadius: '6px', color: '#1e40af', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                                <i className="fas fa-times"></i> Exit
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {fulfillmentData.items.map((item, idx) => {
                            // Find total qty of this item category in selected items
                            const foundQty = Array.from(selected.values()).reduce((acc, sel) => {
                                // Match by model/description fuzzy
                                const selTxt = `${sel.brand} ${sel.model} ${sel.series}`.toLowerCase();
                                const itemTxt = item.description.toLowerCase();
                                if (selTxt.includes(itemTxt) || itemTxt.includes(sel.model.toLowerCase())) {
                                    return acc + sel.qtySold;
                                }
                                return acc;
                            }, 0);
                            const isDone = foundQty >= item.quantity;

                            return (
                                <div key={idx} style={{ 
                                    background: 'white', padding: '1rem', borderRadius: '12px', 
                                    border: `1px solid ${isDone ? '#bbf7d0' : '#dbeafe'}`,
                                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, marginRight: '10px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDone ? '#166534' : '#1e40af', lineHeight: 1.3 }}>{item.description}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                                Needed: <span style={{ fontWeight: 700 }}>{item.quantity}</span> | Matched: <span style={{ fontWeight: 700, color: isDone ? '#15803d' : '#3b82f6' }}>{foundQty}</span>
                                            </div>
                                        </div>
                                        {isDone ? (
                                            <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i>
                                        ) : (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }}></div>
                                        )}
                                    </div>

                                    {/* Suggestions Section */}
                                    {!isDone && (
                                        <div style={{ marginTop: '0.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="fas fa-search-plus" style={{ fontSize: '0.7rem' }}></i> Available Stock
                                            </div>
                                            
                                            {matchingLoading[idx] ? (
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '8px', textAlign: 'center' }}>
                                                    <i className="fas fa-circle-notch fa-spin"></i> Finding matches...
                                                </div>
                                            ) : (fulfillmentMatches[idx]?.master?.length > 0 || fulfillmentMatches[idx]?.purchase?.length > 0) ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                                                    {/* Master Inventory Suggestions */}
                                                    {fulfillmentMatches[idx]?.master?.slice(0, 5).map((m: any) => (
                                                        <div key={`m-${m.id}`} style={{ 
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                            background: isSelected('master', m.id) ? '#eff6ff' : '#f8fafc', 
                                                            padding: '6px 10px', borderRadius: '8px', border: `1px solid ${isSelected('master', m.id) ? '#bfdbfe' : '#f1f5f9'}`
                                                        }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155' }}>Lot: {m.lot_number?.slice(-6)}</span>
                                                                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{m.brand} {m.model} ({m.quantity} pcs)</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => toggleSelect(m, 'master')}
                                                                style={{ 
                                                                    background: isSelected('master', m.id) ? '#3b82f6' : 'white', 
                                                                    color: isSelected('master', m.id) ? 'white' : '#3b82f6', 
                                                                    border: `1px solid ${isSelected('master', m.id) ? '#3b82f6' : '#bfdbfe'}`, 
                                                                    borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {isSelected('master', m.id) ? 'Selected' : 'Add'}
                                                            </button>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Purchase Lot Suggestions */}
                                                    {fulfillmentMatches[idx]?.purchase?.slice(0, 3).map((p: any) => (
                                                        <div key={`p-${p.id}`} style={{ 
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                            background: isSelected('purchase', p.id) ? '#fff7ed' : '#fefce8', 
                                                            padding: '6px 10px', borderRadius: '8px', border: `1px solid ${isSelected('purchase', p.id) ? '#ffedd5' : '#fef9c3'}`
                                                        }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9a3412' }}>Lot: {p.lot_number?.slice(-6)} (Inbound)</span>
                                                                <span style={{ fontSize: '0.6rem', color: '#b45309' }}>{p.brand} {p.model} ({p.quantity} pcs)</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => toggleSelect(p, 'purchase')}
                                                                style={{ 
                                                                    background: isSelected('purchase', p.id) ? '#f97316' : 'white', 
                                                                    color: isSelected('purchase', p.id) ? 'white' : '#f97316', 
                                                                    border: `1px solid ${isSelected('purchase', p.id) ? '#f97316' : '#fed7aa'}`, 
                                                                    borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {isSelected('purchase', p.id) ? 'Selected' : 'Add'}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', padding: '8px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                                    No direct matches found in inventory
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem' }}>
                            <i className="fas fa-shopping-cart"></i>
                        </div>
                        Sale Out
                    </h2>
                    <p style={{ color: '#64748b', marginTop: '0.25rem', marginLeft: '56px' }}>Select multiple items, set quantities, and confirm sold in bulk</p>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{
                display: 'flex', gap: '0.75rem', marginBottom: '1.5rem',
                background: 'white', padding: '1rem', borderRadius: '16px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (debounceRef.current) clearTimeout(debounceRef.current); performSearch(query); } }}
                        placeholder="Search by barcode, model, brand, lot number..."
                        style={{
                            width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                            borderRadius: '10px', border: '1px solid #e2e8f0',
                            fontSize: '0.95rem', outline: 'none', background: '#f8fafc',
                            transition: 'border 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                    {loading && <i className="fas fa-circle-notch fa-spin" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>}
                </div>
                <button type="button" onClick={startScanner} style={{
                    padding: '0 1.25rem', background: '#0f172a', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                    transition: 'all 0.2s', fontSize: '0.9rem'
                }} title="Scan Barcode">
                    <i className="fas fa-barcode"></i> Scan
                </button>
            </div>

            {/* ====== SELECTED ITEMS PANEL (Sticky Cart) ====== */}
            {selected.size > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #fef2f2, #fff7ed)',
                    border: '2px solid #ef4444',
                    borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.15)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-cart-arrow-down" style={{ color: '#ef4444' }}></i>
                            Items to Sell
                            <span style={{ fontSize: '0.75rem', background: '#fecaca', color: '#b91c1c', padding: '2px 10px', borderRadius: '10px', fontWeight: 700 }}>
                                {selected.size} selected &middot; {totalSelectedQty} pcs
                            </span>
                        </h3>
                        <button onClick={clearAll} style={{
                            background: 'none', border: '1px solid #fca5a5', borderRadius: '8px',
                            padding: '4px 12px', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600
                        }}>
                            <i className="fas fa-times" style={{ marginRight: '4px' }}></i> Clear All
                        </button>
                    </div>

                    {/* Selected items table */}
                    <div style={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                                <tr>
                                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#fef2f2', zIndex: 10 }}>Source</th>
                                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#fef2f2', zIndex: 10 }}>Lot</th>
                                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#fef2f2', zIndex: 10 }}>Brand</th>
                                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#fef2f2', zIndex: 10 }}>Model</th>
                                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#fef2f2', zIndex: 10 }}>Available</th>
                                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#fef2f2', zIndex: 10 }}>Qty to Sell</th>
                                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#fef2f2', zIndex: 10, textAlign: 'center' }}>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(selected.entries()).map(([key, entry]) => (
                                    <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                                                background: entry.source === 'master' ? '#d1fae5' : '#fef3c7',
                                                color: entry.source === 'master' ? '#065f46' : '#92400e'
                                            }}>
                                                {entry.source === 'master' ? 'Inventory' : 'Purchase'}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, color: '#4f46e5', fontWeight: 500, fontSize: '0.85rem' }}>{entry.lot_number || '-'}</td>
                                        <td style={{ ...tdStyle, fontWeight: 600 }}>{entry.brand}</td>
                                        <td style={tdStyle}>{entry.model}</td>
                                        <td style={{ ...tdStyle, color: '#64748b' }}>{entry.quantity}</td>
                                        <td style={tdStyle}>
                                            <input
                                                type="number"
                                                min={1}
                                                max={entry.quantity}
                                                value={entry.qtySold}
                                                onChange={(e) => updateQty(key, parseInt(e.target.value) || 1)}
                                                style={{
                                                    width: '70px', padding: '4px 8px', borderRadius: '6px',
                                                    border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700,
                                                    textAlign: 'center', outline: 'none'
                                                }}
                                            />
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button onClick={() => removeSelected(key)} style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#ef4444', fontSize: '1rem', padding: '2px 6px'
                                            }} title="Remove">
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mode Selection */}
                    <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1.5rem', background: 'white', padding: '10px 16px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Sale Type:</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: '#1e293b' }}>
                            <input type="radio" name="saleMode" checked={saleMode === 'none'} onChange={() => { setSaleMode('none'); setNotes(''); }} /> Without Invoice
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: '#1e293b' }}>
                            <input type="radio" name="saleMode" checked={saleMode === 'invoice'} onChange={() => { setSaleMode('invoice'); setSelectedInvoice(''); }} /> With Invoice
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: '#1e293b' }}>
                            <input type="radio" name="saleMode" checked={saleMode === 'customer'} onChange={() => { setSaleMode('customer'); setSelectedCustomer(''); }} /> With Customer
                        </label>
                    </div>

                    {/* Notes / Invoice / Customer Search */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div ref={notesContainerRef} style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                {saleMode === 'none' ? 'Notes (optional)' : saleMode === 'invoice' ? 'Search Invoice' : 'Search Customer'}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <i className={saleMode === 'none' ? 'fas fa-pen' : (saleMode === 'invoice' ? 'fas fa-file-invoice' : 'fas fa-user')} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}></i>
                                <input
                                    type="text"
                                    value={saleMode === 'none' ? notes : (saleMode === 'invoice' ? selectedInvoice : selectedCustomer)}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (saleMode === 'none') setNotes(v);
                                        else if (saleMode === 'invoice') setSelectedInvoice(v);
                                        else setSelectedCustomer(v);
                                        handleNotesChange(v);
                                    }}
                                    onFocus={() => { 
                                        const v = saleMode === 'none' ? notes : (saleMode === 'invoice' ? selectedInvoice : selectedCustomer);
                                        handleNotesChange(v); 
                                        setShowNotesSuggestions(true);
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setShowNotesSuggestions(false); }}
                                    placeholder={saleMode === 'none' ? 'e.g. Reference, details...' : (saleMode === 'invoice' ? 'Enter invoice number or name...' : 'Enter customer name...')}
                                    style={{
                                        width: '100%', padding: '0.6rem 0.75rem 0.6rem 2rem', borderRadius: '8px',
                                        border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none',
                                        transition: 'border 0.2s'
                                    }}
                                />
                                {notesSearchLoading && <i className="fas fa-circle-notch fa-spin" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}></i>}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showNotesSuggestions && notesSuggestions.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '4px',
                                    maxHeight: '220px', overflowY: 'auto'
                                }}>
                                    {notesSuggestions
                                        .filter(s => {
                                            if (saleMode === 'invoice') return ['invoice', 'proforma', 'quotation', 'receipt'].includes(s.type);
                                            if (saleMode === 'customer') return s.type === 'customer';
                                            return true;
                                        })
                                        .map((s, i) => {
                                            const getIconConfig = (type: string) => {
                                                switch(type) {
                                                    case 'invoice': return { icon: 'fas fa-file-invoice', bg: '#eff6ff', color: '#3b82f6' };
                                                    case 'proforma': return { icon: 'fas fa-file-signature', bg: '#fff7ed', color: '#f59e0b' };
                                                    case 'quotation': return { icon: 'fas fa-file-alt', bg: '#f1f5f9', color: '#64748b' };
                                                    case 'receipt': return { icon: 'fas fa-receipt', bg: '#fdf2f8', color: '#db2777' };
                                                    case 'customer': return { icon: 'fas fa-user', bg: '#f0fdf4', color: '#22c55e' };
                                                    default: return { icon: 'fas fa-pen', bg: '#f8fafc', color: '#94a3b8' };
                                                }
                                            };
                                            const config = getIconConfig(s.type);
                                            
                                            return (
                                                <div
                                                    key={`${s.type}-${i}`}
                                                    onClick={() => selectNotesSuggestion(s)}
                                                    style={{
                                                        padding: '10px 14px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        borderBottom: '1px solid #f1f5f9',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.8rem', flexShrink: 0,
                                                        background: config.bg,
                                                        color: config.color
                                                    }}>
                                                        <i className={config.icon}></i>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {s.label.split(': ')[1] || s.label}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>{s.type.replace('proforma', 'Proforma Invoice')}</span>
                                                            <span style={{ fontWeight: 600, color: config.color }}>Select <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }}></i></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={submitting}
                            style={{
                                padding: '0.7rem 2.5rem', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none',
                                fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                                transition: 'all 0.2s', opacity: submitting ? 0.7 : 1
                            }}
                        >
                            <i className="fas fa-check-double"></i>
                            Confirm Sold ({selected.size} items, {totalSelectedQty} pcs)
                        </button>
                    </div>
                </div>
            )}

            {/* ========== 1. MASTER INVENTORY RESULTS ========== */}
            {results && results.master?.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <i className="fas fa-boxes" style={{ color: '#10b981' }}></i>
                            Active Inventory (Master)
                            <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                                {results.master?.length} Items
                            </span>
                        </h3>
                        <button onClick={() => selectAllMaster()} style={{
                            background: '#d1fae5', border: 'none', borderRadius: '8px', padding: '6px 14px',
                            cursor: 'pointer', color: '#065f46', fontSize: '0.8rem', fontWeight: 600
                        }}>
                            <i className="fas fa-check-double" style={{ marginRight: '4px' }}></i> Select All (All Lots)
                        </button>
                    </div>

                    {Object.entries(masterGroupedByLot).map(([lot, items]) => (
                        <div key={`master-${lot}`} style={{ marginBottom: '1rem' }}>
                            <div style={{
                                background: '#ecfdf5', padding: '8px 16px', borderRadius: '10px 10px 0 0',
                                border: '1px solid #d1fae5', borderBottom: 'none',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <i className="fas fa-layer-group" style={{ color: '#059669', fontSize: '0.8rem' }}></i>
                                <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>{lot}</span>
                                <span style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>({items.length} items)</span>
                                <button onClick={() => selectAllMaster(lot)} style={{
                                    marginLeft: 'auto', background: '#d1fae5', border: 'none', borderRadius: '6px',
                                    padding: '2px 10px', cursor: 'pointer', color: '#059669', fontSize: '0.7rem', fontWeight: 600
                                }}>
                                    Select All in Lot
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '0 0 10px 10px', border: '1px solid #d1fae5', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>
                                        <tr>
                                            <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}></th>
                                            <th style={thStyle}>Lot Num</th>
                                            <th style={thStyle}>Brand</th>
                                            <th style={thStyle}>Series</th>
                                            <th style={thStyle}>Model</th>
                                            <th style={thStyle}>Spec</th>
                                            <th style={thStyle}>Condition</th>
                                            <th style={thStyle}>Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => {
                                            const checked = isSelected('master', item.id);
                                            return (
                                                <tr
                                                    key={item.id}
                                                    style={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        cursor: 'pointer',
                                                        background: checked ? '#f0fdf4' : 'transparent',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onClick={() => toggleSelect(item, 'master')}
                                                    onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = '#f8fafc'; }}
                                                    onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleSelect(item, 'master')}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={checkboxStyle}
                                                        />
                                                    </td>
                                                    <td style={{ ...tdStyle, color: '#4f46e5', fontWeight: 500, fontSize: '0.85rem' }}>{item.lot_number || '-'}</td>
                                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{item.brand || '-'}</td>
                                                    <td style={tdStyle}>{item.series || '-'}</td>
                                                    <td style={tdStyle}>{item.model || '-'}</td>
                                                    <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#64748b' }}>
                                                        {[item.processor, item.ram, item.storage].filter(Boolean).join(' / ') || '-'}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                                            background: item.condition_status === 'New' ? '#dcfce7' : '#f3f4f6',
                                                            color: item.condition_status === 'New' ? '#166534' : '#4b5563'
                                                        }}>
                                                            {item.condition_status || 'Used'}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...tdStyle, fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{item.quantity}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========== 2. PURCHASE LOTS RESULTS ========== */}
            {results && results.purchase?.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <i className="fas fa-truck-loading" style={{ color: '#f59e0b' }}></i>
                            In Purchase Lots (Incoming)
                            <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                                {results.purchase?.length} Batches
                            </span>
                        </h3>
                        <button onClick={() => selectAllPurchase()} style={{
                            background: '#fef3c7', border: 'none', borderRadius: '8px', padding: '6px 14px',
                            cursor: 'pointer', color: '#92400e', fontSize: '0.8rem', fontWeight: 600
                        }}>
                            <i className="fas fa-check-double" style={{ marginRight: '4px' }}></i> Select All (All Batches)
                        </button>
                    </div>

                    {Object.entries(purchaseGroupedByLot).map(([lot, items]) => (
                        <div key={`purchase-${lot}`} style={{ marginBottom: '1rem' }}>
                            <div style={{
                                background: '#fffbeb', padding: '8px 16px', borderRadius: '10px 10px 0 0',
                                border: '1px solid #fde68a', borderBottom: 'none',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <i className="fas fa-layer-group" style={{ color: '#d97706', fontSize: '0.8rem' }}></i>
                                <span style={{ fontWeight: 700, color: '#d97706', fontSize: '0.85rem' }}>{lot}</span>
                                <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>({items.length} items)</span>
                                {items[0]?.supplier_name && (
                                    <span style={{ fontSize: '0.75rem', color: '#92400e', marginLeft: '8px' }}>
                                        <i className="fas fa-store" style={{ marginRight: '4px' }}></i>{items[0].supplier_name}
                                    </span>
                                )}
                                <button onClick={() => selectAllPurchase(lot)} style={{
                                    marginLeft: 'auto', background: '#fef3c7', border: 'none', borderRadius: '6px',
                                    padding: '2px 10px', cursor: 'pointer', color: '#92400e', fontSize: '0.7rem', fontWeight: 600
                                }}>
                                    Select All in Batch
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '0 0 10px 10px', border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                                        <tr>
                                            <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}></th>
                                            <th style={thStyle}>Lot Num</th>
                                            <th style={thStyle}>Brand</th>
                                            <th style={thStyle}>Series</th>
                                            <th style={thStyle}>Model</th>
                                            <th style={thStyle}>Spec</th>
                                            <th style={thStyle}>Condition</th>
                                            <th style={thStyle}>Qty</th>
                                            <th style={thStyle}>QC</th>
                                            <th style={thStyle}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((group: any) => {
                                            const checked = isGroupSelected(group.specKey);
                                            return (
                                                <tr
                                                    key={group.specKey}
                                                    style={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        cursor: 'pointer',
                                                        background: checked ? '#fffbeb' : 'transparent',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onClick={() => toggleGroupSelect(group)}
                                                    onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = '#fefce8'; }}
                                                    onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleGroupSelect(group)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ ...checkboxStyle, accentColor: '#f59e0b' }}
                                                        />
                                                    </td>
                                                    <td style={{ ...tdStyle, color: '#4f46e5', fontWeight: 500, fontSize: '0.85rem' }}>{group.lot_number || '-'}</td>
                                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{group.brand || '-'}</td>
                                                    <td style={tdStyle}>{group.series || '-'}</td>
                                                    <td style={tdStyle}>{group.model || '-'}</td>
                                                    <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#64748b' }}>
                                                        {[group.processor, group.ram, group.storage].filter(Boolean).join(' / ') || '-'}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                                            background: '#f3f4f6', color: '#4b5563'
                                                        }}>
                                                            {group.condition_status || 'Bulk'}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...tdStyle, fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{group.quantity}</td>
                                                    <td style={{ ...tdStyle, fontWeight: 600, color: '#6366f1' }}>{group.ids.length}</td>
                                                    <td style={tdStyle}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                                            background: '#e0f2fe', color: '#0369a1'
                                                        }}>
                                                            {group.lot_status || 'Pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No results */}
            {query.trim() && !loading && results && totalResults === 0 && (
                <div style={{
                    padding: '3rem', textAlign: 'center', background: 'white',
                    borderRadius: '16px', border: '1px dashed #e2e8f0', marginBottom: '2rem'
                }}>
                    <i className="fas fa-search fa-2x" style={{ color: '#e2e8f0', marginBottom: '1rem' }}></i>
                    <p style={{ color: '#94a3b8', margin: 0 }}>No items found matching &ldquo;{query}&rdquo;</p>
                </div>
            )}

            {/* Sale History */}
            <div>
                <h3 style={{
                    fontSize: '1.1rem', fontWeight: 700, color: '#1e293b',
                    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <i className="fas fa-history" style={{ color: '#f59e0b' }}></i>
                    Recent Sales
                    <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        {groupedHistory.length} Records
                    </span>
                    <button onClick={fetchHistory} style={{
                        marginLeft: 'auto', background: 'none', border: '1px solid #e2e8f0',
                        borderRadius: '8px', padding: '4px 12px', cursor: 'pointer',
                        color: '#64748b', fontSize: '0.8rem', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </h3>

                {historyLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                    </div>
                ) : groupedHistory.length === 0 ? (
                    <div style={{
                        padding: '3rem', textAlign: 'center', background: 'white',
                        borderRadius: '16px', border: '1px dashed #e2e8f0'
                    }}>
                        <i className="fas fa-receipt fa-2x" style={{ color: '#e2e8f0', marginBottom: '1rem' }}></i>
                        <p style={{ color: '#94a3b8', margin: 0 }}>No sale records yet</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={thStyle}>#</th>
                                    <th style={thStyle}>Date</th>
                                    <th style={thStyle}>Invoice / Customer</th>
                                    <th style={thStyle}>Items / Models</th>
                                    <th style={thStyle}>Qty Sold</th>
                                    <th style={thStyle}>Notes</th>
                                    <th style={thStyle}>Sold By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedHistory.map((item, idx) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ ...tdStyle, color: '#94a3b8' }}>{idx + 1}</td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{new Date(item.sold_at).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(item.sold_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            {item.invoice_no ? (
                                                <div title="Invoice Number" style={{ color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className="fas fa-file-invoice" style={{ color: '#3b82f6', fontSize: '0.8rem' }}></i> {item.invoice_no}
                                                </div>
                                            ) : null}
                                            {item.customer_name ? (
                                                <div title="Customer" style={{ color: '#475569', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className="fas fa-user" style={{ color: '#94a3b8', fontSize: '0.8rem' }}></i> {item.customer_name}
                                                </div>
                                            ) : null}
                                            {!item.invoice_no && !item.customer_name && (
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Direct Sale</span>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.model}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.brand} {item.series ? `| ${item.series}` : ''} {item.lot_number ? `(${item.lot_number})` : ''}</div>
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{item.qty_sold}</td>
                                        <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.notes || '-'}
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ padding: '2px 8px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem' }}>{item.sold_by}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                title="Confirm Bulk Sale Out"
                message={`Are you sure you want to sell ${selected.size} item(s) totaling ${totalSelectedQty} pc(s)? This will deduct quantities from their respective inventories.`}
                onConfirm={handleBulkConfirmSale}
                onCancel={() => setShowConfirm(false)}
                type="danger"
                confirmText={`Yes, Confirm Sold (${totalSelectedQty} pcs)`}
            />
        </div>
    );
}
