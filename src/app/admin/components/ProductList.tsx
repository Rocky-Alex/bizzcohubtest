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
    base_price: string | number;
    offer_price: string | number;
    stock_quantity: number;
    primary_image_url: string;
}

export default function ProductList({ setActiveSection }: ProductListProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchProducts();
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

    const filteredProducts = products.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="product-list-container">
            <div className="product-header">
                <h2>Product List</h2>
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

            <div className="product-table-wrapper">
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p style={{ marginTop: '1rem' }}>Loading products...</p>
                    </div>
                ) : (
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <tr key={product.id}>
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
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
