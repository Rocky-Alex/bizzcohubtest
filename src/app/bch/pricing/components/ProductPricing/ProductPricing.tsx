"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ProductPricing.css';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { toast } from 'sonner';

interface PricingProduct {
    id: number;
    source: 'master_inventory' | 'inventory_qc' | 'purchase';
    product_name: string;
    barcode: string | null;
    sku: string | null;
    category: string | null;
    brand: string | null;
    series: string | null;
    model: string | null;
    lot_number: string | null;
    stock_quantity: number | null;
    unit_cost: string | number | null;
    base_price: string | number | null;
    offer_price: string | number | null;
    primary_image_url: string | null;
}

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
    master_inventory: { label: 'Inventory', className: 'source-master' },
    inventory_qc: { label: 'QC Stock', className: 'source-qc' },
    purchase: { label: 'Purchase', className: 'source-purchase' },
};

export default function ProductPricing() {
    const [products, setProducts] = useState<PricingProduct[]>([]);
    const [originalProducts, setOriginalProducts] = useState<PricingProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Server-side search: re-fetches whenever searchTerm changes (debounced 400ms)
    const fetchProducts = useCallback(async (search = searchTerm) => {
        if (hasChanges) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            const response = await fetch(`/api/bch/inventory/pricing?${params.toString()}`, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
                setOriginalProducts(JSON.parse(JSON.stringify(data)));
            }
        } catch (error) {
            console.error('Error fetching pricing data:', error);
            toast.error('Failed to load pricing data');
        } finally {
            setIsLoading(false);
        }
    }, [hasChanges, searchTerm]);

    // Auto-refresh (re-uses current search term, respects unsaved changes)
    useAutoRefresh(fetchProducts);

    // Initial load with empty search (shows master_inventory products)
    useEffect(() => {
        fetchProducts('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced server request when user types
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchProducts(value);
        }, 400);
    };

    const handlePriceChange = (id: number, source: string, field: 'unit_cost' | 'base_price' | 'offer_price', value: string) => {
        const numValue = value === '' ? null : Number(value);
        setProducts(prev => prev.map(p => p.id === id && p.source === source ? { ...p, [field]: numValue } : p));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const updates = products
            .filter(p => {
                const orig = originalProducts.find(op => op.id === p.id && op.source === p.source);
                if (!orig) return false;
                return p.unit_cost !== orig.unit_cost || p.base_price !== orig.base_price || p.offer_price !== orig.offer_price;
            })
            .map(p => ({ id: p.id, source: p.source, unit_cost: p.unit_cost, base_price: p.base_price, offer_price: p.offer_price }));

        if (updates.length === 0) {
            toast.info('No changes to save.');
            setIsSaving(false);
            setHasChanges(false);
            return;
        }

        try {
            const response = await fetch('/api/bch/inventory/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            if (response.ok) {
                toast.success(`${updates.length} product(s) updated successfully!`);
                setOriginalProducts(JSON.parse(JSON.stringify(products)));
                setHasChanges(false);
            } else {
                const err = await response.json();
                toast.error(`Error: ${err.error}`);
            }
        } catch {
            toast.error('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setProducts(JSON.parse(JSON.stringify(originalProducts)));
        setHasChanges(false);
    };

    const calculateMargin = (cost: any, sell: any) => {
        const c = Number(cost) || 0;
        const s = Number(sell) || 0;
        if (s === 0) return '0.0';
        return (((s - c) / s) * 100).toFixed(1);
    };

    return (
        <div className="product-pricing-container">
            <div className="pricing-header">
                <div>
                    <h2><i className="fas fa-tags" style={{ color: '#3b82f6', marginRight: '0.5rem' }}></i>Product Pricing</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Search across Purchase, QC Stock &amp; Inventory. Set prices on Inventory items.
                    </p>
                </div>
                <div className="header-actions">
                    {hasChanges && (
                        <button className="btn-secondary" onClick={handleDiscard} disabled={isSaving}>
                            <i className="fas fa-undo"></i> Discard
                        </button>
                    )}
                    <button
                        className={`btn-primary ${hasChanges ? 'pulsing-save' : ''}`}
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        style={{ position: 'relative', overflow: 'hidden' }}
                    >
                        {isSaving ? <LoadingSpinner size={18} text="" /> : <i className="fas fa-save"></i>}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="pricing-toolbar">
                <div className="search-box-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search by Lot No, Brand, Series, Model, Barcode, SKU, or Product Name..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                    {isLoading && <LoadingSpinner size={20} text="" />}
                </div>
                <div className="source-legend">
                    <span className="source-badge source-master">Inventory</span>
                    <span className="source-badge source-qc">QC Stock</span>
                    <span className="source-badge source-purchase">Purchase</span>
                </div>
                <div className="metrics-badge">
                    Results: <strong>{products.length}</strong>
                </div>
            </div>

            <div className="pricing-table-wrapper">
                <table className="pricing-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>Img</th>
                            <th style={{ width: '120px' }}>Lot No.</th>
                            <th style={{ minWidth: '220px' }}>Product</th>
                            <th style={{ width: '110px', textAlign: 'center' }}>Source</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Stock</th>
                            <th style={{ width: '155px' }}>Unit Cost (AED)</th>
                            <th style={{ width: '155px' }}>Selling Price (AED)</th>
                            <th style={{ width: '155px' }}>Offer Price (AED)</th>
                            <th style={{ width: '110px', textAlign: 'center' }}>Margin (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? (
                            products.map((p, index) => {
                                const effectiveSell = (p.offer_price && Number(p.offer_price) > 0) ? p.offer_price : p.base_price;
                                const margin = parseFloat(calculateMargin(p.unit_cost, effectiveSell));
                                // All rows are fully editable — prices save to products_price table
                                const src = SOURCE_LABELS[p.source] || { label: p.source, className: '' };

                                return (
                                    <tr key={`${p.source}-${p.id}`} className="pricing-row-anim" style={{ animationDelay: `${index * 0.02}s` }}>
                                        <td style={{ textAlign: 'center' }}>
                                            <img
                                                src={p.primary_image_url || '/placeholder.svg'}
                                                alt={p.product_name}
                                                className="product-thumb-small"
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                            />
                                        </td>
                                        {/* Lot No. — dedicated column BEFORE Product */}
                                        <td>
                                            {p.lot_number ? (
                                                <span className="lot-number-badge">{p.lot_number}</span>
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="product-ident">
                                                <h4>{p.product_name}</h4>
                                                <div className="meta">
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`source-badge ${src.className}`}>{src.label}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`stock-badge ${Number(p.stock_quantity) > 10 ? 'good' : Number(p.stock_quantity) > 0 ? 'low' : 'out'}`}>
                                                {p.stock_quantity ?? '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="input-with-currency">
                                                <span>AED</span>
                                                <input
                                                    type="number"
                                                    value={p.unit_cost ?? ''}
                                                    onChange={(e) => handlePriceChange(p.id, p.source, 'unit_cost', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0" step="0.01"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="input-with-currency selling">
                                                <span>AED</span>
                                                <input
                                                    type="number"
                                                    value={p.base_price ?? ''}
                                                    onChange={(e) => handlePriceChange(p.id, p.source, 'base_price', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0" step="0.01"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="input-with-currency offer">
                                                <span>AED</span>
                                                <input
                                                    type="number"
                                                    value={p.offer_price ?? ''}
                                                    onChange={(e) => handlePriceChange(p.id, p.source, 'offer_price', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0" step="0.01"
                                                />
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {margin !== 0 ? (
                                                <span className={`margin-indicator ${margin > 30 ? 'high' : margin > 10 ? 'medium' : margin > 0 ? 'low' : 'negative'}`}>
                                                    {margin}%
                                                </span>
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : isLoading ? (
                            <tr>
                                <td colSpan={9} style={{ padding: '4rem 2rem' }}>
                                    <LoadingSpinner text="Searching products..." />
                                </td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan={9} className="empty-state">
                                    <i className="fas fa-search-minus fa-3x"></i>
                                    <p>{searchTerm ? `No products found for "${searchTerm}"` : 'Type a product name, brand, or model to search across all databases.'}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
