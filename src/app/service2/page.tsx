"use client";

import Link from "next/link";
import "./styles/service2.css";

export default function Service2Page() {
    const services = [
        {
            id: "01",
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
            footer: "30+ quality checks verified."
        },
        {
            id: "02",
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
            footer: "Includes export packing & logistics."
        },
        {
            id: "03",
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
            footer: "Fast and affordable turnaround."
        },
        {
            id: "04",
            title: "Buyback & Trade-In Program",
            icon: "fa-exchange-alt",
            description: "We buy used laptops, corporate IT assets, ruined or old devices.",
            details: [
                "Used laptops",
                "Corporate IT assets",
                "Damaged or old devices",
                "Bulk lots from companies"
            ],
            footer: "Instant cash or device exchange."
        },
        {
            id: "05",
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
            footer: "System ready for immediate use."
        },
        {
            id: "06",
            title: "Corporate IT Solutions",
            icon: "fa-building",
            description: "Reliable, long-term IT partner for companies and schools.",
            details: [
                "Large batch supply",
                "Annual Maintenance Contracts (AMC)",
                "Device health reports",
                "On-site support"
            ],
            footer: "Long-term partnership guaranteed."
        },
        {
            id: "07",
            title: "Warranty & After-Sales Support",
            icon: "fa-shield-alt",
            description: "Peace of mind with every purchase.",
            details: [
                "Warranty",
                "Easy replacement",
                "Lifetime technical guidance"
            ],
            footer: "Zero-hassle service experience."
        },
        {
            id: "08",
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
            footer: "Tailored to your specs."
        }
    ];

    return (
        <div className="service2-wrapper">
            {/* Tech Hero */}
            <section className="tech-hero">
                <div className="container">
                    <h1>
                        Our <span>Services</span>
                    </h1>
                    <p>Advanced Technology Solutions & Premium Refurbished Hardware</p>
                </div>
            </section>

            {/* Tech Grid */}
            <section className="tech-grid">
                {services.map((service) => (
                    <div key={service.id} className="tech-card">
                        <div className="tech-card-header">
                            <div className="tech-icon">
                                <i className={`fas ${service.icon}`}></i>
                            </div>
                            <span className="tech-id">{service.id}</span>
                        </div>

                        <div className="tech-card-body">
                            <h3>{service.title}</h3>
                            <p>{service.description}</p>

                            <ul className="tech-list">
                                {service.details.map((detail, idx) => (
                                    <li key={idx}>
                                        <i className="fas fa-chevron-right"></i>
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="tech-card-footer">
                            <i className="fas fa-terminal"></i>
                            {service.footer}
                        </div>
                    </div>
                ))}
            </section>

            {/* Tech CTA */}
            <section className="tech-cta">
                <h2>Ready to Upgrade?</h2>
                <p>Initialize your next project with Bizz Co Hub's premium services.</p>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/contact" className="tech-btn">
                        Initialize Contact <i className="fas fa-arrow-right ml-2"></i>
                    </Link>
                    <Link href="/products" className="tech-btn secondary">
                        View Inventory
                    </Link>
                </div>
            </section>
        </div>
    );
}
