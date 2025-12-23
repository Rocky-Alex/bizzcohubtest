"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

interface ProductFiltersProps {
    stats: {
        total: number;
        laptops: number;
        accessories: number;
    };
    brands: string[];
    initialFilters: {
        type: string;
        category: string;
        brand: string;
        priceRange: string;
        sortBy: string;
    };
}

export default function ProductFilters({ stats, brands, initialFilters }: ProductFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [showFilters, setShowFilters] = useState(false);

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

    const handleFilterChange = (name: string, value: string) => {
        const query = createQueryString({ [name]: value });
        router.push(`${pathname}?${query}`, { scroll: false });
    };

    const resetFilters = () => {
        router.push(pathname, { scroll: false });
    };

    return (
        <div style={{ marginBottom: '20px', marginTop: '40px' }}>
            {/* Quick Categories & Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Renewed Laptops', type: 'laptop', category: 'Renewed Laptops' },
                        { label: 'MacBook', type: 'laptop', category: 'MacBook' },
                        { label: 'Accessories', type: 'accessory', category: 'Accessories' },
                        { label: 'Gaming Laptop', type: 'laptop', category: 'Gaming Laptop' }
                    ].map((btn, idx) => {
                        const isSelected = initialFilters.category === btn.category;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleFilterChange('category', isSelected ? 'all' : btn.category)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '10px',
                                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-secondary)',
                                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: '10px 24px',
                        background: showFilters ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: showFilters ? 'white' : 'var(--primary)',
                        border: '2px solid var(--primary)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className={`fas fa-${showFilters ? 'times' : 'filter'}`}></i>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
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
