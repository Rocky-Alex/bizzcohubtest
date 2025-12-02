"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./nav-styles.css";

export default function Navigation() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        // Handle scroll effect for navbar
        const handleScroll = () => {
            setScrolled(window.scrollY > window.innerHeight - 100);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
            <div className="nav-container">
                <Link href="/" className="nav-logo">BIZZ CO HUB</Link>

                <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                    <li><Link href="/" onClick={() => setIsMenuOpen(false)}>HOME</Link></li>
                    <li><Link href="/services" onClick={() => setIsMenuOpen(false)}>SERVICES</Link></li>
                    <li><Link href="/products" onClick={() => setIsMenuOpen(false)}>PRODUCTS</Link></li>
                    <li><Link href="/contact" onClick={() => setIsMenuOpen(false)}>CONTACT</Link></li>
                </ul>

                <button
                    className={`hamburger ${isMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}
