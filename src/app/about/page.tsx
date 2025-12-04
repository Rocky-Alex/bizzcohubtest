"use client";

import "./about.css";

export default function AboutPage() {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-bg"></div>
                <div className="container">
                    <div className="about-hero-content fade-in-up">
                        <span className="subtitle">Who We Are</span>
                        <h1>Empowering Your Digital Journey</h1>
                        <p>Bizz Co Hub is your premier destination for high-quality refurbished electronics and professional IT services. We bridge the gap between affordability and premium technology.</p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="mission-vision-section">
                <div className="container">
                    <div className="mission-grid">
                        <div className="mission-card">
                            <div className="icon-box">
                                <i className="fas fa-bullseye"></i>
                            </div>
                            <h3>Our Mission</h3>
                            <p>To provide accessible, high-quality technology solutions that empower individuals and businesses to achieve their full potential while promoting sustainability through circular economy practices.</p>
                        </div>
                        <div className="mission-card">
                            <div className="icon-box">
                                <i className="fas fa-eye"></i>
                            </div>
                            <h3>Our Vision</h3>
                            <p>To be the global leader in refurbished electronics and IT services, setting new standards for quality, reliability, and customer satisfaction in the tech industry.</p>
                        </div>
                        <div className="mission-card">
                            <div className="icon-box">
                                <i className="fas fa-gem"></i>
                            </div>
                            <h3>Our Values</h3>
                            <p>Integrity, Innovation, Quality, and Sustainability are at the core of everything we do. We believe in building lasting relationships with our customers through trust and excellence.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section">
                <div className="container">
                    <div className="story-content">
                        <div className="story-text">
                            <h2>Our Story</h2>
                            <p>Founded with a passion for technology and a commitment to sustainability, Bizz Co Hub started as a small team of tech enthusiasts who saw an opportunity to make premium technology more accessible.</p>
                            <p>We realized that millions of high-quality devices were being discarded simply because they were "used," while many people struggled to afford the latest tech. We decided to change that.</p>
                            <p>Today, we have grown into a comprehensive technology hub, offering not just refurbished devices but also expert repair services, IT consulting, and web development solutions. Our journey is driven by our customers' success and our planet's well-being.</p>
                        </div>
                        <div className="story-image">
                            <div className="image-wrapper">
                                {/* Placeholder for story image */}
                                <div className="placeholder-image">
                                    <i className="fas fa-history"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-number">5000+</span>
                            <span className="stat-label">Happy Customers</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">10k+</span>
                            <span className="stat-label">Devices Refurbished</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">50+</span>
                            <span className="stat-label">Expert Team Members</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">99%</span>
                            <span className="stat-label">Satisfaction Rate</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
