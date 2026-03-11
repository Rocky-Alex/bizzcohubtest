"use client";

import React, { useState, useEffect } from "react";
import "../styles/featured-products.css";
import { toast } from "sonner";

interface Product {
    id: number;
    product_code: string;
    product_name: string;
    base_price: string | number;
    sale_price?: string | number;
    offer_price?: string | number;
    primary_image_url?: string;
    stock_quantity?: number;
}

interface FeatureSlot {
    slot_number: number;
    product_code: string | null;
    product?: Product | null;
}

export default function FeaturedProductsManage() {
    const TOTAL_SLOTS = 8;
    const [slots, setSlots] = useState<FeatureSlot[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [configRes, productsRes] = await Promise.all([
                fetch('/api/bch/featured-products'),
                fetch('/api/bch/inventory/products')
            ]);

            const configData = await configRes.json();
            const productsData = await productsRes.json();

            setAllProducts(productsData);

            // Initialize slots
            const initialSlots: FeatureSlot[] = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
                slot_number: i + 1,
                product_code: null
            }));

            // Merge with API data
            if (configData.slots) {
                configData.slots.forEach((s: any) => {
                    const idx = initialSlots.findIndex(is => is.slot_number === s.slot_number);
                    if (idx !== -1) {
                        initialSlots[idx] = {
                            slot_number: s.slot_number,
                            product_code: s.product_code,
                            product: {
                                id: s.product_id,
                                product_code: s.product_code,
                                product_name: s.product_name,
                                base_price: s.base_price,
                                offer_price: s.offer_price,
                                primary_image_url: s.primary_image_url,
                                stock_quantity: s.stock_quantity
                            }
                        };
                    }
                });
            }
            setSlots(initialSlots);
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to load featured products data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                slots: slots
                    .filter(s => s.product_code)
                    .map(s => ({
                        slot_number: s.slot_number,
                        product_code: s.product_code
                    }))
            };

            const res = await fetch('/api/bch/featured-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Featured products updated successfully!");
                // Refresh data to ensure sync
                fetchInitialData();
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSlotClick = (slotNum: number) => {
        setActiveSlot(slotNum);
        setIsModalOpen(true);
        setSearchTerm("");
    };

    const handleProductSelect = (product: Product) => {
        if (activeSlot !== null) {
            setSlots(prev => prev.map(s => {
                if (s.slot_number === activeSlot) {
                    return {
                        ...s,
                        product_code: product.product_code,
                        product: product
                    };
                }
                return s;
            }));
            setIsModalOpen(false);
            setActiveSlot(null);
        }
    };

    const handleRemoveProduct = (e: React.MouseEvent, slotNum: number) => {
        e.stopPropagation();
        if (confirm("Remove this product from the featured slot?")) {
            setSlots(prev => prev.map(s => {
                if (s.slot_number === slotNum) {
                    return { ...s, product_code: null, product: null };
                }
                return s;
            }));
        }
    };

    const filteredProducts = allProducts.filter(p =>
        (p.product_name && p.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) return <div className="p-8 text-center">Loading featured products...</div>;

    return (
        <div className="featured-container">
            <div className="featured-header">
                <h1 className="featured-title">Featured Products</h1>
                <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="slots-grid">
                {slots.map((slot) => (
                    <div
                        key={slot.slot_number}
                        className={`slot-card ${!slot.product ? 'slot-empty' : ''}`}
                        onClick={() => handleSlotClick(slot.slot_number)}
                    >
                        <div className="slot-number">{slot.slot_number}</div>

                        {slot.product ? (
                            <>
                                <div className="product-image-container">
                                    <img
                                        src={slot.product.primary_image_url || '/placeholder.png'}
                                        alt={slot.product.product_name}
                                        className="product-image"
                                    />
                                    <div className="slot-actions">
                                        <button
                                            className="action-btn btn-edit"
                                            onClick={(e) => { e.stopPropagation(); handleSlotClick(slot.slot_number); }}
                                            title="Change Product"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            className="action-btn btn-remove"
                                            onClick={(e) => handleRemoveProduct(e, slot.slot_number)}
                                            title="Remove Product"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="product-details">
                                    <div className="product-name" title={slot.product.product_name}>
                                        {slot.product.product_name}
                                    </div>
                                    <div className="product-price">
                                        {slot.product.offer_price ? (
                                            <>
                                                <span className="offer-price">${Number(slot.product.offer_price).toLocaleString()}</span>
                                                <span className="original-price">${Number(slot.product.base_price).toLocaleString()}</span>
                                            </>
                                        ) : (
                                            <span>${Number(slot.product.base_price).toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="add-icon-wrapper">
                                    <i className="fas fa-plus fa-2x"></i>
                                </div>
                                <span style={{ color: '#9ca3af', fontWeight: 500 }}>Add Product</span>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Product Selection Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>Select Product for Slot {activeSlot}</h3>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="search-container">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search by name or code..."
                                className="search-input"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="product-list">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(p => (
                                    <div
                                        key={p.id}
                                        className="product-item"
                                        onClick={() => handleProductSelect(p)}
                                    >
                                        <img
                                            src={p.primary_image_url || '/placeholder.png'}
                                            alt={p.product_name}
                                            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#f3f4f6' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>{p.product_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {p.product_code} • ${Number(p.offer_price || p.base_price).toLocaleString()}
                                                {p.stock_quantity !== undefined && ` • Stock: ${p.stock_quantity}`}
                                            </div>
                                        </div>
                                        <i className="fas fa-chevron-right" style={{ color: '#d1d5db' }}></i>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                    No products found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
