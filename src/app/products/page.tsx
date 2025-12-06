"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
    id: string;
    productCode: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    type: 'laptop' | 'accessory';
    images: string[];
    createdAt: string;
    stock: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');

    // Available filter options
    const [brands, setBrands] = useState<string[]>([]);

    // Filter visibility state
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [products, selectedType, selectedBrand, priceRange, sortBy]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const [laptopsRes, accessoriesRes] = await Promise.all([
                fetch('/api/products?type=laptop'),
                fetch('/api/products?type=accessory')
            ]);

            const laptopsData = await laptopsRes.json();
            const accessoriesData = await accessoriesRes.json();

            const allProducts = [
                ...(laptopsData.products || []),
                ...(accessoriesData.products || [])
            ].filter((p: Product) => p.id && p.type); // Filter out invalid products

            setProducts(allProducts);

            // Extract unique brands using Array.from() instead of spread operator
            const uniqueBrands = Array.from(new Set(allProducts.map((p: Product) => p.brand))).filter(Boolean);
            setBrands(uniqueBrands as string[]);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...products];

        // Filter by type
        if (selectedType !== 'all') {
            filtered = filtered.filter(p => p.type === selectedType);
        }

        // Filter by brand
        if (selectedBrand !== 'all') {
            filtered = filtered.filter(p => p.brand === selectedBrand);
        }

        // Filter by price range
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            if (max) {
                filtered = filtered.filter(p => p.price >= min && p.price <= max);
            } else {
                filtered = filtered.filter(p => p.price >= min);
            }
        }

        // Sort products
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        setFilteredProducts(filtered);
    };

    const resetFilters = () => {
        setSelectedType('all');
        setSelectedBrand('all');
        setPriceRange('all');
        setSortBy('newest');
    };

    const stats = {
        total: products.length,
        laptops: products.filter(p => p.type === 'laptop').length,
        accessories: products.filter(p => p.type === 'accessory').length,
        filtered: filteredProducts.length
    };

    return (
        <>
            {/* Hero Section */}
            <section
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(/uploads/lapproduct.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    minHeight: '25vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                    <h1 style={{
                        fontSize: '4rem',
                        color: 'white',
                        margin: 0,
                        fontFamily: 'Bebas Neue, sans-serif',
                        letterSpacing: '3px'
                    }}>
                        <i className="fas fa-shopping-bag" style={{ marginRight: '1rem' }}></i>
                        OUR PRODUCTS
                    </h1>
                </div>
            </section>

            {/* Filters and Products Section */}
            <section style={{
                padding: '60px 20px',
                background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                minHeight: '60vh'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Toggle Filter Button */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                padding: '15px 30px',
                                background: showFilters ? '#007bff' : 'white',
                                color: showFilters ? 'white' : '#007bff',
                                border: '2px solid #007bff',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0, 123, 255, 0.2)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                            onMouseOver={(e) => {
                                if (!showFilters) {
                                    e.currentTarget.style.background = '#007bff';
                                    e.currentTarget.style.color = 'white';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!showFilters) {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.color = '#007bff';
                                }
                            }}
                        >
                            <i className={`fas fa-${showFilters ? 'times' : 'filter'}`}></i>
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {/* Filter Bar - Collapsible */}
                    {showFilters && (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '30px',
                            marginBottom: '40px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            animation: 'slideDown 0.3s ease-out'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: '#1a1a1a',
                                    margin: 0
                                }}>
                                    <i className="fas fa-sliders-h" style={{ marginRight: '10px', color: '#007bff' }}></i>
                                    Filter Options
                                </h2>
                                <button
                                    onClick={resetFilters}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        color: '#666',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                >
                                    <i className="fas fa-redo" style={{ marginRight: '8px' }}></i>
                                    Reset All
                                </button>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '20px'
                            }}>
                                {/* Type Filter */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '0.9rem'
                                    }}>
                                        <i className="fas fa-laptop" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                        Product Type
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.3s ease'
                                        }}
                                    >
                                        <option value="all">All Products ({stats.total})</option>
                                        <option value="laptop">Laptops ({stats.laptops})</option>
                                        <option value="accessory">Accessories ({stats.accessories})</option>
                                    </select>
                                </div>

                                {/* Brand Filter */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '0.9rem'
                                    }}>
                                        <i className="fas fa-tag" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                        Brand
                                    </label>
                                    <select
                                        value={selectedBrand}
                                        onChange={(e) => setSelectedBrand(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All Brands</option>
                                        {brands.map((brand: string) => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Price Range Filter */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '0.9rem'
                                    }}>
                                        <i className="fas fa-dollar-sign" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                        Price Range
                                    </label>
                                    <select
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All Prices</option>
                                        <option value="0-10000">Under ₹10,000</option>
                                        <option value="10000-25000">₹10,000 - ₹25,000</option>
                                        <option value="25000-50000">₹25,000 - ₹50,000</option>
                                        <option value="50000-75000">₹50,000 - ₹75,000</option>
                                        <option value="75000-999999">Above ₹75,000</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '0.9rem'
                                    }}>
                                        <i className="fas fa-sort" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="name">Name: A to Z</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#007bff' }}></i>
                            <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#666' }}>Loading products...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                        }}>
                            <i className="fas fa-box-open" style={{ fontSize: '4rem', color: '#d1d5db', marginBottom: '20px' }}></i>
                            <h3 style={{ fontSize: '1.5rem', color: '#374151', marginBottom: '10px' }}>No Products Found</h3>
                            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Try adjusting your filters to see more results</p>
                            <button
                                onClick={resetFilters}
                                style={{
                                    padding: '12px 24px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '30px'
                        }}>
                            {filteredProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.type}/${product.id}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="product-card" style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {/* Product Image */}
                                        <div style={{
                                            width: '100%',
                                            height: '220px',
                                            overflow: 'hidden',
                                            background: '#f3f4f6',
                                            position: 'relative'
                                        }}>
                                            <img
                                                src={product.images?.[0] || '/uploads/placeholder.jpg'}
                                                alt={product.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.5s ease'
                                                }}
                                                className="product-image"
                                            />
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '15px',
                                                    left: '15px',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                                </div>
                                            )}
                                            {product.stock <= 5 && product.stock > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '15px',
                                                    right: '15px',
                                                    background: '#f59e0b',
                                                    color: 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    Only {product.stock} left
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '10px'
                                            }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    fontWeight: '600',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {product.brand}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: '#9ca3af',
                                                    fontWeight: '500'
                                                }}>
                                                    {product.productCode}
                                                </span>
                                            </div>

                                            <h3 style={{
                                                fontSize: '1.1rem',
                                                fontWeight: '700',
                                                color: '#1a1a1a',
                                                marginBottom: '12px',
                                                lineHeight: '1.4',
                                                flex: 1
                                            }}>
                                                {product.name}
                                            </h3>

                                            <div style={{ marginTop: 'auto' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'baseline',
                                                    gap: '10px',
                                                    marginBottom: '12px'
                                                }}>
                                                    <span style={{
                                                        fontSize: '1.5rem',
                                                        fontWeight: '700',
                                                        color: '#007bff'
                                                    }}>
                                                        ₹{product.price.toLocaleString()}
                                                    </span>
                                                    {product.originalPrice && product.originalPrice > product.price && (
                                                        <span style={{
                                                            fontSize: '1rem',
                                                            color: '#9ca3af',
                                                            textDecoration: 'line-through'
                                                        }}>
                                                            ₹{product.originalPrice.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        color: product.stock > 0 ? '#10b981' : '#ef4444',
                                                        fontWeight: '600'
                                                    }}>
                                                        <i className={`fas fa-${product.stock > 0 ? 'check-circle' : 'times-circle'}`} style={{ marginRight: '5px' }}></i>
                                                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                    <span style={{
                                                        color: '#007bff',
                                                        fontWeight: '600',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        View Details →
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .product-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 40px rgba(0, 123, 255, 0.15) !important;
                }
                .product-card:hover .product-image {
                    transform: scale(1.1);
                }
                select:focus {
                    outline: none;
                    border-color: #007bff !important;
                }
            `}</style>
        </>
    );
}
