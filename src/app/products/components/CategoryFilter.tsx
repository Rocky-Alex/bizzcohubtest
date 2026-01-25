"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface CategoryFilterProps {
    categories: string[];
    selectedCategory: string;
}

export default function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleCategoryChange = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (category === 'all' || category === selectedCategory) {
            params.delete('category');
        } else {
            params.set('category', category);
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="category-filter-nav" style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            padding: '10px 0 15px 0',
            marginBottom: '20px',
            position: 'sticky',
            top: '60px',
            zIndex: 90,
            background: 'var(--bg-primary)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
        }}>
            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <button
                onClick={() => handleCategoryChange('all')}
                style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: !selectedCategory || selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: !selectedCategory || selectedCategory === 'all' ? '600' : '500',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                }}
            >
                All Products
            </button>

            {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                    <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: isSelected ? '600' : '500',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        {category}
                    </button>
                );
            })}
        </div>
    );
}
