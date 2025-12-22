"use client";

import Link from "next/link";
import "./styles/service6.css";

export default function Service6Page() {
    return (
        <div className="service6-wrapper">
            <div className="s6-container">
                <header className="s6-hero">
                    <span className="s6-label">Our Capabilities</span>
                    <h1>Designed for Performance,<br />Built for Scale.</h1>
                    <p>We combine technical expertise with global logistics to deliver end-to-end IT solutions for individuals and enterprises.</p>
                </header>

                <div className="s6-list">

                    {/* 1 */}
                    <div className="s6-item">
                        <span className="s6-num">01</span>
                        <div className="s6-title-group">
                            <div className="s6-icon"><i className="fas fa-certificate"></i></div>
                            <h3>Refurbished Devices</h3>
                        </div>
                        <div className="s6-desc">
                            Certified laptops and desktops optimized for performance. 30+ point quality pass.
                            <div className="s6-tags">
                                <span className="s6-tag">Students</span>
                                <span className="s6-tag">Office</span>
                                <span className="s6-tag">Export</span>
                            </div>
                        </div>
                        <div className="s6-footer">View Inventory &rarr;</div>
                    </div>

                    {/* 2 */}
                    <div className="s6-item">
                        <span className="s6-num">02</span>
                        <div className="s6-title-group">
                            <div className="s6-icon"><i className="fas fa-globe-asia"></i></div>
                            <h3>Global Export</h3>
                        </div>
                        <div className="s6-desc">
                            Bulk supply chain management for international markets including Asia and Africa.
                            <div className="s6-tags">
                                <span className="s6-tag">Logistics</span>
                                <span className="s6-tag">Customs</span>
                                <span className="s6-tag">Wholesale</span>
                            </div>
                        </div>
                        <div className="s6-footer">Learn More &rarr;</div>
                    </div>

                    {/* 3 */}
                    <div className="s6-item">
                        <span className="s6-num">03</span>
                        <div className="s6-title-group">
                            <div className="s6-icon"><i className="fas fa-microchip"></i></div>
                            <h3>Expert Repair</h3>
                        </div>
                        <div className="s6-desc">
                            Precision component-level repair services with guaranteed turnarounds.
                        </div>
                        <div className="s6-footer">Book Service &rarr;</div>
                    </div>

                    {/* 4 */}
                    <div className="s6-item">
                        <span className="s6-num">04</span>
                        <div className="s6-title-group">
                            <div className="s6-icon"><i className="fas fa-coins"></i></div>
                            <h3>Buyback Program</h3>
                        </div>
                        <div className="s6-desc">
                            Instant valuation and trade-in for legacy IT assets and corporate lots.
                        </div>
                        <div className="s6-footer">Get Quote &rarr;</div>
                    </div>

                    {/* 5 */}
                    <div className="s6-item">
                        <span className="s6-num">05</span>
                        <div className="s6-title-group">
                            <div className="s6-icon"><i className="fas fa-server"></i></div>
                            <h3>System Setup</h3>
                        </div>
                        <div className="s6-desc">
                            Comprehensive OS installation, driver configuration, and software deployment.
                        </div>
                        <div className="s6-footer">Details &rarr;</div>
                    </div>

                    {/* 6 */}
                    <div className="s6-item">
                        <span className="s6-num">06</span>
                        <div className="s6-title-group">
                            <div className="s6-icon"><i className="fas fa-building"></i></div>
                            <h3>Corporate Solutions</h3>
                        </div>
                        <div className="s6-desc">
                            Strategic IT partnerships, AMC contracts, and on-site support for institutions.
                            <div className="s6-tags">
                                <span className="s6-tag">Education</span>
                                <span className="s6-tag">Enterprise</span>
                                <span className="s6-tag">AMC</span>
                            </div>
                        </div>
                        <div className="s6-footer">Partner With Us &rarr;</div>
                    </div>

                </div>

                <div className="s6-cta">
                    <h2>Ready to get started?</h2>
                    <Link href="/contact" className="s6-btn">
                        Contact Sales
                    </Link>
                </div>
            </div>
        </div>
    );
}
