import Link from "next/link";
import "../privacy/privacy.css";

export default function TermsOfServicePage() {
    return (
        <div className="legal-page">
            <section className="legal-hero">
                <div className="container">
                    <h1>
                        <i className="fas fa-file-contract"></i> Terms of Service
                    </h1>
                    <p>Last updated: December 6, 2025</p>
                </div>
            </section>

            <section className="legal-content">
                <div className="container">
                    <div className="legal-card">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Bizz Co Hub's website and services, you accept and agree to be bound
                            by the terms and provisions of this agreement. If you do not agree to these terms, please do
                            not use our services.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>2. Products and Services</h2>
                        <p>
                            Bizz Co Hub specializes in refurbished laptops and technology accessories. All products are:
                        </p>
                        <ul>
                            <li>Professionally refurbished and tested</li>
                            <li>Sold with accurate descriptions and specifications</li>
                            <li>Subject to availability</li>
                            <li>Covered by our quality guarantee</li>
                        </ul>
                        <p>
                            We reserve the right to modify product offerings, prices, and specifications without prior notice.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>3. Pricing and Payment</h2>
                        <p>
                            All prices are listed in AED (United Arab Emirates Dirham) unless otherwise stated. We accept:
                        </p>
                        <ul>
                            <li>Credit and debit cards</li>
                            <li>Bank transfers</li>
                            <li>Cash on delivery (where available)</li>
                            <li>Digital payment methods</li>
                        </ul>
                        <p>
                            Prices are subject to change without notice. The price applicable to your order will be the
                            price displayed at the time of purchase.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>4. Orders and Fulfillment</h2>
                        <p>
                            When you place an order with us:
                        </p>
                        <ul>
                            <li>You receive an order confirmation via email or WhatsApp</li>
                            <li>We reserve the right to refuse or cancel any order</li>
                            <li>Orders are processed within 24-48 hours</li>
                            <li>Delivery times vary based on location</li>
                            <li>You are responsible for providing accurate shipping information</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>5. Shipping and Delivery</h2>
                        <p>
                            We offer shipping services across the UAE and internationally (selected regions):
                        </p>
                        <ul>
                            <li>Standard shipping: 3-5 business days</li>
                            <li>Express shipping: 1-2 business days (where available)</li>
                            <li>International shipping: 7-14 business days</li>
                            <li>Tracking information provided for all orders</li>
                        </ul>
                        <p>
                            Shipping costs are calculated at checkout based on destination and order value.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>6. Returns and Refunds</h2>
                        <p>
                            We offer a 30-day return policy on most products:
                        </p>
                        <ul>
                            <li>Products must be in original condition with all accessories</li>
                            <li>Return shipping costs may apply</li>
                            <li>Refunds processed within 7-10 business days</li>
                            <li>Certain products may have different return policies</li>
                            <li>Damaged or defective items can be returned within 7 days</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>7. Warranty and Guarantees</h2>
                        <p>
                            All refurbished products come with:
                        </p>
                        <ul>
                            <li>Minimum 90-day warranty (varies by product)</li>
                            <li>Coverage for manufacturing defects</li>
                            <li>Free technical support</li>
                            <li>Repair or replacement options</li>
                        </ul>
                        <p>
                            Warranty does not cover damage from misuse, accidents, or unauthorized modifications.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>8. User Conduct</h2>
                        <p>
                            When using our services, you agree not to:
                        </p>
                        <ul>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Transmit harmful code or malware</li>
                            <li>Engage in fraudulent activities</li>
                            <li>Harass or harm other users</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>9. Intellectual Property</h2>
                        <p>
                            All content on this website, including text, graphics, logos, images, and software, is the
                            property of Bizz Co Hub and protected by copyright and trademark laws. Unauthorized use is
                            prohibited.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>10. Limitation of Liability</h2>
                        <p>
                            Bizz Co Hub shall not be liable for:
                        </p>
                        <ul>
                            <li>Indirect, incidental, or consequential damages</li>
                            <li>Loss of data or profits</li>
                            <li>Service interruptions or delays</li>
                            <li>Third-party actions or content</li>
                        </ul>
                        <p>
                            Our total liability shall not exceed the amount paid for the product or service in question.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>11. Dispute Resolution</h2>
                        <p>
                            Any disputes arising from these terms shall be resolved through:
                        </p>
                        <ul>
                            <li>Good faith negotiation</li>
                            <li>Mediation (if negotiation fails)</li>
                            <li>Arbitration in Dubai, UAE</li>
                            <li>Governed by UAE laws</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>12. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Changes will be effective immediately
                            upon posting. Continued use of our services constitutes acceptance of modified terms.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>13. Contact Information</h2>
                        <p>
                            For questions about these Terms of Service, please contact us:
                        </p>
                        <ul>
                            <li>Email: support@bizzcohub.com</li>
                            <li>Phone: +971 56 706 4457</li>
                            <li>WhatsApp: +971 56 706 4457</li>
                            <li>Address: Dubai, United Arab Emirates</li>
                        </ul>
                    </div>

                    <div className="legal-footer">
                        <Link href="/" className="btn-back">
                            <i className="fas fa-arrow-left"></i> Back to Home
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
