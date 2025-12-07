import Link from "next/link";
import "./services.css";

export default function ServicesPage() {
    return (
        <>
            {/* Services Hero */}
            {/* Services Hero */}
            <section style={{ padding: '100px 0 50px', textAlign: 'center' }}>
                <div className="container">
                    <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                        <i className="fas fa-cogs" style={{ marginRight: '1rem' }}></i>
                        OUR SERVICES
                    </h1>
                </div>
            </section>

            {/* LAPTOP REFURBISHING SERVICE */}
            <section id="refurbishing" className="service-detail-section">
                <div className="container">
                    <div className="service-detail">
                        <div className="service-detail-icon">
                            <i className="fas fa-laptop-medical"></i>
                        </div>
                        <h2>Laptop & Desktop Refurbishing</h2>
                        <p className="service-subtitle">
                            Professional Import, Refurbishment & Export Services
                        </p>

                        <div className="service-content">
                            <p>
                                At Bizz Co Hub, we specialize in importing high-quality used
                                laptops and desktops, professionally refurbishing them to
                                optimal performance standards, and exporting them to businesses
                                and individuals worldwide. Our commitment to quality and
                                sustainability makes us a trusted partner in the refurbished
                                technology market.
                            </p>

                            <h3>Our Refurbishing Process</h3>
                            <p>
                                Every device undergoes a rigorous refurbishment process to
                                ensure it meets our high-quality standards:
                            </p>

                            <div className="process-steps">
                                <div className="step-card">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-search"></i> Initial Inspection
                                        </h4>
                                        <p>
                                            Comprehensive hardware and software diagnostics to
                                            identify all issues and potential upgrades.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-tools"></i> Hardware Repair & Upgrade
                                        </h4>
                                        <p>
                                            Replace faulty components, upgrade RAM, install SSDs, and
                                            optimize hardware performance.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-broom"></i> Deep Cleaning
                                        </h4>
                                        <p>
                                            Professional cleaning of internal components, keyboard,
                                            screen, and exterior surfaces.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-download"></i> Software Installation
                                        </h4>
                                        <p>
                                            Fresh OS installation, essential drivers, and security
                                            updates for optimal performance.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">5</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-check-double"></i> Quality Testing
                                        </h4>
                                        <p>
                                            Extensive testing including stress tests, battery checks,
                                            and performance benchmarks.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">6</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-certificate"></i> Certification &
                                            Packaging
                                        </h4>
                                        <p>
                                            Final quality certification, secure packaging, and
                                            preparation for shipment.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3>What We Refurbish</h3>
                            <ul className="service-features">
                                <li>
                                    <i className="fas fa-check-circle"></i> Business Laptops (Dell,
                                    HP, Lenovo)
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i> Desktop Computers
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i> Workstations
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i> Gaming Laptops
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i> Ultrabooks
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i> All-in-One PCs
                                </li>
                            </ul>

                            <h3>Why Choose Our Refurbished Devices?</h3>
                            <div className="features-grid">
                                <div className="feature-box">
                                    <i className="fas fa-shield-alt"></i>
                                    <h4>Quality Assured</h4>
                                    <p>
                                        Each device passes strict quality control and performance
                                        testing
                                    </p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-money-bill-wave"></i>
                                    <h4>Cost Effective</h4>
                                    <p>Save up to 70% compared to brand new devices</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-leaf"></i>
                                    <h4>Eco-Friendly</h4>
                                    <p>Reduce e-waste and support sustainable technology</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-headset"></i>
                                    <h4>Support</h4>
                                    <p>Dedicated customer support and warranty options</p>
                                </div>
                            </div>

                            <div className="cta-box">
                                <h3>Ready to Get Quality Refurbished Technology?</h3>
                                <p>
                                    Browse our collection of professionally refurbished laptops
                                    and desktops
                                </p>
                                <Link href="/products/laptops" className="btn btn-primary">
                                    <i className="fas fa-laptop"></i> View Laptops
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LAPTOP REPAIR SERVICE */}
            <section id="repair" className="service-detail-section alt-bg">
                <div className="container">
                    <div className="service-detail">
                        <div className="service-detail-icon">
                            <i className="fas fa-wrench"></i>
                        </div>
                        <h2>Laptop Repairing & Service</h2>
                        <p className="service-subtitle">
                            Expert Repair Services for All Laptop Brands
                        </p>

                        <div className="service-content">
                            <p>
                                Our certified technicians provide professional laptop repair and
                                maintenance services for all major brands. Whether it's a hardware
                                failure, software issue, or performance problem, we diagnose and
                                fix it quickly and efficiently. We use only genuine or high-quality
                                compatible parts to ensure your laptop runs like new.
                            </p>

                            <h3>Our Repair Services</h3>
                            <ul className="service-features">
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Screen Replacement:</strong> Cracked, broken, or
                                    flickering screens repaired with quality LCD/LED panels
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Battery Replacement:</strong> Genuine battery
                                    replacements for extended laptop life
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Keyboard Repair:</strong> Individual key or complete
                                    keyboard replacement
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Motherboard Repair:</strong> Component-level repairs
                                    for power and logic issues
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Hard Drive/SSD Upgrade:</strong> Storage upgrades and
                                    data recovery services
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>RAM Upgrade:</strong> Memory upgrades for better
                                    performance
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Cooling System Repair:</strong> Fan replacement and
                                    thermal paste application
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Software Troubleshooting:</strong> OS installation,
                                    virus removal, and optimization
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Charging Port Repair:</strong> DC jack and charging
                                    circuit repairs
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Water Damage Repair:</strong> Professional cleaning
                                    and component restoration
                                </li>
                            </ul>

                            <h3>Our Diagnostic Process</h3>
                            <div className="process-steps">
                                <div className="step-card">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-clipboard-list"></i> Free
                                            Diagnosis
                                        </h4>
                                        <p>
                                            Comprehensive hardware and software diagnostics to
                                            identify the exact issue.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-file-invoice-dollar"></i> Quote
                                            & Approval
                                        </h4>
                                        <p>
                                            Transparent pricing with detailed quote before any
                                            repair work begins.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-tools"></i> Expert Repair
                                        </h4>
                                        <p>
                                            Certified technicians perform repairs using quality
                                            parts and proper tools.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-check-double"></i> Quality
                                            Testing
                                        </h4>
                                        <p>
                                            Thorough testing to ensure the repair is successful
                                            and everything works perfectly.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">5</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-box"></i> Safe Return
                                        </h4>
                                        <p>
                                            Your laptop is cleaned, packaged safely, and returned
                                            with warranty documentation.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3>Why Choose Our Repair Service?</h3>
                            <div className="features-grid">
                                <div className="feature-box">
                                    <i className="fas fa-user-check"></i>
                                    <h4>Certified Technicians</h4>
                                    <p>
                                        Experienced professionals trained in laptop repair and
                                        maintenance
                                    </p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-clock"></i>
                                    <h4>Quick Turnaround</h4>
                                    <p>Most repairs completed within 24-48 hours</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-shield-alt"></i>
                                    <h4>Warranty Included</h4>
                                    <p>Warranty on all repairs and parts</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-dollar-sign"></i>
                                    <h4>Competitive Pricing</h4>
                                    <p>Affordable rates with no hidden charges</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-tools"></i>
                                    <h4>Genuine Parts</h4>
                                    <p>Original or high-quality compatible parts used</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-laptop-house"></i>
                                    <h4>Pickup & Delivery</h4>
                                    <p>Convenient pickup and delivery service available</p>
                                </div>
                            </div>

                            <div className="cta-box">
                                <h3>Need Laptop Repair?</h3>
                                <p>
                                    Get your laptop diagnosed and repaired by our expert
                                    technicians today
                                </p>
                                <Link href="/contact" className="btn btn-primary">
                                    <i className="fas fa-phone"></i> Book Repair Service
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WEB DESIGN SERVICE */}
            <section id="webdesign" className="service-detail-section alt-bg">
                <div className="container">
                    <div className="service-detail">
                        <div className="service-detail-icon">
                            <i className="fas fa-code"></i>
                        </div>
                        <h2>Web Design & Development</h2>
                        <p className="service-subtitle">
                            Custom Websites for Modern Businesses
                        </p>

                        <div className="service-content">
                            <p>
                                We create stunning, responsive websites that help businesses
                                establish a strong online presence. From simple landing pages to
                                complex e-commerce platforms, our web design services are
                                tailored to meet your specific business needs and goals.
                            </p>

                            <h3>Our Web Design Services</h3>
                            <ul className="service-features">
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Business Websites:</strong> Professional corporate
                                    websites with modern design
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>E-Commerce Platforms:</strong> Full-featured online
                                    stores with payment integration
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Landing Pages:</strong> High-converting pages for
                                    marketing campaigns
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Portfolio Websites:</strong> Showcase your work with
                                    stunning visuals
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Blog & Content Sites:</strong> SEO-optimized content
                                    management systems
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>{" "}
                                    <strong>Custom Web Applications:</strong> Tailored solutions
                                    for unique business needs
                                </li>
                            </ul>

                            <h3>Our Approach</h3>
                            <div className="process-steps">
                                <div className="step-card">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-comments"></i> Discovery & Planning
                                        </h4>
                                        <p>
                                            Understanding your business goals, target audience, and
                                            project requirements.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-pencil-ruler"></i> Design & Prototyping
                                        </h4>
                                        <p>
                                            Creating wireframes, mockups, and interactive prototypes
                                            for your approval.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-code"></i> Development
                                        </h4>
                                        <p>
                                            Building your website with clean, modern code and best
                                            practices.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-vial"></i> Testing & QA
                                        </h4>
                                        <p>
                                            Rigorous testing across devices, browsers, and performance
                                            optimization.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">5</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-rocket"></i> Launch
                                        </h4>
                                        <p>
                                            Deploying your website and ensuring everything runs
                                            smoothly.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-card">
                                    <div className="step-number">6</div>
                                    <div className="step-content">
                                        <h4>
                                            <i className="fas fa-life-ring"></i> Support & Maintenance
                                        </h4>
                                        <p>
                                            Ongoing support, updates, and maintenance to keep your
                                            site running perfectly.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3>Technologies We Use</h3>
                            <div className="tech-stack">
                                <span className="tech-badge">
                                    <i className="fab fa-html5"></i> HTML5
                                </span>
                                <span className="tech-badge">
                                    <i className="fab fa-css3-alt"></i> CSS3
                                </span>
                                <span className="tech-badge">
                                    <i className="fab fa-js"></i> JavaScript
                                </span>
                                <span className="tech-badge">
                                    <i className="fab fa-react"></i> React
                                </span>
                                <span className="tech-badge">
                                    <i className="fab fa-node-js"></i> Node.js
                                </span>
                                <span className="tech-badge">
                                    <i className="fab fa-wordpress"></i> WordPress
                                </span>
                                <span className="tech-badge">
                                    <i className="fab fa-php"></i> PHP
                                </span>
                                <span className="tech-badge">
                                    <i className="fab fa-bootstrap"></i> Bootstrap
                                </span>
                            </div>

                            <h3>Website Features</h3>
                            <div className="features-grid">
                                <div className="feature-box">
                                    <i className="fas fa-mobile-alt"></i>
                                    <h4>Responsive Design</h4>
                                    <p>
                                        Perfect display on all devices - mobile, tablet, and desktop
                                    </p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-search"></i>
                                    <h4>SEO Optimized</h4>
                                    <p>Built with search engine optimization best practices</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-tachometer-alt"></i>
                                    <h4>Fast Loading</h4>
                                    <p>Optimized for speed and performance</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-lock"></i>
                                    <h4>Secure</h4>
                                    <p>SSL certificates and security best practices</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-edit"></i>
                                    <h4>Easy to Update</h4>
                                    <p>Content management system for easy editing</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-chart-line"></i>
                                    <h4>Analytics</h4>
                                    <p>Track your website performance and visitor data</p>
                                </div>
                            </div>

                            <div className="cta-box">
                                <h3>Ready to Build Your Online Presence?</h3>
                                <p>
                                    Let's discuss your project and create something amazing
                                    together
                                </p>
                                <Link href="/contact" className="btn btn-primary">
                                    <i className="fas fa-envelope"></i> Get in Touch
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ADDITIONAL SERVICES SECTION */}
            <section id="more-services" className="services-section">
                <div className="container">
                    <h2 className="section-title">More Services</h2>
                    <p className="section-description">
                        Comprehensive technology solutions to support your business growth
                    </p>

                    <div className="services-grid">
                        <div className="service-card">
                            <div className="service-icon">
                                <i className="fas fa-shopping-cart"></i>
                            </div>
                            <h3>Computer Accessories</h3>
                            <p>
                                Wide range of quality computer accessories including keyboards,
                                mice, monitors, cables, and more to complete your setup.
                            </p>
                            <Link href="/products/accessories" className="service-link">
                                Browse Accessories <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="service-card">
                            <div className="service-icon">
                                <i className="fas fa-shipping-fast"></i>
                            </div>
                            <h3>International Shipping</h3>
                            <p>
                                Safe and secure shipping of refurbished devices worldwide. We
                                handle all customs and logistics for hassle-free delivery.
                            </p>
                            <Link href="/contact" className="service-link">
                                Contact Us <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="service-card">
                            <div className="service-icon">
                                <i className="fas fa-handshake"></i>
                            </div>
                            <h3>Bulk Orders</h3>
                            <p>
                                Special pricing for businesses and organizations requiring
                                multiple devices. Contact us for custom quotes and solutions.
                            </p>
                            <Link href="/contact" className="service-link">
                                Get Quote <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
