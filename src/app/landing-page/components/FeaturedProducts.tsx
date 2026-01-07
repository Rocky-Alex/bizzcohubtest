"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductImage from "@/components/ProductImage";
import { addToCart } from "@/utils/cart";
import { useToast } from "@/context/ToastContext";
import imageKitLoader from "@/utils/imageLoader";

import "../styles/landing-page.css";
import "../styles/home-styles.css";
import "../styles/landing-page-extra.css";
import "../styles/product-card-outline.css";

interface FeaturedProductsProps {
    products: any[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const { showToast } = useToast();

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // scroll-fast
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const newActiveSlide = Math.round(scrollLeft / clientWidth); // Simplistic for single items, might need adjustment if multiple visible
            // Better: use card width.
            // If using auto-width/flex, clientWidth might be the container width.
            // Let's rely on scroll percentage or specific item width if possible. 
            // For now, simple ratio.
            const totalWidth = scrollContainerRef.current.scrollWidth - clientWidth;
            if (totalWidth > 0) {
                const progress = scrollLeft / totalWidth;
                const index = Math.round(progress * (products.length - 1));
                setActiveSlide(index);
            }
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [products.length]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 400;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const handleAddToCart = (product: any) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price, // Already handled by transformProduct
            image: product.image || '/placeholder.svg',
            quantity: 1,
            options: {}, // Default options
        });
        showToast(`${product.name} added to cart!`, 'success');
    };

    const getBadgeClass = (badge: string) => {
        if (!badge) return '';
        const lower = badge.toLowerCase();
        if (lower.includes('new')) return 'new';
        if (lower.includes('sale') || lower.includes('offer')) return 'sale';
        if (lower.includes('best') || lower.includes('hot')) return 'hot';
        return 'new';
    };

    return (
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

            {/* Desktop Navigation Buttons */}
            <div className="desktop-slider-nav">
                <button onClick={() => scroll('left')} className="slider-nav-btn left-nav">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <button onClick={() => scroll('right')} className="slider-nav-btn right-nav">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            <div
                className="products-grid-v3"
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '2rem',
                    paddingBottom: '2rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                <style jsx>{`
                    .products-grid-v3::-webkit-scrollbar {
                        display: none;
                    }
                    .product-card-v3 {
                        flex: 0 0 320px;
                        min-width: 320px;
                    }
                `}</style>
                {products.map((product, index) => (
                    <div key={product.id || index} className="product-card-v3 hover-lift">
                        {product.badge && (
                            <div className={`product-badge-v3 ${getBadgeClass(product.badge)} pulse-animation`}>
                                {product.badge}
                            </div>
                        )}
                        <div className="product-image-v3">
                            <Link href={`/products/${product.type?.toLowerCase()}/${product.id}`} className="block h-full w-full">
                                <ProductImage
                                    src={product.image}
                                    alt={product.name}
                                    width={400}
                                    height={400}
                                    className="object-cover w-full h-full"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
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
                                <span className="current">AED {product.price}</span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <>
                                        <span className="original">AED {product.originalPrice}</span>
                                        <span className="discount">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
                                    </>
                                )}
                            </div>
                            <button
                                className="add-to-cart-btn magnetic-btn"
                                onClick={() => handleAddToCart(product)}
                            >
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

            {/* Mobile Dots */}
            <div className="mobile-dots">
                {products.map((_, index) => (
                    <span
                        key={index}
                        className={`dot ${activeSlide === index ? 'active' : ''}`}
                    />
                ))}
            </div>
        </section>
    );
}
