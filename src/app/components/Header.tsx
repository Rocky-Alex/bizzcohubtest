"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./header.css";

export default function Header() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path: string) => pathname === path ? 'active' : '';

    return (
        <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-container">
                <Link href="/" className="logo">
                    <span className="logo-text">Bizz<span className="highlight">Co</span>Hub</span>
                    <div className="logo-dot"></div>
                </Link>

                <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <Link href="/" className={`nav-link ${isActive('/')}`}>
                        <span>Home</span>
                        <div className="nav-indicator"></div>
                    </Link>
                    <Link href="/products" className={`nav-link ${isActive('/products')}`}>
                        <span>Products</span>
                        <div className="nav-indicator"></div>
                    </Link>
                    <Link href="/services" className={`nav-link ${isActive('/services')}`}>
                        <span>Services</span>
                        <div className="nav-indicator"></div>
                    </Link>
                    <Link href="/about" className={`nav-link ${isActive('/about')}`}>
                        <span>About</span>
                        <div className="nav-indicator"></div>
                    </Link>
                    <Link href="/contact" className={`nav-link ${isActive('/contact')}`}>
                        <span>Contact</span>
                        <div className="nav-indicator"></div>
                    </Link>
                </nav>

                <div className="header-actions">
                    <Link href="/admin" className="action-btn icon-btn" title="Admin Dashboard">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </Link>
                    <button className="action-btn icon-btn cart-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                            <path d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span className="cart-badge">0</span>
                    </button>
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
        </header>
    );
}
