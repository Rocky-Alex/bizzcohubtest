import Link from "next/link";
import "./styles/privacy.css";

export default function PrivacyPolicyPage() {
    return (
        <div className="legal-page">
            <section className="legal-hero">
                <div className="container">
                    <h1>
                        <i className="fas fa-shield-alt"></i> Privacy Policy
                    </h1>
                    <p>Last updated: December 6, 2025</p>
                </div>
            </section>

            <section className="legal-content">
                <div className="container">
                    <div className="legal-card">
                        <h2>1. Information We Collect</h2>
                        <p>
                            At Bizz Co Hub, we collect information that you provide directly to us, including:
                        </p>
                        <ul>
                            <li>Name, email address, and contact information</li>
                            <li>Shipping and billing addresses</li>
                            <li>Payment information (processed securely through third-party providers)</li>
                            <li>Communication preferences</li>
                            <li>Product inquiries and purchase history</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Process and fulfill your orders</li>
                            <li>Communicate with you about your orders and inquiries</li>
                            <li>Send you promotional materials (with your consent)</li>
                            <li>Improve our products and services</li>
                            <li>Prevent fraud and enhance security</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>3. Information Sharing</h2>
                        <p>
                            We do not sell your personal information. We may share your information with:
                        </p>
                        <ul>
                            <li>Service providers who assist in our operations (shipping, payment processing)</li>
                            <li>Law enforcement when required by law</li>
                            <li>Business partners with your explicit consent</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal
                            information against unauthorized access, alteration, disclosure, or destruction. This includes:
                        </p>
                        <ul>
                            <li>Encryption of sensitive data</li>
                            <li>Secure server infrastructure</li>
                            <li>Regular security audits</li>
                            <li>Limited access to personal information</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>5. Cookies and Tracking</h2>
                        <p>
                            We use cookies and similar tracking technologies to enhance your browsing experience,
                            analyze site traffic, and understand user preferences. You can control cookie settings
                            through your browser preferences.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Object to data processing</li>
                            <li>Data portability</li>
                        </ul>
                    </div>

                    <div className="legal-card">
                        <h2>7. Children's Privacy</h2>
                        <p>
                            Our services are not directed to individuals under the age of 18. We do not knowingly
                            collect personal information from children.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>8. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes
                            by posting the new Privacy Policy on this page and updating the "Last updated" date.
                        </p>
                    </div>

                    <div className="legal-card">
                        <h2>9. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>
                        <ul>
                            <li>Email: privacy@bizzcohub.com</li>
                            <li>Phone: +971 56 706 4457</li>
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
