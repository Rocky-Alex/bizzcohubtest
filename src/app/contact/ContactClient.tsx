"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import "./styles/contact2.css";

export default function ContactClient() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        email: "",
        category: "Product Inquiry",
        message: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to send message');

            toast.success("Message sent successfully! We'll get back to you soon.");
            setFormData({
                name: "",
                company: "",
                email: "",
                category: "Product Inquiry",
                message: ""
            });
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error(error.message || "Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="contact2-wrapper">
            <div className="c2-container">

                {/* Header */}
                <div className="contact2-header">
                    <h1>Let&apos;s Start a Conversation.</h1>
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
                            <p style={{ marginTop: '0.5rem', color: '#3b82f6' }}>bizzcohubllc@gmail.com</p>
                        </div>

                        {/* Box 2 */}
                        <div className="c2-info-card">
                            <div className="c2-icon-circle" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                                <i className="fas fa-handshake"></i>
                            </div>
                            <h3>Sales & Bulk</h3>
                            <p>Request quotes for bulk orders or export consignments.</p>
                            <p style={{ marginTop: '0.5rem', color: '#10b981' }}>bizzcohubllc@gmail.com</p>
                        </div>

                        {/* Box 3 - Location */}
                        <div className="c2-info-card c2-map-card">
                            <div className="c2-icon-circle" style={{ position: 'relative', zIndex: 2, background: 'white', color: 'black' }}>
                                <i className="fas fa-location-arrow"></i>
                            </div>
                            <h3>Visit HQ</h3>
                            <p style={{ position: 'relative', zIndex: 2 }}>
                                Sharjah Media City (Shams), Al Messaned, <br /> Al Bataeh, Sharjah, United Arab Emirates
                            </p>
                        </div>
                    </div>

                    {/* Right Form */}
                    <div className="c2-form-card">
                        <div className="c2-form-header">
                            <h2>Send a Request</h2>
                            <p style={{ color: '#94a3b8' }}>Fill out the form below and we will get back to you shortly.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="c2-input-grid">
                                <div className="c2-group">
                                    <label className="c2-label">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="c2-input"
                                        placeholder="Your Name"
                                        required
                                    />
                                </div>
                                <div className="c2-group">
                                    <label className="c2-label">Company</label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        className="c2-input"
                                        placeholder="Company Name"
                                    />
                                </div>
                                <div className="c2-group full">
                                    <label className="c2-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="c2-input"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                                <div className="c2-group full">
                                    <label className="c2-label">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="c2-input"
                                    >
                                        <option value="Product Inquiry">Product Inquiry</option>
                                        <option value="Bulk/Wholesale">Bulk/Wholesale</option>
                                        <option value="Technical Issue">Technical Issue</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="c2-group full">
                                    <label className="c2-label">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="c2-input c2-textarea"
                                        placeholder="Tell us more about your needs..."
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="c2-submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Submit Request'} <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'} ml-2`}></i>
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            {/* About Section */}
            <div className="c2-about-section">
                <div className="c2-container">
                    <div className="c2-about-content">
                        <h2>About Us</h2>
                        <p>
                            Welcome to Bizz Co Hub, your premier destination for high-quality electronics and tech solutions.
                            Established with a vision to bridge the gap between premium technology and affordability, we specialize
                            in offering a curated selection of mobile phones, renewed laptops, desktops, gaming devices, and accessories.
                        </p>
                        <p>
                            Our mission is to empower individuals and businesses by providing reliable, high-performance devices
                            at competitive prices. Whether you are a student, a creative professional, or an enterprise looking
                            to upgrade your infrastructure, Bizz Co Hub is committed to delivering excellence with every product.
                        </p>
                        <div className="c2-about-stats">
                            <div className="stat-item">
                                <span className="stat-number">100+</span>
                                <span className="stat-label">Happy Customers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">1K+</span>
                                <span className="stat-label">Products Sold</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">24/7</span>
                                <span className="stat-label">Expert Support</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
