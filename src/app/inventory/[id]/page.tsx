"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImageUploader from '@/components/ui/ProductImageUploader';

export default function EditProductPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;

    const [activeTab, setActiveTab] = useState('details');
    const [isLoading, setIsLoading] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [serials, setSerials] = useState<any[]>([]);
    const [newSerials, setNewSerials] = useState('');

    useEffect(() => {
        fetchProduct();
        fetchSerials();
    }, []);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data);
            } else {
                alert('Failed to load product');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSerials = async () => {
        try {
            const res = await fetch(`/api/products/${id}/serials`);
            if (res.ok) {
                const data = await res.json();
                setSerials(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...product,
                    buyPrice: parseFloat(product.buyPrice),
                    sellPrice: parseFloat(product.sellPrice),
                    stockQuantity: parseInt(product.stockQuantity),
                    lowStockThreshold: parseInt(product.lowStockThreshold),
                })
            });
            if (res.ok) {
                alert('Product updated successfully');
                router.refresh();
            } else {
                alert('Failed to update');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSerials = async () => {
        if (!newSerials.trim()) return;

        // Split by comma or newline
        const serialList = newSerials.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        if (serialList.length === 0) return;

        try {
            const res = await fetch(`/api/products/${id}/serials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serials: serialList })
            });

            if (res.ok) {
                setNewSerials('');
                fetchSerials();
                alert(`${serialList.length} Serials added.`);
            } else {
                const json = await res.json();
                alert(json.error || 'Failed to add serials');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding serials');
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                router.push('/inventory');
            } else {
                const json = await res.json();
                alert(json.error || "Failed to delete");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting product");
        }
    }

    if (!product) return <div style={{ padding: '40px', color: 'white' }}>Loading...</div>;

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Link href="/inventory" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                    <i className="fas fa-arrow-left"></i> Back to Inventory
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Edit Product: {product.name}</h1>
                    <button
                        onClick={handleDelete}
                        style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                        Delete Product
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #334155', marginBottom: '30px' }}>
                    <button
                        onClick={() => setActiveTab('details')}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'details' ? '2px solid #007aff' : 'none',
                            color: activeTab === 'details' ? '#007aff' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}>
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('serials')}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'serials' ? '2px solid #007aff' : 'none',
                            color: activeTab === 'serials' ? '#007aff' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}>
                        Serials & Stock
                    </button>
                </div>

                {activeTab === 'details' ? (
                    <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px' }}>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Reusing similar form layout */}
                            <div style={{ display: 'flex', gap: '20px' }}>
                                {product.imageUrl && (
                                    <img src={product.imageUrl} alt="" style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    {/* Image Uploader could be here as separate component */}
                                    {/* Simplified for edit: Just URL input for now or re-add uploader */}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Product Name</label>
                                    <input name="name" required value={product.name} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>SKU</label>
                                    <input name="sku" required value={product.sku} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Category</label>
                                <select name="category" value={product.category} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}>
                                    <option value="Laptops">Laptops</option>
                                    <option value="Accessories">Accessories</option>
                                    <option value="Desktops">Desktops</option>
                                    <option value="Components">Components</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Description</label>
                                <textarea name="description" rows={4} value={product.description || ''} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Buying Price ($)</label>
                                    <input name="buyPrice" type="number" step="0.01" required value={product.buyPrice} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Selling Price ($)</label>
                                    <input name="sellPrice" type="number" step="0.01" required value={product.sellPrice} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Stock Quantity (Manual Override)</label>
                                    <input name="stockQuantity" type="number" required value={product.stockQuantity} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Low Stock Threshold</label>
                                    <input name="lowStockThreshold" type="number" required value={product.lowStockThreshold} onChange={handleChange} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div style={{ padding: '10px 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', cursor: 'pointer' }}>
                                    <input
                                        name="isFeatured"
                                        type="checkbox"
                                        checked={product.isFeatured || false}
                                        onChange={(e) => setProduct({ ...product, isFeatured: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span>Feature this product on Storefront</span>
                                </label>
                            </div>

                            <button type="submit" disabled={isLoading} style={{ marginTop: '20px', padding: '14px', background: 'linear-gradient(90deg, #007aff, #00b4ff)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px' }}>
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ marginBottom: '15px' }}>Add Serial Numbers</h3>
                            <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Enter serial numbers separated by commas or new lines.</p>
                            <textarea
                                value={newSerials}
                                onChange={(e) => setNewSerials(e.target.value)}
                                rows={4}
                                placeholder="SN-12345, SN-67890..."
                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '10px' }}
                            />
                            <button
                                onClick={handleAddSerials}
                                style={{ padding: '10px 20px', background: '#007aff', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
                                Add Serials
                            </button>
                        </div>

                        <h3>Existing Serials ({serials.length})</h3>
                        <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#334155', textAlign: 'left' }}>
                                        <th style={{ padding: '12px' }}>Serial Number</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Date Added</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {serials.map(s => (
                                        <tr key={s.serialId} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '12px', fontFamily: 'monospace' }}>{s.serialNumber}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                                    background: s.status === 'Available' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: s.status === 'Available' ? '#4ade80' : '#ef4444'
                                                }}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                                {new Date(s.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {serials.length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No serials found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
