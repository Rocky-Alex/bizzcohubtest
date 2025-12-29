"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

// ProductFilterBar component handles filtering logic using searchParams
// Updated for mobile responsiveness and dynamic category counts

interface ProductFiltersProps {
    stats: {
        total: number;
        laptops: number;
        accessories: number;
    };
    brands: string[];
    brandsByCategory: Record<string, string[]>;
    macbookVariants: string[];
    initialFilters: {
        type: string;
        category: string;
        brand: string;
        priceRange: string;
        sortBy: string;
    };
    categoryCounts?: Record<string, number>;
}

export default function ProductFilterBar({ stats, brands, brandsByCategory, macbookVariants, initialFilters, categoryCounts }: ProductFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [showFilters, setShowFilters] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const createQueryString = useCallback(
        (params: Record<string, string | null>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());

            Object.entries(params).forEach(([name, value]) => {
                if (value === null || value === 'all') {
                    newSearchParams.delete(name);
                } else {
                    newSearchParams.set(name, value);
                }
            });

            return newSearchParams.toString();
        },
        [searchParams]
    );

    const updateFilters = (params: Record<string, string | null>) => {
        const query = createQueryString(params);
        router.push(`${pathname}?${query}`, { scroll: false });
    };

    const handleFilterChange = (name: string, value: string) => {
        updateFilters({ [name]: value });
    };

    const resetFilters = () => {
        router.push(pathname, { scroll: false });
    };

    return (
        <div style={{ marginBottom: '20px', marginTop: '40px' }}>


            {/* Flipkart-style Filter Navigation */}
            <div className="category-nav-container" style={{
                background: 'var(--bg-primary)',
                padding: '10px 0',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                position: 'sticky',
                top: '72px',
                zIndex: 50
            }}>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                        { label: 'All Products', type: 'all', category: 'all' },
                        { label: 'Mobiles', type: 'all', category: 'Mobiles' },
                        { label: 'Renewed Laptops', type: 'laptop', category: 'Renewed Laptops' },
                        { label: 'MacBook', type: 'laptop', category: 'MacBook' },
                        { label: 'Gaming Laptops', type: 'laptop', category: 'Gaming Laptop' },
                        { label: 'Desktop', type: 'all', category: 'Desktop' },
                        { label: 'Accessories', type: 'accessory', category: 'Accessories' }
                    ].filter(item => {
                        if (item.category === 'all') return true;
                        // If we have counts, check if count > 0. If no counts provided, show all (safe fallback)
                        return !categoryCounts || (categoryCounts[item.category] || 0) > 0;
                    }).map((item, idx) => {
                        const isAllProducts = item.category === 'all';
                        const isMacBook = item.category === 'MacBook';

                        // Select content source: MacBook uses variants, others use brands
                        const dropdownItems = isMacBook
                            ? macbookVariants
                            : (brandsByCategory[item.category] || []);

                        return (
                            <div
                                key={idx}
                                className="product-filter-nav-item"
                                onMouseEnter={isAllProducts ? undefined : () => setActiveDropdown(idx)}
                                onMouseLeave={isAllProducts ? undefined : () => setActiveDropdown(null)}
                                onClick={() => {
                                    setActiveDropdown(null);
                                    if (isAllProducts) {
                                        resetFilters();
                                    } else {
                                        updateFilters({
                                            category: item.category,
                                            brand: 'all', // Reset brand/series when switching category root
                                            seriesModel: 'all',
                                            type: item.type || 'all'
                                        });
                                    }
                                }}
                            >
                                {item.label}
                                {/* Dropdown arrow */}
                                {!isAllProducts && (
                                    <i className={`fas fa-chevron-${activeDropdown === idx ? 'up' : 'down'}`}></i>
                                )}

                                {/* Hover Dropdown */}
                                {!isAllProducts && activeDropdown === idx && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '0',
                                        background: 'var(--bg-secondary)',
                                        minWidth: '200px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        borderRadius: '8px',
                                        zIndex: 100,
                                        border: '1px solid var(--border)',
                                        padding: '8px 0',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(null);
                                                updateFilters({
                                                    category: item.category,
                                                    brand: 'all',
                                                    seriesModel: 'all',
                                                    type: item.type || 'all'
                                                });
                                            }}
                                            style={{
                                                padding: '10px 16px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: '600',
                                                borderBottom: '1px solid var(--border)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            All {item.label}
                                        </div>
                                        {dropdownItems.length > 0 ? (
                                            <>
                                                {dropdownItems.slice(0, 10).map((valueItem, bIdx) => (
                                                    <div
                                                        key={bIdx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(null);

                                                            if (isMacBook) {
                                                                // Filter by Series/Model
                                                                updateFilters({
                                                                    category: item.category,
                                                                    brand: 'all',
                                                                    seriesModel: valueItem,
                                                                    type: item.type || 'all'
                                                                });
                                                            } else {
                                                                // Filter by Brand
                                                                updateFilters({
                                                                    category: item.category,
                                                                    brand: valueItem,
                                                                    seriesModel: 'all',
                                                                    type: item.type || 'all'
                                                                });
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '8px 16px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                                                            e.currentTarget.style.color = 'var(--primary)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                                        }}
                                                    >
                                                        {valueItem}
                                                    </div>
                                                ))}
                                                {dropdownItems.length > 10 && (
                                                    <div style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                        + {dropdownItems.length - 10} more
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{ padding: '8px 16px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                                                No items found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Brands Dropdown Trigger (Visual only for now, acts as a filter toggle) */}
                    <div
                        className="product-filter-nav-item"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        More Filters
                        <i className={`fas fa-${showFilters ? 'chevron-up' : 'chevron-down'}`}></i>
                    </div>
                </div>
            </div>

            {/* Filter Bar - Collapsible */}
            {showFilters && (
                <div
                    className="filter-container"
                    style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '16px',
                        padding: '30px',
                        marginBottom: '40px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid var(--border)'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Filter Options</h2>
                        <button onClick={resetFilters} style={{ padding: '10px 20px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Reset All
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {/* Type Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Type</label>
                            <select
                                value={initialFilters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}
                            >
                                <option value="all">All Products</option>
                                <option value="laptop">Laptops</option>
                                <option value="accessory">Accessories</option>
                            </select>
                        </div>

                        {/* Brand Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Brand</label>
                            <select
                                value={initialFilters.brand}
                                onChange={(e) => handleFilterChange('brand', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}
                            >
                                <option value="all">All Brands</option>
                                {brands.map((brand) => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Price Range</label>
                            <select
                                value={initialFilters.priceRange}
                                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}
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
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Sort By</label>
                            <select
                                value={initialFilters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}
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
        </div>
    );
}
