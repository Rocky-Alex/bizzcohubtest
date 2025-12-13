import React, { useState, useEffect } from 'react';
import './ProductList.css';

interface ProductListProps {
    setActiveSection: (section: string) => void;
}

interface Product {
    id: string;
    product_name: string;
    product_code: string;
    category: string;
    brand: string;
    base_price: string | number;
    offer_price: string | number;
    discount_percent: number;
    stock_quantity: number;
    primary_image_url: string;
    condition_status: string;
    badge: string;
    processor?: string;
    ram?: string;
    storage?: string;
    graphics_card?: string;
    graphics_storage?: string;
    screen_size?: string;
    colors?: string;
    features?: string;
    ram_variants?: any[]; // JSON array
    storage_variants?: any[]; // JSON array
}

export default function ProductList({ setActiveSection }: ProductListProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'mini' | 'detailed'>('mini');


    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 600000); // Refresh every 10 minutes
        return () => clearInterval(interval);
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/inventory/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            } else {
                console.error('Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStockStatus = (qty: number) => {
        if (qty <= 0) return <span className="status-badge out-of-stock">Out of Stock</span>;
        if (qty < 10) return <span className="status-badge low-stock">Low Stock</span>;
        return <span className="status-badge in-stock">In Stock</span>;
    };

    const filteredProducts = products.filter(p => {
        return p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const formatVariantList = (list: any[], key1: string, key2?: string, prefix: string = '') => {
        if (!list || !Array.isArray(list) || list.length === 0) return '-';
        return list.map((item, idx) => (
            <div key={idx} style={{ borderBottom: idx < list.length - 1 ? '1px solid #eee' : 'none', padding: '2px 0' }}>
                {prefix}
                {item[key1] || '-'}
                {key2 ? ` ${item[key2] || ''}` : ''}
            </div>
        ));
    };

    return (
        <div className="product-list-container">
            <div className="product-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h2>Product List</h2>
                    <div className="list-type-toggle">
                        <button
                            className={`list-toggle-btn ${viewMode === 'mini' ? 'active' : ''}`}
                            onClick={() => setViewMode('mini')}
                        >
                            Mini View
                        </button>
                        <button
                            className={`list-toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
                            onClick={() => setViewMode('detailed')}
                        >
                            Detailed View
                        </button>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => setActiveSection('products-add')}>
                        <i className="fas fa-plus"></i> Add Product
                    </button>
                </div>
            </div>

            <div className="product-toolbar">
                <div className="search-box-wrapper" style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '8px', minWidth: '300px' }}>
                    <i className="fas fa-search" style={{ color: '#9ca3af', marginRight: '0.5rem' }}></i>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                    />
                </div>
                <button className="btn btn-secondary" onClick={fetchProducts}>
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            <div className="product-table-wrapper" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p style={{ marginTop: '1rem' }}>Loading products...</p>
                    </div>
                ) : (
                    <table className="product-table" style={viewMode === 'detailed' ? { minWidth: '2500px' } : {}}>
                        <thead>
                            {viewMode === 'mini' ? (
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            ) : (
                                <tr>
                                    {/* 1-5 */}
                                    <th style={{ width: '80px' }}>Image</th>
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Brand</th>
                                    <th>Category</th>

                                    {/* 6-9 */}
                                    {/* 6-9 */}
                                    <th>Pricing</th>
                                    <th>Stock</th>

                                    {/* 10-11 */}
                                    <th>Badge</th>
                                    <th>Condition</th>

                                    {/* 12-14 (Core) */}
                                    <th>Processor</th>
                                    <th>RAM (Incl)</th>
                                    <th>Storage (Incl)</th>

                                    {/* 15-18 (Display/Gfx) */}
                                    <th>Graphics</th>
                                    <th>VRAM</th>
                                    <th>Screen</th>
                                    <th>Colors</th>

                                    {/* 19-21 (RAM Variants) */}
                                    <th>RAM Var. (Size & Type)</th>
                                    <th>RAM Var. Price</th>

                                    {/* 22-24 (Storage Variants) */}
                                    <th>Sto. Var. (Size & Type)</th>
                                    <th>Sto. Var. Price</th>

                                    {/* 25 */}
                                    <th style={{ minWidth: '200px' }}>Key Features</th>
                                    <th style={{ position: 'sticky', right: 0, background: '#f9fafb', zIndex: 10 }}>Actions</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        {viewMode === 'mini' ? (
                                            <>
                                                <td>
                                                    <div className="product-info">
                                                        <img
                                                            src={product.primary_image_url || '/placeholder.png'}
                                                            alt={product.product_name}
                                                            className="product-thumb"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'; }}
                                                        />
                                                        <div className="product-name">
                                                            <h4>{product.product_name}</h4>
                                                            <span>{product.product_code}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{product.category}</td>
                                                <td>AED {product.offer_price || product.base_price}</td>
                                                <td>{product.stock_quantity}</td>
                                                <td>{getStockStatus(product.stock_quantity)}</td>
                                                <td>
                                                    <button className="action-btn" title="Edit">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="action-btn" style={{ color: '#ef4444' }} title="Delete">
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* 1. Image */}
                                                <td>
                                                    <img
                                                        src={product.primary_image_url || '/placeholder.png'}
                                                        alt="Img"
                                                        className="product-thumb"
                                                        style={{ width: '50px', height: '50px' }}
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'; }}
                                                    />
                                                </td>
                                                {/* 2. Name */}
                                                <td><span style={{ fontWeight: 600 }}>{product.product_name}</span></td>
                                                {/* 3. SKU */}
                                                <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>{product.product_code}</td>
                                                {/* 4. Brand */}
                                                <td>{product.brand}</td>
                                                {/* 5. Category */}
                                                <td>{product.category}</td>

                                                {/* 6. Pricing Merged */}
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '2px' }}>
                                                        <div>Base Price: {product.base_price} AED</div>
                                                        <div style={{ color: '#16a34a', fontWeight: 600 }}>offer price : {product.offer_price} AED</div>
                                                        <div style={{ color: '#ef4444', fontWeight: 600 }}>discount :{product.discount_percent}%</div>
                                                    </div>
                                                </td>
                                                {/* 9. Stock */}
                                                <td>{product.stock_quantity}</td>

                                                {/* 10. Badge */}
                                                <td>{product.badge || '-'}</td>
                                                {/* 11. Condition */}
                                                <td>{product.condition_status}</td>

                                                {/* 12. Processor */}
                                                <td>{product.processor || '-'}</td>
                                                {/* 13. RAM */}
                                                <td>{product.ram || '-'}</td>
                                                {/* 14. Storage */}
                                                <td>{product.storage || '-'}</td>

                                                {/* 15. Graphics */}
                                                <td>{product.graphics_card || '-'}</td>
                                                {/* 16. VRAM */}
                                                <td>{product.graphics_storage || '-'}</td>
                                                {/* 17. Screen */}
                                                <td>{product.screen_size || '-'}</td>
                                                {/* 18. Colors */}
                                                <td>{product.colors || '-'}</td>

                                                {/* 19-21 RAM Variants */}
                                                <td>{formatVariantList(product.ram_variants || [], 'size', 'type')}</td>
                                                <td>{formatVariantList(product.ram_variants || [], 'price', undefined, 'AED ')}</td>

                                                {/* 22-24 Storage Variants */}
                                                <td>{formatVariantList(product.storage_variants || [], 'size', 'type')}</td>
                                                <td>{formatVariantList(product.storage_variants || [], 'price', undefined, 'AED ')}</td>

                                                {/* 25 Key Features */}
                                                <td>
                                                    <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                                                        {product.features ? product.features.substring(0, 100) + (product.features.length > 100 ? '...' : '') : '-'}
                                                    </div>
                                                </td>

                                                <td style={{ position: 'sticky', right: 0, background: 'white', borderLeft: '1px solid #e5e7eb' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="action-btn" title="Edit">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="action-btn" style={{ color: '#ef4444' }} title="Delete">
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={viewMode === 'mini' ? 6 : 21} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No products found.
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
