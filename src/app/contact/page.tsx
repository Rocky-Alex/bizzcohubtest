"use client";

import { useState } from "react";
import { SiteConfig } from "../../config/site";
import "./contact.css";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name || formData.name.length < 3) {
            newErrors.name = "Name must be at least 3 characters long";
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailPattern.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }
        const phonePattern = /^[\d\s\-\+\(\)]{10,}$/;
        if (!formData.phone || !phonePattern.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number";
        }
        if (!formData.subject || formData.subject.length < 5) {
            newErrors.subject = "Subject must be at least 5 characters long";
        }
        if (!formData.message || formData.message.length < 20) {
            newErrors.message = "Message must be at least 20 characters long";
        }
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const form = e.target as HTMLFormElement;
        form.submit();
        setSuccess(true);
    };

    return (
        <>
            {/* Contact Hero */}
            {/* Contact Hero */}
            <section style={{ padding: '100px 0 50px', textAlign: 'center' }}>
                <div className="container">
                    <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                        <i className="fas fa-envelope" style={{ marginRight: '1rem' }}></i>
                        CONTACT US
                    </h1>
                    <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#666' }}>Get in touch with our team</p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section">
                <div className="container">
                    <div className="contact-grid">
                        {/* Contact Information */}
                        <div className="contact-info">
                            <h2>Get In Touch</h2>
                            <p>
                                Have questions about our products or services? We're here to
                                help!
                            </p>

                            <div className="contact-details" id="contactDetails">
                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    <div className="contact-text">
                                        <h3>Address</h3>
                                        <p>
                                            {SiteConfig.contact.address}
                                            <br />
                                            {SiteConfig.contact.city}, {SiteConfig.contact.country}
                                        </p>
                                    </div>
                                </div>

                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <i className="fas fa-phone"></i>
                                    </div>
                                    <div className="contact-text">
                                        <h3>Phone</h3>
                                        <p>
                                            <a href={`tel:${SiteConfig.contact.phone}`}>
                                                {SiteConfig.contact.phone}
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <i className="fas fa-envelope"></i>
                                    </div>
                                    <div className="contact-text">
                                        <h3>Email</h3>
                                        <p>
                                            <a href={`mailto:${SiteConfig.contact.email}`}>
                                                {SiteConfig.contact.email}
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <i className="fas fa-clock"></i>
                                    </div>
                                    <div className="contact-text">
                                        <h3>Business Hours</h3>
                                        <p>
                                            {SiteConfig.contact.businessHours}
                                            <br />
                                            Sunday: Closed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-wrapper">
                            <h2>Send Us a Message</h2>
                            <form
                                id="contactForm"
                                action="https://formsubmit.co/rishadpnpm@gmail.com"
                                method="POST"
                                className="contact-form"
                                onSubmit={handleSubmit}
                            >
                                {/* FormSubmit Configuration */}
                                <input
                                    type="hidden"
                                    name="_subject"
                                    value="New Contact Form Submission - Bizz Co Hub"
                                />
                                <input type="hidden" name="_captcha" value="false" />
                                <input type="hidden" name="_template" value="table" />
                                <input
                                    type="hidden"
                                    name="_next"
                                    value="https://yourdomain.com/contact.html?success=true"
                                />

                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                    {errors.name && (
                                        <span className="error-message" style={{ display: "block" }}>
                                            {errors.name}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && (
                                        <span className="error-message" style={{ display: "block" }}>
                                            {errors.email}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number *</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        required
                                        placeholder="Enter your phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    {errors.phone && (
                                        <span className="error-message" style={{ display: "block" }}>
                                            {errors.phone}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">Subject *</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        required
                                        placeholder="Enter subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    />
                                    {errors.subject && (
                                        <span className="error-message" style={{ display: "block" }}>
                                            {errors.subject}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        required
                                        placeholder="Enter your message"
                                        value={formData.message}
                                        onChange={handleChange}
                                    ></textarea>
                                    {errors.message && (
                                        <span className="error-message" style={{ display: "block" }}>
                                            {errors.message}
                                        </span>
                                    )}
                                </div>

                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-paper-plane"></i> Send Message
                                </button>
                            </form>

                            {/* Success Message */}
                            {success && (
                                <div
                                    id="formSuccess"
                                    className="success-message"
                                    style={{ display: "flex" }}
                                >
                                    <i className="fas fa-check-circle"></i> Thank you! Your message
                                    has been sent successfully. We'll get back to you soon.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="map-section">
                        <h2>Our Location</h2>
                        <div className="map-container" id="mapContainer">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3606.5600085384403!2d55.405920086670584!3d25.318982769099087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjXCsDE5JzA4LjMiTiA1NcKwMjQnMzguOSJF!5e0!3m2!1sen!2sus!4v1763952639271!5m2!1sen!2sus"
                                width="100%"
                                height="400"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section - Mission & Vision */}
            <section className="mission-vision-section">
                <div className="container">
                    <div className="section-header-about">
                        <span className="subtitle">Who We Are</span>
                        <h2>About Bizz Co Hub</h2>
                        <p>Your premier destination for high-quality refurbished electronics and professional IT services.</p>
                    </div>
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
        </>
    );
}
