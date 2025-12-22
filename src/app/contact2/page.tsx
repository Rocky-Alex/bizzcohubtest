"use client";

import Link from "next/link";
import "./styles/contact2.css";

export default function Contact2Page() {
    return (
        <div className="contact2-wrapper">
            <div className="c2-container">

                {/* Header */}
                <div className="contact2-header">
                    <h1>Let's Start a Conversation.</h1>
                    <p>Connect with our expert team for inquiries, support, or partnership opportunities.</p>
                </div>

                <div className="contact2-grid">

                    {/* Left Stack */}
                    <div className="c2-info-stack">
                        {/* Box 1 */}
                        <div className="c2-info-card">
                            <div className="c2-icon-circle">
                                <i className="fas fa-headset"></i>
                            </div>
                            <h3>Support Center</h3>
                            <p>Technical assistance available 24/7 for our enterprise partners.</p>
                            <p style={{ marginTop: '0.5rem', color: '#3b82f6' }}>support@bizzcohub.com</p>
                        </div>

                        {/* Box 2 */}
                        <div className="c2-info-card">
                            <div className="c2-icon-circle" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                                <i className="fas fa-handshake"></i>
                            </div>
                            <h3>Sales & Bulk</h3>
                            <p>Request quotes for bulk orders or export consignments.</p>
                            <p style={{ marginTop: '0.5rem', color: '#10b981' }}>sales@bizzcohub.com</p>
                        </div>

                        {/* Box 3 - Location */}
                        <div className="c2-info-card c2-map-card">
                            <div className="c2-icon-circle" style={{ position: 'relative', zIndex: 2, background: 'white', color: 'black' }}>
                                <i className="fas fa-location-arrow"></i>
                            </div>
                            <h3>Visit HQ</h3>
                            <p style={{ position: 'relative', zIndex: 2 }}>
                                Dubai Silicon Oasis,<br />
                                Techno Hub 2, Office 101<br />
                                UAE
                            </p>
                        </div>
                    </div>

                    {/* Right Form */}
                    <div className="c2-form-card">
                        <div className="c2-form-header">
                            <h2>Send a Request</h2>
                            <p style={{ color: '#94a3b8' }}>Fill out the form below and we will get back to you shortly.</p>
                        </div>

                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="c2-input-grid">
                                <div className="c2-group">
                                    <label className="c2-label">Name</label>
                                    <input type="text" className="c2-input" placeholder="Your Name" />
                                </div>
                                <div className="c2-group">
                                    <label className="c2-label">Company</label>
                                    <input type="text" className="c2-input" placeholder="Company Name" />
                                </div>
                                <div className="c2-group full">
                                    <label className="c2-label">Email</label>
                                    <input type="email" className="c2-input" placeholder="name@example.com" />
                                </div>
                                <div className="c2-group full">
                                    <label className="c2-label">Category</label>
                                    <select className="c2-input">
                                        <option>Product Inquiry</option>
                                        <option>Bulk/Wholesale</option>
                                        <option>Technical Issue</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="c2-group full">
                                    <label className="c2-label">Message</label>
                                    <textarea className="c2-input c2-textarea" placeholder="Tell us more about your needs..."></textarea>
                                </div>
                            </div>
                            <button type="submit" className="c2-submit">
                                Submit Request <i className="fas fa-paper-plane ml-2"></i>
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
