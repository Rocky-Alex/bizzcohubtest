import { getProducts } from "@/lib/products";
import CategoryFilter from "./components/CategoryFilter";

import ProductCard from "./components/ProductCard";
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
    };
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
    const category = searchParams.category && searchParams.category !== 'all' ? searchParams.category : '';
    const type = searchParams.type && searchParams.type !== 'all' ? searchParams.type : 'Products';

    return {
        title: category || (type.charAt(0).toUpperCase() + type.slice(1)),
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



    // 2. Fetch all products to determine available categories
    const allProducts = await getProducts();
    const categories = Array.from(new Set(allProducts.map((p: any) => p.category))).filter(Boolean) as string[];

    // 4. Get the filtered products for display (use the DAL for consistency)
    const products = await getProducts(filters);

    return (
        <section style={{
            padding: '100px 20px 40px',
            background: 'var(--bg-primary)',
            minHeight: '60vh'
        }}>
            <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
                <CategoryFilter
                    categories={categories}
                    selectedCategory={filters.category}
                />


                {products.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)'
                    }}>
                        <i className="fas fa-box-open" style={{ fontSize: '4rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}></i>
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '10px' }}>No Products Found</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Try adjusting your filters to see more results</p>
                    </div>
                ) : (
                    <div className="products-layout-grid">
                        {products.map((product: any, index: number) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                priority={index < 4}
                            />
                        ))}
                    </div>
                )}
            </div>

        </section>
    );
}
