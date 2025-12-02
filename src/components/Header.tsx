"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SiteConfig } from "../config/site";
import "../app/apple-nav.css";

export default function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [logo, setLogo] = useState(SiteConfig.logo);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        // Load logo from localStorage
        const savedBranding = JSON.parse(
            localStorage.getItem("bchBranding") || "{}"
        );
        if (savedBranding.logo) {
            setLogo(savedBranding.logo);
        }

        // Handle scroll effect
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleDropdownToggle = (name: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    if (pathname?.startsWith("/admin/login")) {
        return null;
    }

    return (
        <header className={`apple-header ${scrolled ? 'scrolled' : ''}`}>
            <nav className="apple-navbar">
                <div className="apple-nav-container">
                    <div className="apple-nav-wrapper">
                        <div className="apple-logo">
                            <Link href="/">
                                {logo ? (
                                    <img
                                        src={logo}
                                        alt={SiteConfig.siteName}
                                        className="apple-logo-img"
                                    />
                                ) : (
                                    <span className="apple-logo-text">{SiteConfig.siteName}</span>
                                )}
                            </Link>
                        </div>

                        <button className="apple-menu-toggle" onClick={toggleMenu}>
                            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        </button>

                        <ul className={`apple-nav-links ${isMenuOpen ? "active" : ""}`}>
                            <li className="apple-nav-item">
                                <Link
                                    href="/"
                                    className={`apple-nav-link ${pathname === "/" ? "active" : ""}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Home
                                </Link>
                            </li>

                            <li className={`apple-nav-item dropdown ${activeDropdown === "services" ? "active" : ""}`}>
                                <Link
                                    href="/services"
                                    className={`apple-nav-link ${pathname === "/services" ? "active" : ""}`}
                                >
                                    Services
                                    <i
                                        className="fas fa-chevron-down dropdown-icon"
                                        onClick={(e) => handleDropdownToggle("services", e)}
                                    ></i>
                                </Link>
                                <ul className="apple-dropdown-menu">
                                    <li>
                                        <Link href="/services#refurbishing" onClick={() => { setActiveDropdown(null); setIsMenuOpen(false); }}>
                                            <i className="fas fa-laptop-medical"></i>
                                            <span>Laptop & Desktop Refurbishing</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/services#repair" onClick={() => { setActiveDropdown(null); setIsMenuOpen(false); }}>
                                            <i className="fas fa-wrench"></i>
                                            <span>Laptop Repairing & Service</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/services#webdesign" onClick={() => { setActiveDropdown(null); setIsMenuOpen(false); }}>
                                            <i className="fas fa-code"></i>
                                            <span>Web Design & Development</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/services#more-services" onClick={() => { setActiveDropdown(null); setIsMenuOpen(false); }}>
                                            <i className="fas fa-plus-circle"></i>
                                            <span>More Services</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>

                            <li className={`apple-nav-item dropdown ${activeDropdown === "products" ? "active" : ""}`}>
                                <Link
                                    href="/products/laptops"
                                    className={`apple-nav-link ${pathname?.startsWith("/products") ? "active" : ""}`}
                                >
                                    Products
                                    <i
                                        className="fas fa-chevron-down dropdown-icon"
                                        onClick={(e) => handleDropdownToggle("products", e)}
                                    ></i>
                                </Link>
                                <ul className="apple-dropdown-menu">
                                    <li>
                                        <Link href="/products/laptops" onClick={() => { setActiveDropdown(null); setIsMenuOpen(false); }}>
                                            <i className="fas fa-laptop"></i>
                                            <span>Laptops</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/products/accessories" onClick={() => { setActiveDropdown(null); setIsMenuOpen(false); }}>
                                            <i className="fas fa-keyboard"></i>
                                            <span>Accessories</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>

                            <li className="apple-nav-item">
                                <Link
                                    href="/contact"
                                    className={`apple-nav-link ${pathname === "/contact" ? "active" : ""}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
}
