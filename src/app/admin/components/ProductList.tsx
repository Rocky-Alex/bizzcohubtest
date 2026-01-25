import React, { useState, useEffect } from 'react';
import './ProductList.css';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from './ConfirmModal';

interface ProductListProps {
    setActiveSection: (section: string) => void;
    onEdit?: (product: Product) => void;
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

export default function ProductList({ setActiveSection, onEdit }: ProductListProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'mini' | 'detailed'>('mini');


    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/inventory/products', { cache: 'no-store' });
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

    useEffect(() => {
        fetchProducts();
    }, []);

    // Auto Refresh Logic
    useAutoRefresh(fetchProducts);


    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    const handleDelete = (productId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/admin/inventory/products?id=${productId}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        setProducts(prev => prev.filter(p => p.id !== productId));
                        window.dispatchEvent(new Event('inventory-updated'));
                        localStorage.setItem('inventoryLastUpdated', Date.now().toString());
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    } else {
                        const error = await response.json();
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: `Failed to delete product: ${error.error || 'Unknown error'}`,
                            type: 'danger',
                            singleButton: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Error deleting product:', error);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'An error occurred while deleting the product.',
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
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
                <div>
                    <h2>Product List</h2>
                </div>
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
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => setActiveSection('products-add')}>
                        <i className="fas fa-plus"></i> Add Product
                    </button>
                </div>
            </div>

            <div className="product-toolbar">
                <div className="search-box-wrapper" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '10px', minWidth: '320px', border: '1px solid #e2e8f0' }}>
                    <i className="fas fa-search" style={{ color: '#94a3b8', marginRight: '0.75rem' }}></i>
                    <input
                        type="text"
                        placeholder="Search products by name, code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#334155' }}
                    />
                </div>
                <button className="btn btn-secondary" onClick={fetchProducts} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            <div className="product-table-wrapper" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                {isLoading ? (
                    <LoadingSpinner fullScreen />
                ) : (
                    <table className="product-table" style={viewMode === 'detailed' ? { minWidth: '2200px' } : {}}>
                        <thead>
                            {viewMode === 'mini' ? (
                                <tr>
                                    <th style={{ width: '300px' }}>Product</th>
                                    <th>Category</th>
                                    <th>Pricing</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            ) : (
                                <tr>
                                    {/* 1-5 */}
                                    <th style={{ width: '70px', textAlign: 'center' }}>Img</th>
                                    <th style={{ minWidth: '200px' }}>Product Name</th>
                                    <th>SKU</th>
                                    <th>Brand</th>
                                    <th>Category</th>

                                    {/* 6-9 */}
                                    <th style={{ minWidth: '150px' }}>Pricing</th>
                                    <th>Stock</th>

                                    {/* 10-11 */}
                                    <th>Badge</th>
                                    <th>Condition</th>

                                    {/* 12-14 (Core) */}
                                    <th>Processor</th>
                                    <th>RAM</th>
                                    <th>Storage</th>

                                    {/* 15-18 (Display/Gfx) */}
                                    <th>Graphics</th>
                                    <th>VRAM</th>
                                    <th>Screen</th>
                                    <th>Colors</th>

                                    {/* 19-21 (RAM Variants) */}
                                    <th>RAM Var.</th>
                                    <th>RAM Price</th>

                                    {/* 22-24 (Storage Variants) */}
                                    <th>Sto. Var.</th>
                                    <th>Sto. Price</th>

                                    {/* 25 */}
                                    <th style={{ minWidth: '200px' }}>Features</th>
                                    <th style={{ position: 'sticky', right: 0, background: '#f8fafc', zIndex: 10, textAlign: 'center', borderLeft: '1px solid #e2e8f0', boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.05)' }}>Actions</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product, index) => (
                                    <tr key={product.id} className="product-row-anim" style={{ animationDelay: `${index * 0.05}s` }}>
                                        {viewMode === 'mini' ? (
                                            <>
                                                <td>
                                                    <div className="product-info">
                                                        <img
                                                            src={product.primary_image_url || '/placeholder.svg'}
                                                            alt={product.product_name}
                                                            className="product-thumb"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                                        />
                                                        <div className="product-name">
                                                            <h4>{product.product_name}</h4>
                                                            <span>{product.product_code}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span style={{ fontWeight: 500, color: '#475569' }}>{product.category}</span></td>
                                                <td>
                                                    <div className="price-cell">
                                                        <span className="price-current">AED {Number(product.offer_price || product.base_price).toLocaleString()}</span>
                                                        {product.offer_price && Number(product.offer_price) < Number(product.base_price) && (
                                                            <span className="price-original">AED {Number(product.base_price).toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td><span style={{ fontWeight: 600, color: '#334155' }}>{product.stock_quantity}</span></td>
                                                <td>{getStockStatus(product.stock_quantity)}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button className="action-btn" title="Edit" onClick={() => onEdit && onEdit(product)}>
                                                            <i className="fas fa-pencil-alt"></i>
                                                        </button>
                                                        <button className="action-btn delete" title="Delete" onClick={() => handleDelete(product.id)}>
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* 1. Image */}
                                                <td style={{ textAlign: 'center' }}>
                                                    <img
                                                        src={product.primary_image_url || '/placeholder.svg'}
                                                        alt="Img"
                                                        className="product-thumb"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                                    />
                                                </td>
                                                {/* 2. Name */}
                                                <td>
                                                    <div className="product-name">
                                                        <h4>{product.product_name}</h4>
                                                    </div>
                                                </td>
                                                {/* 3. SKU */}
                                                <td><span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem' }}>{product.product_code}</span></td>
                                                {/* 4. Brand */}
                                                <td><span style={{ fontWeight: 500 }}>{product.brand}</span></td>
                                                {/* 5. Category */}
                                                <td>{product.category}</td>

                                                {/* 6. Pricing Merged */}
                                                <td>
                                                    <div className="price-cell">
                                                        <span className="price-current">AED {Number(product.offer_price || product.base_price).toLocaleString()}</span>
                                                        {product.offer_price && Number(product.offer_price) < Number(product.base_price) && (
                                                            <>
                                                                <span className="price-original">AED {Number(product.base_price).toLocaleString()}</span>
                                                                <span className="discount-tag">-{product.discount_percent}%</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* 9. Stock */}
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontWeight: 600 }}>{product.stock_quantity}</span>
                                                        {getStockStatus(product.stock_quantity)}
                                                    </div>
                                                </td>

                                                {/* 10. Badge */}
                                                <td>
                                                    {product.badge ? (
                                                        <span className={`feature-badge ${product.badge.toLowerCase().replace(' ', '-') === 'best-seller' ? 'best-seller' : 'standard'}`}>
                                                            {product.badge}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#cbd5e1' }}>-</span>
                                                    )}
                                                </td>
                                                {/* 11. Condition */}
                                                <td>
                                                    {product.condition_status === 'New' ? (
                                                        <span className="feature-badge new">New</span>
                                                    ) : (
                                                        <span className="feature-badge standard">{product.condition_status}</span>
                                                    )}
                                                </td>

                                                {/* 12-18 Specs */}
                                                <td style={{ color: '#475569' }}>{product.processor || '-'}</td>
                                                <td style={{ color: '#475569' }}>{product.ram || '-'}</td>
                                                <td style={{ color: '#475569' }}>{product.storage || '-'}</td>
                                                <td style={{ color: '#475569' }}>{product.graphics_card || '-'}</td>
                                                <td style={{ color: '#475569' }}>{product.graphics_storage || '-'}</td>
                                                <td style={{ color: '#475569' }}>{product.screen_size || '-'}</td>
                                                <td style={{ color: '#475569' }}>{product.colors || '-'}</td>

                                                {/* 19-21 RAM Variants */}
                                                <td>{formatVariantList(product.ram_variants || [], 'size', 'type')}</td>
                                                <td>{formatVariantList(product.ram_variants || [], 'price', undefined, 'AED ')}</td>

                                                {/* 22-24 Storage Variants */}
                                                <td>{formatVariantList(product.storage_variants || [], 'size', 'type')}</td>
                                                <td>{formatVariantList(product.storage_variants || [], 'price', undefined, 'AED ')}</td>

                                                {/* 25 Key Features */}
                                                <td>
                                                    <div style={{ height: '40px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={product.features}>
                                                        {product.features || '-'}
                                                    </div>
                                                </td>

                                                <td style={{ position: 'sticky', right: 0, background: 'white', borderLeft: '1px solid #f1f5f9', zIndex: 5, boxShadow: '-5px 0 10px -5px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button className="action-btn" title="Edit" onClick={() => onEdit && onEdit(product)}>
                                                            <i className="fas fa-pencil-alt"></i>
                                                        </button>
                                                        <button className="action-btn delete" title="Delete" onClick={() => handleDelete(product.id)}>
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
                                    <td colSpan={viewMode === 'mini' ? 6 : 25} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <i className="fas fa-box-open fa-3x" style={{ color: '#e2e8f0' }}></i>
                                            <p>No products found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}
