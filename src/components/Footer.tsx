"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./footer.css";

export default function Footer() {
    const pathname = usePathname();
    const router = useRouter();
    const [clickCount, setClickCount] = useState(0);

    const handleAdminClick = () => {
        if (pathname !== "/contact") return;

        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount === 10) {
            router.push('/admin/login');
            setClickCount(0);
        }
    };

    if (pathname?.startsWith("/admin/login")) {
        return null;
    }

    return (
        <footer className="minimal-footer">
            <div className="footer-gradient-line"></div>
            <div className="footer-container">
                <div className="footer-main">
                    <div className="footer-left">
                        <Link href="/">
                            <h3 className="footer-brand">Bizz Co Hub</h3>
                        </Link>
                        <div className="footer-links">
                            <Link href="/">Home</Link>
                            <Link href="/products/laptops">Laptops</Link>
                            <Link href="/products/accessories">Accessories</Link>
                            <Link href="/contact">Contact</Link>

                        </div>
                        <div className="footer-info">
                            <p>© {new Date().getFullYear()} Bizz Co Hub. All rights reserved.</p>
                            <span className="footer-divider">|</span>
                            {pathname === "/contact" ? (
                                <span
                                    className="footer-plain"
                                    onClick={handleAdminClick}
                                    style={{ cursor: "default", userSelect: "none" }}
                                >
                                    Designed by Bizz Co Hub
                                </span>
                            ) : (
                                <span className="footer-plain">
                                    Designed by Bizz Co Hub
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="footer-address">
                        <h4>Visit Us</h4>
                        <p>
                            <i className="fas fa-map-marker-alt"></i>
                            behind souk al mubarak Hypermarket – Industrial Area 5 – Sharjah
                        </p>
                        <p>
                            <i className="fas fa-phone"></i>
                            +971 56 706 4457
                        </p>
                        <p>
                            <i className="fas fa-envelope"></i>
                            rishadpnpm@gmail.com
                        </p>
                    </div>
                </div>
            </div>
        </footer >
    );
}
