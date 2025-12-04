import Link from "next/link";
import CursorFollower from "./components/CursorFollower";

export default function Home() {
    return (
        <div className="landing-page">
            <CursorFollower />

            {/* Hero Section */}
            <section className="hero-section-v3">
                <div className="hero-bg-animated"></div>
                <div className="particles-container">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="particle" style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 10}s`
                        }}></div>
                    ))}
                </div>

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
                            <button className="btn-glass-animated magnetic-btn">
                                <span className="btn-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                                    </svg>
                                </span>
                                <span className="btn-text">Watch Video</span>
                                <div className="ripple"></div>
                            </button>
                        </div>

                        <div className="hero-stats fade-in-up delay-4">
                            <div className="stat-card">
                                <h3 className="counter" data-target="5000">0</h3>
                                <p>Happy Customers</p>
                                <div className="stat-glow"></div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-card">
                                <h3 className="counter" data-target="200">0</h3>
                                <p>Premium Products</p>
                                <div className="stat-glow"></div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-card">
                                <h3 className="counter" data-target="99">0</h3>
                                <p>Satisfaction Rate</p>
                                <div className="stat-glow"></div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="visual-card card-1 float-animation">
                            <img src="/uploads/product-1.jpg" alt="Product" />
                            <div className="card-glow"></div>
                        </div>
                        <div className="visual-card card-2 float-animation delay-1">
                            <img src="/uploads/product-2.jpg" alt="Product" />
                            <div className="card-glow"></div>
                        </div>
                        <div className="visual-card card-3 float-animation delay-2">
                            <img src="/uploads/category-laptops.jpg" alt="Product" />
                            <div className="card-glow"></div>
                        </div>

                        <div className="floating-badge badge-1 bounce-slow">
                            <div className="badge-icon gradient-bg">⚡</div>
                            <div className="badge-text">
                                <span className="badge-label">Fast Delivery</span>
                                <span className="badge-value">24-48 Hours</span>
                            </div>
                            <div className="badge-shine"></div>
                        </div>

                        <div className="floating-badge badge-2 bounce-slow delay-1">
                            <div className="badge-icon gradient-bg">✓</div>
                            <div className="badge-text">
                                <span className="badge-label">Quality</span>
                                <span className="badge-value">Guaranteed</span>
                            </div>
                            <div className="badge-shine"></div>
                        </div>

                        <div className="floating-badge badge-3 bounce-slow delay-2">
                            <div className="badge-icon gradient-bg">★</div>
                            <div className="badge-text">
                                <span className="badge-label">Rating</span>
                                <span className="badge-value">4.9/5.0</span>
                            </div>
                            <div className="badge-shine"></div>
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
                    <Link href="/products/laptops" className="category-card-v3 large hover-scale">
                        <div className="category-image-v3">
                            <img src="/uploads/category-laptops.jpg" alt="Laptops" />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <div className="category-badge shine-effect">Featured</div>
                            <h3>Premium Laptops</h3>
                            <p>High-performance computing</p>
                            <div className="category-cta">
                                <span>Shop Now</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="card-shine-effect"></div>
                    </Link>

                    <Link href="/products/headphones" className="category-card-v3 hover-scale">
                        <div className="category-image-v3">
                            <img src="/uploads/category-headphones.jpg" alt="Headphones" />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <h3>Audio Gear</h3>
                            <p>Premium sound quality</p>
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
                            <img src="/uploads/category-accessories.jpg" alt="Accessories" />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <h3>Accessories</h3>
                            <p>Complete your setup</p>
                            <div className="category-cta">
                                <span>Discover</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="card-shine-effect"></div>
                    </Link>

                    <Link href="/products/speakers" className="category-card-v3 hover-scale">
                        <div className="category-image-v3">
                            <img src="/uploads/category-speakers.jpg" alt="Speakers" />
                            <div className="category-overlay gradient-overlay"></div>
                        </div>
                        <div className="category-content-v3">
                            <div className="category-badge hot shine-effect">Hot</div>
                            <h3>Speakers</h3>
                            <p>Immersive audio</p>
                            <div className="category-cta">
                                <span>View All</span>
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
                    {[
                        { name: "Sony WH-1000XM5", category: "Headphones", price: 399, original: 449, badge: "new", img: "product-1.jpg", rating: 5, reviews: 128 },
                        { name: "Apple AirPods Pro", category: "Earbuds", price: 249, original: 299, badge: "sale", img: "product-2.jpg", rating: 5, reviews: 256 },
                        { name: "Bose QuietComfort 45", category: "Headphones", price: 329, original: null, badge: null, img: "product-3.jpg", rating: 4, reviews: 89 },
                        { name: "JBL Flip 6", category: "Speakers", price: 129, original: null, badge: "hot", img: "product-4.jpg", rating: 5, reviews: 342 }
                    ].map((product, index) => (
                        <div key={index} className="product-card-v3 hover-lift">
                            {product.badge && (
                                <div className={`product-badge-v3 ${product.badge} pulse-animation`}>
                                    {product.badge}
                                </div>
                            )}
                            <div className="product-image-v3">
                                <img src={`/uploads/${product.img}`} alt={product.name} />
                                <div className="product-actions">
                                    <button className="action-btn magnetic-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </button>
                                    <button className="action-btn magnetic-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div className="image-overlay"></div>
                            </div>
                            <div className="product-info-v3">
                                <div className="product-category">{product.category}</div>
                                <h3>{product.name}</h3>
                                <div className="product-rating-v3">
                                    <div className="stars">{"★".repeat(product.rating)}{"☆".repeat(5 - product.rating)}</div>
                                    <span className="rating-count">({product.reviews})</span>
                                </div>
                                <div className="product-price-v3">
                                    <span className="current">${product.price}</span>
                                    {product.original && (
                                        <>
                                            <span className="original">${product.original}</span>
                                            <span className="discount">-{Math.round((1 - product.price / product.original) * 100)}%</span>
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

            {/* Services CTA */}
            <section className="services-cta-v3">
                <div className="cta-bg-animated"></div>
                <div className="services-cta-container">
                    <div className="services-cta-content fade-in-up">
                        <h2 className="cta-title">
                            <span className="title-line">Professional</span>
                            <span className="title-line gradient-text-animated">Tech Services</span>
                        </h2>
                        <p>Expert laptop repair, refurbishing, and custom web design solutions for your business</p>
                        <Link href="/services" className="btn-gradient-animated magnetic-btn">
                            <span className="btn-text">Explore Services</span>
                            <span className="btn-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </span>
                            <div className="btn-shine"></div>
                        </Link>
                    </div>
                    <div className="service-icon-grid fade-in-up delay-1">
                        <div className="service-icon-card hover-lift">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                            <span>Repair</span>
                            <div className="card-glow"></div>
                        </div>
                        <div className="service-icon-card hover-lift">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                            </svg>
                            <span>Refurbish</span>
                            <div className="card-glow"></div>
                        </div>
                        <div className="service-icon-card hover-lift">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                            <span>Web Design</span>
                            <div className="card-glow"></div>
                        </div>
                    </div>
                </div>
            </section>


        </div>
    );
}
