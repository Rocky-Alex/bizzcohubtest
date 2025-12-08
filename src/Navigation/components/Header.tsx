"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "../styles/header.css";
import GradientText from "./GradientText";

export default function Header() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Update cart count from localStorage
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
        };

        updateCartCount();
        window.addEventListener('cart-updated', updateCartCount);
        return () => window.removeEventListener('cart-updated', updateCartCount);
    }, []);

    const isActive = (path: string) => pathname === path ? 'active' : '';

    return (
        <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-container">
                {/* Logo */}
                <Link href="/" className="logo">
                    <Image
                        src="/icon/nav-logo.png"
                        alt="Bizz Co Hub Logo"
                        width={32}
                        height={32}
                        className="logo-image"
                    />
                    <GradientText
                        colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                        animationSpeed={3}
                        showBorder={false}
                        className="logo-text"
                    >
                        Bizz Co Hub
                    </GradientText>
                </Link>

                {/* Desktop Navigation - Centered */}
                <nav className="main-nav">
                    <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                        Home
                    </Link>

                    <Link href="/products" className={`nav-link ${pathname.startsWith('/products') ? 'active' : ''}`}>
                        E-Commerce
                    </Link>

                    <Link href="/services" className={`nav-link ${isActive('/services') ? 'active' : ''}`}>
                        Services
                    </Link>

                    <Link href="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
                        Contact
                    </Link>

                </nav>

                {/* Right Side Actions */}
                <div className="header-actions">
                    {/* Search Button */}
                    <button
                        className="header-action-btn search-btn"
                        onClick={() => setSearchOpen(!searchOpen)}
                        title="Search"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>

                    {/* Cart Button */}
                    <Link href="/cart" className="header-action-btn cart-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </Link>



                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {mobileMenuOpen ? (
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18"></path>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search Overlay */}
            {searchOpen && (
                <div className="search-overlay">
                    <div className="search-container-overlay">
                        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            type="search"
                            placeholder="Search products..."
                            className="search-input"
                            autoFocus
                        />
                        <button className="search-close" onClick={() => setSearchOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="mobile-menu">
                    <div className="mobile-menu-content">
                        <Link
                            href="/"
                            className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Home
                        </Link>

                        <Link
                            href="/services"
                            className={`mobile-nav-link ${isActive('/services') ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Services
                        </Link>

                        <Link
                            href="/contact"
                            className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Contact
                        </Link>

                        <Link
                            href="/products/laptop"
                            className={`mobile-nav-link ${pathname.startsWith('/products') ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            E-Commerce
                        </Link>

                        <div className="mobile-menu-divider"></div>


                    </div>
                </div>
            )}
        </header>
    );
}
