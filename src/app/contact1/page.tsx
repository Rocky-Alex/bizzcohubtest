"use client";

import Link from "next/link";
import "./styles/contact1.css";

export default function Contact1Page() {
    return (
        <div className="contact1-wrapper">
            {/* Hero Section */}
            <section className="contact1-hero">
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1>Get in <span style={{ color: '#4079ff' }}>Touch.</span></h1>
                    <p>Have a question about our bulk supply or need technical support?
                        Our team is ready to assist you.</p>
                </div>
            </section>

            {/* Overlapping Card Container */}
            <div className="contact1-container">
                <div className="contact1-card">

                    {/* Left Side: Info */}
                    <div className="contact1-info">
                        <div>
                            <h3>Contact Information</h3>
                            <div className="info-list">
                                <div className="info-item">
                                    <div className="info-icon">
                                        <i className="fas fa-phone-alt"></i>
                                    </div>
                                    <div className="info-content">
                                        <h4>Phone</h4>
                                        <p>+971 50 123 4567</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <i className="fas fa-envelope"></i>
                                    </div>
                                    <div className="info-content">
                                        <h4>Email</h4>
                                        <p>info@bizzcohub.com</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    <div className="info-content">
                                        <h4>Headquarters</h4>
                                        <p>Dubai Silicon Oasis, UAE</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="social-links">
                            <a href="#" className="social-btn"><i className="fab fa-linkedin-in"></i></a>
                            <a href="#" className="social-btn"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="social-btn"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="social-btn"><i className="fab fa-whatsapp"></i></a>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="contact1-form-box">
                        <h2>Send us a Message</h2>
                        <p>We usually respond within 24 hours.</p>

                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input type="text" className="form-input" placeholder="John" />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input type="text" className="form-input" placeholder="Doe" />
                                </div>
                                <div className="form-group full">
                                    <label>Email Address</label>
                                    <input type="email" className="form-input" placeholder="john@company.com" />
                                </div>
                                <div className="form-group full">
                                    <label>Subject</label>
                                    <select className="form-input">
                                        <option>General Inquiry</option>
                                        <option>Bulk Order Quote</option>
                                        <option>Technical Support</option>
                                        <option>Partnership</option>
                                    </select>
                                </div>
                                <div className="form-group full">
                                    <label>Message</label>
                                    <textarea className="form-input" placeholder="How can we help you?"></textarea>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn">
                                <i className="fas fa-paper-plane"></i> Send Message
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
