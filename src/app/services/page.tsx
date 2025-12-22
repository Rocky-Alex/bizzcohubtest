import Link from "next/link";
import "./styles/services.css";

export default function ServicesPage() {
    const services = [
        {
            id: 1,
            title: "Premium Refurbished Laptops & Desktops",
            icon: "fa-laptop",
            description: "Certified, performance-optimized devices for every need.",
            details: [
                "Students",
                "Office employees",
                "Freelancers",
                "Gamers",
                "Export buyers"
            ],
            footer: "Each device goes through 30+ quality checks.",
            color: "blue"
        },
        {
            id: 2,
            title: "Bulk Supply & Export Services",
            icon: "fa-shipping-fast",
            description: "We supply large quantities of used/refurbished laptops globally.",
            details: [
                "India",
                "Vietnam",
                "Africa",
                "Pakistan",
                "Singapore",
                "UAE local market"
            ],
            footer: "Includes export packing, invoice, testing videos, and logistics support.",
            color: "green"
        },
        {
            id: 3,
            title: "Laptop Repair & Upgrade",
            icon: "fa-tools",
            description: "Professional repair with high-quality parts.",
            details: [
                "SSD upgrades",
                "RAM upgrades",
                "Battery replacement",
                "Keyboard/screen repair",
                "Motherboard chip-level service"
            ],
            footer: "Fast and affordable.",
            color: "orange"
        },
        {
            id: 4,
            title: "Buyback & Trade-In Program",
            icon: "fa-exchange-alt",
            description: "We buy used laptops, corporate IT assets, ruined or old devices.",
            details: [
                "Used laptops",
                "Corporate IT assets",
                "Damaged or old devices",
                "Bulk lots from companies"
            ],
            footer: "Get instant cash or device exchange.",
            color: "purple"
        },
        {
            id: 5,
            title: "Software Installation & System Setup",
            icon: "fa-download",
            description: "Complete system setup so you are ready to go.",
            details: [
                "Windows installation",
                "Driver setup",
                "MS Office",
                "Antivirus",
                "Data backup & recovery"
            ],
            footer: "Everything set and ready to use.",
            color: "red"
        },
        {
            id: 6,
            title: "Corporate IT Solutions",
            icon: "fa-building",
            description: "Reliable, long-term IT partner for companies and schools.",
            details: [
                "Large batch supply",
                "Annual Maintenance Contracts (AMC)",
                "Device health reports",
                "On-site support"
            ],
            footer: "Reliable, long-term IT partner.",
            color: "teal"
        },
        {
            id: 7,
            title: "Warranty & After-Sales Support",
            icon: "fa-shield-alt",
            description: "Peace of mind with every purchase.",
            details: [
                "Warranty",
                "Easy replacement",
                "Lifetime technical guidance"
            ],
            footer: "Zero-hassle service.",
            color: "indigo"
        },
        {
            id: 8,
            title: "Customized Laptop Configurations",
            icon: "fa-sliders-h",
            description: "Build your machine exactly how you need it.",
            details: [
                "RAM",
                "SSD",
                "Processor",
                "Software",
                "Accessories"
            ],
            footer: "Tailored performance for your specific needs.",
            color: "cyan"
        }
    ];

    return (
        <div className="services-page-wrapper">
            {/* Hero Section */}
            <section className="page-hero">
                <div className="hero-overlay"></div>
                <div className="container relative z-10">
                    <h1>
                        <i className="fas fa-star text-yellow-400 mr-3"></i>
                        Our Services
                    </h1>
                    <p className="hero-subtitle">Bizz Co Hub — Your Trusted Technology Partner</p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="services-container">
                <div className="container">
                    <div className="services-grid-layout">
                        {services.map((service) => (
                            <div key={service.id} className={`premium-service-card ${service.color}`}>
                                <div className="card-icon-wrapper">
                                    <i className={`fas ${service.icon}`}></i>
                                </div>
                                <div className="card-content">
                                    <span className="service-number">0{service.id}</span>
                                    <h3>{service.title}</h3>
                                    <p className="service-desc">{service.description}</p>

                                    <div className="service-details-list">
                                        <h4>Includes:</h4>
                                        <ul>
                                            {service.details.map((detail, idx) => (
                                                <li key={idx}>
                                                    <i className="fas fa-check-circle"></i>
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="card-footer-note">
                                        <i className="fas fa-info-circle"></i> {service.footer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="services-cta">
                        <h2>Ready to get started?</h2>
                        <p>Contact us today for a custom quote or to discuss your requirements.</p>
                        <div className="cta-buttons">
                            <Link href="/contact" className="btn btn-primary-glow">
                                <i className="fas fa-paper-plane"></i> Contact Us
                            </Link>
                            <Link href="/products" className="btn btn-secondary-glow">
                                <i className="fas fa-store"></i> Browse Products
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
