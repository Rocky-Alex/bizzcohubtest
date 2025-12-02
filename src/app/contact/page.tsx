"use client";

import { useState } from "react";
import { SiteConfig } from "../../config/site";

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
        // Clear error when typing
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

        // Since we can't easily do the formsubmit.co redirect in SPA without page reload or fetch
        // We will submit via fetch or just allow the form to submit natively.
        // For this port, let's use the native form submission behavior but with validation first.
        // To do that, we need to trigger the native submit programmatically or remove e.preventDefault() if valid.
        // But we are in a React handler.
        // Let's use fetch to submit to formsubmit.co to avoid redirect, or just let it redirect.
        // The legacy code allowed redirect with `_next`.

        // We'll construct a hidden form and submit it, or just use the form ref.
        // For simplicity in this "broken" environment, let's just show success message.
        // In a real app, we'd use a server action or API route.

        // Simulating success for now as we don't have a backend.
        // If the user wants the actual formsubmit.co functionality, we should use a real form tag.
        // I'll use a real form tag and `e.target.submit()`? No, React event is synthetic.

        // Let's just use the form tag attributes and remove e.preventDefault() if valid.
        // But I called e.preventDefault() at the start.

        // I'll refactor to NOT prevent default if valid, but I need to validate first.
        // Standard pattern: e.preventDefault(), validate, if valid -> e.target.submit().

        const form = e.target as HTMLFormElement;
        form.submit();
        setSuccess(true);
    };

    return (
        <>
            {/* Contact Hero */}
            <section
                className="page-hero"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(/uploads/contactustittle.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="container">
                    <h1>
                        <i className="fas fa-envelope"></i> Contact Us
                    </h1>
                    <p>Get in touch with our team</p>
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
        </>
    );
}
