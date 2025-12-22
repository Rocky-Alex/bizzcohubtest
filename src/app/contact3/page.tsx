"use client";

import Link from "next/link";
import "./styles/contact3.css";

export default function Contact3Page() {
    return (
        <div className="contact3-wrapper">
            <div className="contact3-spacer"></div>

            {/* Header */}
            <header className="contact3-header">
                <h1>Let's Connect.</h1>
                <p>We're here to help with your technology needs, bulk inquiries, or technical support questions.</p>
            </header>

            {/* Main Content */}
            <main className="contact3-main">

                {/* Info Column */}
                <section className="contact3-info">
                    <h2>Reach Out Directly.</h2>

                    <div className="contact3-info-grid">
                        <div className="c3-info-block">
                            <h4>Inquiries</h4>
                            <p><a href="mailto:info@bizzcohub.com">info@bizzcohub.com</a></p>
                        </div>

                        <div className="c3-info-block">
                            <h4>WhatsApp & Call</h4>
                            <p><a href="tel:+971501234567">+971 50 123 4567</a></p>
                        </div>

                        <div className="c3-info-block">
                            <h4>Visit Our Hub</h4>
                            <p>Dubai Silicon Oasis,<br />Techno Hub 2, UAE</p>
                        </div>
                    </div>

                    <div className="c3-socials">
                        <a href="#" className="c3-social-link"><i className="fab fa-linkedin-in"></i></a>
                        <a href="#" className="c3-social-link"><i className="fab fa-instagram"></i></a>
                        <a href="#" className="c3-social-link"><i className="fab fa-x-twitter"></i></a>
                        <a href="#" className="c3-social-link"><i className="fab fa-facebook-f"></i></a>
                    </div>
                </section>

                {/* Form Column */}
                <section className="contact3-form-container">
                    <form className="contact3-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="c3-field-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                className="c3-input"
                                placeholder="Your name"
                                required
                            />
                        </div>

                        <div className="c3-field-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className="c3-input"
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <div className="c3-field-group">
                            <label htmlFor="purpose">Purpose of Contact</label>
                            <select id="purpose" className="c3-input">
                                <option value="general">General Inquiry</option>
                                <option value="bulk">Bulk Order Request</option>
                                <option value="repair">Technical Support</option>
                                <option value="partnership">Partnership Opportunity</option>
                            </select>
                        </div>

                        <div className="c3-field-group">
                            <label htmlFor="message">How can we help?</label>
                            <textarea
                                id="message"
                                className="c3-input c3-textarea"
                                placeholder="Describe your requirement in detail..."
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="c3-submit-btn">
                            Send Message
                        </button>
                    </form>
                </section>

            </main>
        </div>
    );
}
