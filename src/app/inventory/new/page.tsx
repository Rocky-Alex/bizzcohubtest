"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImageUploader from '@/components/ui/ProductImageUploader';

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: 'Laptops',
        description: '',
        buyPrice: '',
        sellPrice: '',
        stockQuantity: '0',
        lowStockThreshold: '5',
        imageUrl: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageSelected = async (file: File) => {
        // Upload logic here using existing API or new logic
        // For now, let's assume we have an upload endpoint or simulation
        const data = new FormData();
        data.append('file', file);
        data.append('folder', 'Products');

        try {
            // Using existing imagekit endpoint seen in login page
            const res = await fetch('/api/imagekit/upload', {
                method: 'POST',
                body: data
            });
            if (res.ok) {
                const json = await res.json();
                setFormData(prev => ({ ...prev, imageUrl: json.url }));
            } else {
                alert('Image upload failed');
            }
        } catch (e) {
            console.error(e);
            alert('Image upload error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                buyPrice: parseFloat(formData.buyPrice),
                sellPrice: parseFloat(formData.sellPrice),
                stockQuantity: parseInt(formData.stockQuantity),
                lowStockThreshold: parseInt(formData.lowStockThreshold),
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/inventory');
            } else {
                const json = await res.json();
                alert(json.error || 'Failed to create product');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link href="/inventory" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                    <i className="fas fa-arrow-left"></i> Back to Inventory
                </Link>

                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '30px' }}>Add New Product</h1>

                <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Image Upload */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Product Image</label>
                            {formData.imageUrl ? (
                                <div style={{ position: 'relative', width: '200px', height: '150px' }}>
                                    <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                        style={{ position: 'absolute', top: -10, right: -10, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>
                                        x
                                    </button>
                                </div>
                            ) : (
                                <ProductImageUploader onImageSelected={handleImageSelected} />
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Product Name</label>
                                <input
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>SKU</label>
                                <input
                                    name="sku"
                                    required
                                    value={formData.sku}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                            >
                                <option value="Laptops">Laptops</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Desktops">Desktops</option>
                                <option value="Components">Components</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Description</label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Buying Price ($)</label>
                                <input
                                    name="buyPrice"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.buyPrice}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Selling Price ($)</label>
                                <input
                                    name="sellPrice"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.sellPrice}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Initial Stock</label>
                                <input
                                    name="stockQuantity"
                                    type="number"
                                    value={formData.stockQuantity}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Low Stock Alert Threshold</label>
                                <input
                                    name="lowStockThreshold"
                                    type="number"
                                    value={formData.lowStockThreshold}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '10px 0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                    name="isFeatured"
                                    type="checkbox"
                                    checked={(formData as any).isFeatured || false}
                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked } as any)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>Feature this product on Storefront</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                marginTop: '20px',
                                padding: '14px',
                                background: 'linear-gradient(90deg, #007aff, #00b4ff)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Creating...' : 'Create Product'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
