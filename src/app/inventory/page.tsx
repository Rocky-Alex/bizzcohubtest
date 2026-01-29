"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InventoryDashboard() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products?query=' + (filter || ''));
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Inventory Management</h1>
                    <p style={{ color: '#94a3b8' }}>Manage stock, pricing, and product details.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/inventory/purchase-lots">
                        <button style={{
                            padding: '12px 24px',
                            background: '#334155', // darker/neutral
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}>
                            Upload Purchase Lot
                        </button>
                    </Link>
                    <Link href="/inventory/new">
                        <button style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(90deg, #007aff, #00b4ff)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}>
                            + Add New Product
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Search by Name or SKU..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: 'white',
                        width: '300px'
                    }}
                />
                <button
                    onClick={fetchProducts}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Search
                </button>
            </div>

            {/* Table */}
            <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#334155', textAlign: 'left' }}>
                            <th style={{ padding: '16px' }}>Product</th>
                            <th style={{ padding: '16px' }}>SKU</th>
                            <th style={{ padding: '16px' }}>Category</th>
                            <th style={{ padding: '16px' }}>Buying Price</th>
                            <th style={{ padding: '16px' }}>Selling Price</th>
                            <th style={{ padding: '16px' }}>Stock</th>
                            <th style={{ padding: '16px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    Loading inventory...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No products found.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.productId} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {product.imageUrl && (
                                            <img src={product.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                        )}
                                        {product.name}
                                    </td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>{product.sku}</td>
                                    <td style={{ padding: '16px' }}>{product.category}</td>
                                    <td style={{ padding: '16px' }}>${product.buyPrice}</td>
                                    <td style={{ padding: '16px', color: '#4ade80' }}>${product.sellPrice}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '99px',
                                            background: product.stockQuantity <= product.lowStockThreshold ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                            color: product.stockQuantity <= product.lowStockThreshold ? '#ef4444' : '#4ade80',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem'
                                        }}>
                                            {product.stockQuantity}
                                            {product.stockQuantity <= product.lowStockThreshold && ' (Low)'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <Link href={`/inventory/${product.productId}`}>
                                            <button style={{
                                                padding: '6px 12px',
                                                background: 'transparent',
                                                border: '1px solid #64748b',
                                                borderRadius: '6px',
                                                color: '#cbd5e1',
                                                cursor: 'pointer'
                                            }}>
                                                Manage
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
