import { getFeaturedProducts } from "@/lib/products";
import LandingHeroAntigravity from "./components/LandingHeroAntigravity";

import FeaturedProducts from "../landing-page/components/FeaturedProducts";
import CategoryCard from "../landing-page/components/CategoryCard";
import Link from "next/link";
import { Metadata } from 'next';

// Import styles (these will be included in the bundle)
import "../landing-page/styles/landing-page.css";
import "../landing-page/styles/home-styles.css";
import "../landing-page/styles/landing-page-extra.css";
import "../landing-page/styles/product-card-outline.css";

export const metadata: Metadata = {
    title: 'Bizz Co Hub | Premium Refurbished Electronics & IT Solutions',
    description: 'Bizz Co Hub is your trusted partner for high-quality refurbished laptops, desktops, and enterprise IT services. Global bulk supply and advanced repair center.',
    keywords: 'refurbished macbooks, gaming laptops, IT solutions Dubai, business laptops, refurbished phones',
};

export const dynamic = 'force-dynamic';

export default async function Page2() {
    // 1. Fetch data on the server
    const featuredProducts = await getFeaturedProducts(10);

    return (
        <div className="landing-page">
            {/* 2. Client Island for Hero (Stack + Particles) */}
            {/* 2. Client Island for Hero (Stack + Particles) */}
            <LandingHeroAntigravity />

            {/* Features Section - Static Content */}
            <section className="features-section-v3">
                <div className="features-container">
                    <div className="feature-card-v3 hover-lift">
                        <div className="feature-icon-v3 rotate-on-hover">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                        </div>
                        <h3>Fast Shipping</h3>
                        <p>Within 2-3 days delivery</p>
                        <div className="feature-glow"></div>
                    </div>

                    <div className="feature-card-v3 hover-lift">
                        <div className="feature-icon-v3 rotate-on-hover">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <h3>Secure Payment</h3>
                        <p>100% protected transactions</p>
                        <div className="feature-glow"></div>
                    </div>

                    <div className="feature-card-v3 hover-lift">
                        <div className="feature-icon-v3 rotate-on-hover">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <h3>24/7 Support</h3>
                        <p>Always here to help you</p>
                        <div className="feature-glow"></div>
                    </div>

                    <div className="feature-card-v3 hover-lift">
                        <div className="feature-icon-v3 rotate-on-hover">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                        </div>
                        <h3>Easy Returns</h3>
                        <p>7-day Warranty on all products</p>
                        <div className="feature-glow"></div>
                    </div>
                </div>
            </section>

            {/* Shop by Category Section - Static Content with Optimised Images */}
            <section className="new-categories-section">
                <div className="new-categories-header">
                    <span className="pill">COLLECTIONS</span>
                    <h2>Shop by <span className="text-purple">Category</span></h2>
                    <p>Explore our curated selection of premium tech products</p>
                </div>

                <div className="new-categories-grid">
                    {/* Phones - Light Theme */}
                    <CategoryCard
                        href="/products?category=Phones"
                        title="Phones"
                        description="Premium Smartphones"
                        imageUrl="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
                        isLight={true}
                        useLoader={false}
                        priority={true}
                    />

                    {/* Renewed Laptops - Light Theme */}
                    <CategoryCard
                        href="/products?category=Renewed%20Laptops"
                        title="Renewed Laptops"
                        description="High-performance computing"
                        imageUrl="https://ik.imagekit.io/kxci2a0h5/landing-page/category-laptops_CNlHa-lWv.jpg?updatedAt=1765186346540"
                        isLight={true}
                        priority={true}
                    />

                    {/* MacBook - Light Theme */}
                    <CategoryCard
                        href="/products?category=MacBook"
                        title="MacBook"
                        description="Power & Performance"
                        imageUrl="https://ik.imagekit.io/kxci2a0h5/landing-page/category-macbook.jpg?updatedAt=1765254808557"
                        isLight={true}
                        width={500}
                        height={300}
                    />

                    {/* Gaming Laptops - Dark Theme */}
                    <CategoryCard
                        href="/products?category=Gaming%20Laptop"
                        title="Gaming Laptops"
                        description="Dominate the Game"
                        imageUrl="https://ik.imagekit.io/kxci2a0h5/landing-page/gaming-laptop.png?updatedAt=1765254743460"
                    />

                    {/* Desktops - Dark Theme */}
                    <CategoryCard
                        href="/products?category=Desktops"
                        title="Desktops"
                        description="Ultimate Power"
                        imageUrl="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80"
                        useLoader={false}
                    />

                    {/* Accessories - Light Theme */}
                    <CategoryCard
                        href="/products?category=Accessories"
                        title="Accessories"
                        description="Complete your setup"
                        imageUrl="https://ik.imagekit.io/kxci2a0h5/landing-page/category-accessories.jpg?updatedAt=1765254764848"
                        isLight={true}
                        priority={true}
                    />
                </div>
            </section>

            {/* 3. Client Island for Products Slider */}
            <FeaturedProducts products={featuredProducts} />

        </div >
    );
}
