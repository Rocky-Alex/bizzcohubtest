"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Particles from "./components/Particles";
import Stack from "./components/Stack";

import "./styles/landing-page.css";
import "./styles/home-styles.css";

export default function LandingPage() {
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

    // Removed old particles state logic as we are using the new component

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (data.products) {
                    setFeaturedProducts(data.products.slice(0, 4));
                }
            } catch (error) {
                console.error("Error fetching featured products:", error);
            }
        };
        fetchProducts();
    }, []);

    const stackCards = useMemo(() => [
        <img key={1} src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" alt="Product 1" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }} />,
        <img key={2} src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" alt="Product 2" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }} />,
        <img key={3} src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" alt="Laptops" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }} />,
        <img key={4} src="https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=800&q=80" alt="MacBook" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }} />
    ], []);

    return (
        <div className="landing-page">

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
                <Particles
                    particleColors={['#667EEA', '#764BA2', '#F093FB', '#111827']}
                    particleCount={800}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={100}
                    moveParticlesOnHover={true}
                    alphaParticles={true}
                    disableRotation={false}
                />
            </div>

            {/* Hero Section */}
            <section className="hero-section-v3" style={{ background: 'transparent', zIndex: 1 }}>

                <div className="hero-container">
                    <div className="hero-content fade-in-up">
                        <div className="hero-tag glow-effect">
                            <span className="tag-dot pulse-dot"></span>
                            <span className="tag-text">New Collection 2024</span>
                            <div className="tag-shine"></div>
                        </div>

                        <h1 className="hero-title">
                            <span className="title-line slide-in-left">Transform Your</span>
                            <span className="title-line slide-in-left delay-1">
                                <span className="gradient-text-animated">Digital World</span>
                            </span>
                        </h1>

                        <p className="hero-subtitle fade-in-up delay-2">
                            Experience the perfect blend of cutting-edge technology and premium design.
                            Discover products that elevate your lifestyle.
                        </p>

                        <div className="hero-cta fade-in-up delay-3">
                            <Link href="/products" className="btn-gradient-animated magnetic-btn">
                                <span className="btn-text">Explore Collection</span>
                                <span className="btn-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                                <div className="btn-shine"></div>
                            </Link>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
                            <Stack
                                randomRotation={true}
                                sensitivity={180}
                                sendToBackOnClick={true}
                                autoplay={true}
                                autoplayDelay={3000}
                                cards={stackCards}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section-v3">
                <div className="features-container">
                    <div className="feature-card-v3 hover-lift">
                        <div className="feature-icon-v3 rotate-on-hover">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                        </div>
                        <h3>Free Shipping</h3>
                        <p>On all orders over $50</p>
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
                        <p>30-day money back guarantee</p>
                        <div className="feature-glow"></div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section-v3">
                <div className="section-header-v3 scroll-reveal">
                    <div className="section-tag glow-effect">
                        <span>Collections</span>
                        <div className="tag-shine"></div>
                    </div>
                    <h2 className="section-title-v3">
                        <span className="title-word">Shop</span>
                        <span className="title-word delay-1">by</span>
                        <span className="title-word delay-2 gradient-text-animated">Category</span>
                    </h2>
                    <p className="section-subtitle-v3">Explore our curated selection of premium tech products</p>
                </div>

                <div className="categories-grid-v3">
                    <Link href="/products/laptops" className="category-card-v3 hover-scale">
                        <div className="category-image-v3">
                            <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" alt="Laptops" />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <h3>Renewed Laptops</h3>
                            <p>High-performance computing</p>
                            <div className="category-cta">
                                <span>Explore</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="card-shine-effect"></div>
                    </Link>

                    <Link href="/products/laptops" className="category-card-v3 hover-scale">
                        <div className="category-image-v3">
                            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=800&q=80" alt="MacBook" style={{ transform: "scale(1.15)" }} />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <h3>MacBook</h3>
                            <p>Power & Performance</p>
                            <div className="category-cta">
                                <span>Explore</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="card-shine-effect"></div>
                    </Link>

                    <Link href="/products/accessories" className="category-card-v3 hover-scale">
                        <div className="category-image-v3">
                            <img src="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80" alt="Accessories" />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <h3>Accessories</h3>
                            <p>Complete your setup</p>
                            <div className="category-cta">
                                <span>Explore</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="card-shine-effect"></div>
                    </Link>

                    <Link href="/products/laptops" className="category-card-v3 hover-scale">
                        <div className="category-image-v3">
                            <img src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80" alt="Gaming Laptops" />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <h3>Gaming Laptops</h3>
                            <p>Dominate the Game</p>
                            <div className="category-cta">
                                <span>Explore</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="card-shine-effect"></div>
                    </Link>
                </div>
            </section>

            {/* Products Section */}
            <section className="products-section-v3">
                <div className="section-header-v3 scroll-reveal">
                    <div>
                        <div className="section-tag glow-effect">
                            <span>Best Sellers</span>
                            <div className="tag-shine"></div>
                        </div>
                        <h2 className="section-title-v3">
                            <span className="title-word">Featured</span>
                            <span className="title-word delay-1 gradient-text-animated">Products</span>
                        </h2>
                    </div>
                    <Link href="/products" className="view-all-btn magnetic-btn">
                        <span>View All Products</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="products-grid-v3">
                    {featuredProducts.map((product, index) => (
                        <div key={index} className="product-card-v3 hover-lift">
                            {product.badge && (
                                <div className={`product-badge-v3 ${product.badge} pulse-animation`}>
                                    {product.badge}
                                </div>
                            )}
                            <div className="product-image-v3">
                                <Link href={`/products/${product.type?.toLowerCase()}/${product.id}`} className="block h-full w-full">
                                    <img src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80'} alt={product.name} />
                                </Link>
                                <div className="product-actions">
                                    <button className="action-btn magnetic-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </button>
                                    <Link href={`/products/${product.type?.toLowerCase()}/${product.id}`} className="action-btn magnetic-btn flex items-center justify-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                                        </svg>
                                    </Link>
                                </div>
                                <div className="image-overlay"></div>
                            </div>
                            <div className="product-info-v3">
                                <div className="product-category">{product.category}</div>
                                <h3>
                                    <Link href={`/products/${product.type?.toLowerCase()}/${product.id}`} className="text-inherit no-underline hover:text-primary transition-colors">
                                        {product.name}
                                    </Link>
                                </h3>
                                <div className="product-rating-v3">
                                    <div className="stars">{"★".repeat(product.rating || 5)}{"☆".repeat(5 - (product.rating || 5))}</div>
                                    <span className="rating-count">({product.reviews || 0})</span>
                                </div>
                                <div className="product-price-v3">
                                    <span className="current">AED {product.offer_price || product.price}</span>
                                    {product.originalPrice && (
                                        <>
                                            <span className="original">AED {product.originalPrice}</span>
                                            <span className="discount">-{Math.round((1 - (product.offer_price || product.price) / product.originalPrice) * 100)}%</span>
                                        </>
                                    )}
                                </div>
                                <button className="add-to-cart-btn magnetic-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="9" cy="21" r="1"></circle>
                                        <circle cx="20" cy="21" r="1"></circle>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                    </svg>
                                    <span>Add to Cart</span>
                                    <div className="btn-ripple"></div>
                                </button>
                            </div>
                            <div className="product-glow"></div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
