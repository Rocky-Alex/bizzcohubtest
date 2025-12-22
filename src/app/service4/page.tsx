"use client";

import Link from "next/link";
import "./styles/service4.css";

export default function Service4Page() {
    return (
        <div className="service4-wrapper">
            {/* Typographic Hero */}
            <header className="bento-hero">
                <div className="bento-header-top">
                    <div className="bento-title-group">
                        <div className="stat-pill-group mb-6">
                            <div className="stat-pill"><i className="fas fa-check-circle"></i> Certified</div>
                            <div className="stat-pill"><i className="fas fa-globe"></i> Global Shipping</div>
                        </div>
                        <h1>
                            Premium<br />
                            <span>Services.</span>
                        </h1>
                    </div>
                    <p className="bento-subtitle">
                        We provide end-to-end technology solutions, from bulk refurbishing to corporate IT management. Designed for scalability and performance.
                    </p>
                </div>
            </header>

            {/* Bento Grid */}
            <div className="bento-grid">

                {/* 1. Large Feature Card */}
                <div className="bento-card span-2-col large-card">
                    <div className="bento-icon-box">
                        <i className="fas fa-laptop-medical"></i>
                    </div>
                    <span className="bg-number">01</span>
                    <div>
                        <h3>Refurbished Devices</h3>
                        <p>Certified, performance-optimized laptops & desktops for Students, Gamers, and Offices.</p>
                        <div className="bento-tags">
                            <span className="bento-tag">30+ Checks</span>
                            <span className="bento-tag">Warranty</span>
                            <span className="bento-tag">A++ Grade</span>
                        </div>
                    </div>
                </div>

                {/* 2. Standard Card */}
                <div className="bento-card">
                    <div className="bento-icon-box">
                        <i className="fas fa-shipping-fast"></i>
                    </div>
                    <span className="bg-number">02</span>
                    <div>
                        <h3>Bulk Export</h3>
                        <p>Global logistics for refurbished supply.</p>
                        <div className="bento-tags">
                            <span className="bento-tag">UAE</span>
                            <span className="bento-tag">Africa</span>
                            <span className="bento-tag">Asia</span>
                        </div>
                    </div>
                </div>

                {/* 3. Standard Card */}
                <div className="bento-card">
                    <div className="bento-icon-box">
                        <i className="fas fa-tools"></i>
                    </div>
                    <span className="bg-number">03</span>
                    <div>
                        <h3>Expert Repair</h3>
                        <p>High-quality component level repairs.</p>
                        <div className="bento-tags">
                            <span className="bento-tag">Chip-level</span>
                            <span className="bento-tag">Screens</span>
                        </div>
                    </div>
                </div>

                {/* 4. Tall Card (Span 2 rows if content allows, or just standard) - Let's keep standard for uniform grid flow or specific spans */}
                <div className="bento-card">
                    <div className="bento-icon-box">
                        <i className="fas fa-exchange-alt"></i>
                    </div>
                    <span className="bg-number">04</span>
                    <div>
                        <h3>Trade-In</h3>
                        <p>Instant cash for old devices.</p>
                    </div>
                </div>

                {/* 5. Standard Card */}
                <div className="bento-card">
                    <div className="bento-icon-box">
                        <i className="fas fa-download"></i>
                    </div>
                    <span className="bg-number">05</span>
                    <div>
                        <h3>Setup & OS</h3>
                        <p>Full system installation service.</p>
                    </div>
                </div>

                {/* 6. Large Feature Card (Span 2 col) */}
                <div className="bento-card span-2-col" style={{ background: '#10b981', color: 'white' }}>
                    <div className="bento-icon-box" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                        <i className="fas fa-building"></i>
                    </div>
                    <span className="bg-number">06</span>
                    <div>
                        <h3>Corporate IT Solutions</h3>
                        <p>Strategic partnership for schools & companies with AMC support.</p>
                        <div className="bento-tags">
                            <span className="bento-tag" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>AMC</span>
                            <span className="bento-tag" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>On-site</span>
                        </div>
                    </div>
                </div>

                {/* 7. Standard Card */}
                <div className="bento-card">
                    <div className="bento-icon-box">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <span className="bg-number">07</span>
                    <div>
                        <h3>Warranty</h3>
                        <p>After-sales support included.</p>
                    </div>
                </div>

                {/* 8. Standard Card */}
                <div className="bento-card">
                    <div className="bento-icon-box">
                        <i className="fas fa-sliders-h"></i>
                    </div>
                    <span className="bg-number">08</span>
                    <div>
                        <h3>Custom Config</h3>
                        <p>Build to order specs.</p>
                    </div>
                </div>

                {/* CTA Full Width Tile */}
                <div className="cta-tile">
                    <div className="cta-content">
                        <h2>Ready to scale?</h2>
                        <p>Contact Bizz Co Hub for a personalized quote tailored to your business needs.</p>
                    </div>
                    <div className="cta-actions">
                        <Link href="/contact" className="btn-bento">
                            Get Quote
                        </Link>
                        <Link href="/products" className="btn-bento outline">
                            View Products
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
