"use client";

import React, { useState, useEffect, useCallback } from 'react';
import './ProductPricing.css';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { toast } from 'sonner';

interface PricingProduct {
    id: number;
    product_name: string;
    barcode: string | null;
    sku: string | null;
    category: string | null;
    stock_quantity: number | null;
    unit_cost: string | number | null;
    base_price: string | number | null;
    offer_price: string | number | null;
    primary_image_url: string | null;
}

export default function ProductPricing() {
    const [products, setProducts] = useState<PricingProduct[]>([]);
    const [originalProducts, setOriginalProducts] = useState<PricingProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    const fetchProducts = useCallback(async () => {
        // Prevent auto-refresh from overwriting user's active unsaved changes
        if (hasChanges) return;

        try {
            const response = await fetch('/api/admin/inventory/pricing', { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
                // Deep copy to track changes
                setOriginalProducts(JSON.parse(JSON.stringify(data)));
            }
        } catch (error) {
            console.error('Error fetching pricing data:', error);
            toast.error('Failed to load pricing data');
        } finally {
            setIsLoading(false);
        }
    }, [hasChanges]);

    useAutoRefresh(fetchProducts);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handlePriceChange = (id: number, field: 'unit_cost' | 'base_price' | 'offer_price', value: string) => {
        const numValue = value === '' ? null : Number(value);

        setProducts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: numValue };
            }
            return p;
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Find which products actually changed to send minimal payload
        const updates = products.filter((p, i) => {
            const orig = originalProducts.find(op => op.id === p.id);
            if (!orig) return false;
            return p.unit_cost !== orig.unit_cost ||
                p.base_price !== orig.base_price ||
                p.offer_price !== orig.offer_price;
        }).map(p => ({
            id: p.id,
            unit_cost: p.unit_cost,
            base_price: p.base_price,
            offer_price: p.offer_price
        }));

        if (updates.length === 0) {
            toast.info('No changes to save.');
            setIsSaving(false);
            setHasChanges(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/inventory/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            if (response.ok) {
                toast.success('Prices updated successfully!');
                setOriginalProducts(JSON.parse(JSON.stringify(products)));
                setHasChanges(false);
            } else {
                const errorData = await response.json();
                toast.error(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Failed to save pricing:', error);
            toast.error('An error occurred while saving the prices.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setProducts(JSON.parse(JSON.stringify(originalProducts)));
        setHasChanges(false);
    };

    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            (p.product_name && p.product_name.toLowerCase().includes(term)) ||
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.barcode && p.barcode.toLowerCase().includes(term))
        );
    });

    const calculateMargin = (cost: any, sell: any) => {
        const c = Number(cost) || 0;
        const s = Number(sell) || 0;
        if (s === 0) return 0;
        return (((s - c) / s) * 100).toFixed(1);
    };

    return (
        <div className="product-pricing-container">
            <div className="pricing-header">
                <div>
                    <h2><i className="fas fa-tags text-blue-500 mr-2"></i>Product Pricing</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage Cost Price, Selling Price, and Offer Price directly across all products.</p>
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
                    >
                        {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="pricing-toolbar">
                <div className="search-box-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search products by Name, SKU, or Barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="metrics-badge">
                    <span>Active Products: <strong>{filteredProducts.length}</strong></span>
                </div>
            </div>

            <div className="pricing-table-wrapper">
                {isLoading ? (
                    <LoadingSpinner fullScreen />
                ) : (
                    <table className="pricing-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>Img</th>
                                <th style={{ minWidth: '250px' }}>Product Identifier</th>
                                <th style={{ width: '100px', textAlign: 'center' }}>Stock</th>
                                <th style={{ width: '150px' }}>Unit Cost (AED)</th>
                                <th style={{ width: '150px' }}>Selling Price (AED)</th>
                                <th style={{ width: '150px' }}>Offer Price (AED)</th>
                                <th style={{ width: '120px', textAlign: 'center' }}>Margin (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((p, index) => {
                                    // Determine the effective selling price to calculate margin against (prefer offer if set and > 0)
                                    const effectiveSellPrice = (p.offer_price && Number(p.offer_price) > 0) ? p.offer_price : p.base_price;
                                    const margin = parseFloat(calculateMargin(p.unit_cost, effectiveSellPrice) as string);

                                    return (
                                        <tr key={p.id} className="pricing-row-anim" style={{ animationDelay: `${index * 0.03}s` }}>
                                            <td style={{ textAlign: 'center' }}>
                                                <img
                                                    src={p.primary_image_url || '/placeholder.svg'}
                                                    alt={p.product_name}
                                                    className="product-thumb-small"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                                />
                                            </td>
                                            <td>
                                                <div className="product-ident">
                                                    <h4>{p.product_name}</h4>
                                                    <div className="meta">
                                                        {p.sku && <span><i className="fas fa-barcode"></i> SKU: {p.sku}</span>}
                                                        {p.category && <span className="category-tag">{p.category}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`stock-badge ${Number(p.stock_quantity) > 10 ? 'good' : Number(p.stock_quantity) > 0 ? 'low' : 'out'}`}>
                                                    {p.stock_quantity || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="input-with-currency">
                                                    <span>AED</span>
                                                    <input
                                                        type="number"
                                                        value={p.unit_cost ?? ''}
                                                        onChange={(e) => handlePriceChange(p.id, 'unit_cost', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="input-with-currency selling">
                                                    <span>AED</span>
                                                    <input
                                                        type="number"
                                                        value={p.base_price ?? ''}
                                                        onChange={(e) => handlePriceChange(p.id, 'base_price', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="input-with-currency offer">
                                                    <span>AED</span>
                                                    <input
                                                        type="number"
                                                        value={p.offer_price ?? ''}
                                                        onChange={(e) => handlePriceChange(p.id, 'offer_price', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`margin-indicator ${margin > 30 ? 'high' : margin > 10 ? 'medium' : margin > 0 ? 'low' : 'negative'}`}>
                                                    {margin}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="empty-state">
                                        <i className="fas fa-search-minus fa-3x"></i>
                                        <p>No products found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
