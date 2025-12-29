import { getProducts } from "@/lib/products";
import ProductFilterBar from "./components/ProductFilterBar";
import ProductCard from "./components/ProductCard";
import { Suspense } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import "./styles/products.css";
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
    searchParams: {
        type?: string;
        category?: string;
        brand?: string;
        priceRange?: string;
        sortBy?: string;
        seriesModel?: string;
    };
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
    const category = searchParams.category && searchParams.category !== 'all' ? searchParams.category : '';
    const type = searchParams.type && searchParams.type !== 'all' ? searchParams.type : 'Products';

    return {
        title: `${category || (type.charAt(0).toUpperCase() + type.slice(1))} Online at Best Prices`,
        description: `Explore our collection of ${category || 'premium refurbished electronics'}. High performance, certified quality, and competitive prices at Bizz Co Hub.`,
    };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    // 1. Resolve filters from searchParams
    const filters = {
        type: searchParams.type || 'all',
        category: searchParams.category || 'all',
        brand: searchParams.brand || 'all',
        priceRange: searchParams.priceRange || 'all',
        sortBy: searchParams.sortBy || 'newest',
    };

    // 2. Fetch all products once to get full brand list and filter what we need
    // This avoids redundant DB calls while we're doing in-memory filtering anyway
    const allProducts = await getProducts();

    // 3. Derive stats and brands from the full list
    const brands = Array.from(new Set(allProducts.map((p: any) => p.brand))).filter(Boolean) as string[];

    // Group brands by category for the filter dropdowns
    const categoriesMap: Record<string, Set<string>> = {};
    const macbookVariantsSet = new Set<string>();

    allProducts.forEach((p: any) => {
        const cat = p.category;
        const brand = p.brand;

        // Group brands
        if (cat && brand) {
            if (!categoriesMap[cat]) {
                categoriesMap[cat] = new Set();
            }
            categoriesMap[cat].add(brand);
        }

        // Collect MacBook Series + Model
        if (cat === 'MacBook') {
            const series = p.specifications?.['Series'] || '';
            const model = p.specifications?.['Model'] || '';
            const combo = [series, model].filter(Boolean).join(' ');
            if (combo) {
                macbookVariantsSet.add(combo);
            }
        }
    });

    const brandsByCategory: Record<string, string[]> = {};
    Object.entries(categoriesMap).forEach(([cat, brandSet]) => {
        brandsByCategory[cat] = Array.from(brandSet).sort();
    });

    const macbookVariants = Array.from(macbookVariantsSet).sort();

    const stats = {
        total: allProducts.length,
        laptops: allProducts.filter((p: any) => p.type === 'laptop').length,
        accessories: allProducts.filter((p: any) => p.type === 'accessory').length,
    };

    const categoryCounts: Record<string, number> = {};
    allProducts.forEach((p: any) => {
        if (p.category) {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        }
    });

    // 4. Get the filtered products for display (use the DAL for consistency)
    let products = await getProducts(filters);

    // 5. Apply additional manual filters that DAL might not cover (seriesModel)
    if (searchParams.seriesModel && searchParams.seriesModel !== 'all') {
        products = products.filter((p: any) => {
            const series = p.specifications?.['Series'] || '';
            const model = p.specifications?.['Model'] || '';
            const combo = [series, model].filter(Boolean).join(' ');
            return combo === searchParams.seriesModel;
        });
    }

    return (
        <section style={{
            padding: '20px 0px',
            background: 'var(--bg-primary)',
            minHeight: '40vh'
        }}>
            <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
                <Suspense fallback={<LoadingSpinner />}>
                    <ProductFilterBar
                        stats={stats}
                        brands={brands}
                        brandsByCategory={brandsByCategory}
                        macbookVariants={macbookVariants}
                        initialFilters={filters}
                        categoryCounts={categoryCounts}
                    />
                </Suspense>

                {products.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 10px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)'
                    }}>
                        <i className="fas fa-box-open" style={{ fontSize: '4rem', color: 'var(--text-tertiary)', marginBottom: '5px' }}></i>
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '5px' }}>No Products Found</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>Try adjusting your filters to see more results</p>
                    </div>
                ) : (
                    <div className="products-layout-grid">
                        {products.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>

        </section>
    );
}
