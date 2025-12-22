"use client";

import Link from "next/link";
import "./styles/service3.css";

export default function Service3Page() {
    const services = [
        {
            id: 1,
            title: "Premium Refurbished Devices",
            icon: "fa-laptop",
            description: "Certified, performance-optimized devices for students, offices, and gamers.",
            details: [
                "Students & Freelancers",
                "Corporate Solutions",
                "Gamers & Designers",
                "Export Quality"
            ],
            footer: "Verified with 30+ quality checks"
        },
        {
            id: 2,
            title: "Bulk Supply & Export",
            icon: "fa-globe-asia",
            description: "Global supply chain for large quantities of refurbished laptops.",
            details: [
                "India & Pakistan",
                "Vietnam & Asia",
                "Africa Region",
                "UAE Local Market"
            ],
            footer: "Export packing & logistics included"
        },
        {
            id: 3,
            title: "Professional Repair",
            icon: "fa-screwdriver-wrench",
            description: "High-quality repair services with guaranteed parts.",
            details: [
                "SSD & RAM Upgrades",
                "Battery Replacement",
                "Screen & Keyboard",
                "Chip-level Service"
            ],
            footer: "Fast turnaround & warranty"
        },
        {
            id: 4,
            title: "Buyback & Trade-In",
            icon: "fa-money-bill-transfer",
            description: "Exchange your old devices for cash or upgrades.",
            details: [
                "Old/Used Laptops",
                "Corporate IT Assets",
                "Damaged Devices",
                "Bulk Company Lots"
            ],
            footer: "Instant evaluation & payment"
        },
        {
            id: 5,
            title: "System Setup & Software",
            icon: "fa-windows",
            description: "Complete installation services for immediate productivity.",
            details: [
                "OS Installation",
                "Driver Updates",
                "Productivity Software",
                "Security & Backup"
            ],
            footer: "Plug-and-play ready"
        },
        {
            id: 6,
            title: "Corporate IT Solutions",
            icon: "fa-briefcase",
            description: "Strategic technology partnership for businesses and institutions.",
            details: [
                "Large Volume Supply",
                "AMC Contracts",
                "Health Reports",
                "On-site Support"
            ],
            footer: "Dedicated account manager"
        },
        {
            id: 7,
            title: "Warranty & Support",
            icon: "fa-headset",
            description: "Comprehensive after-sales support for peace of mind.",
            details: [
                "Standard Warranty",
                "Easy Replacements",
                "Technical Guidance",
                "Remote Support"
            ],
            footer: "Customer-first policy"
        },
        {
            id: 8,
            title: "Custom Configurations",
            icon: "fa-sliders",
            description: "Tailor-made specifications to match your workload.",
            details: [
                "RAM & Storage Customization",
                "Processor Selection",
                "Software Bundles",
                "Accessory Kits"
            ],
            footer: "Built to your exact needs"
        }
    ];

    return (
        <div className="service3-wrapper">
            {/* Corporate Hero */}
            <section className="corp-hero">
                <div className="corp-hero-content">
                    <div className="corp-badge">
                        <i className="fas fa-star"></i> Bizz Co Hub Services
                    </div>
                    <h1>Comprehensive Technology Solutions</h1>
                    <p>From individual upgrades to global corporate supply, we deliver certified quality and professional expertise.</p>
                </div>
            </section>

            {/* Main Grid */}
            <div className="corp-container">
                <div className="corp-grid">
                    {services.map((service) => (
                        <div key={service.id} className="corp-card">
                            <div className="corp-card-header">
                                <div className="corp-icon-box">
                                    <i className={`fas ${service.icon}`}></i>
                                </div>
                                <span className="corp-id">0{service.id}</span>
                            </div>

                            <h3>{service.title}</h3>
                            <p>{service.description}</p>

                            <ul className="corp-features">
                                {service.details.map((detail, idx) => (
                                    <li key={idx}>
                                        <i className="fas fa-check-circle"></i>
                                        {detail}
                                    </li>
                                ))}
                            </ul>

                            <div className="corp-card-footer">
                                <i className="fas fa-info-circle"></i> {service.footer}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="corp-cta">
                    <h2>Partner with Bizz Co Hub Today</h2>
                    <p>Get a custom quote for your business or find the perfect device for your needs.</p>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/contact" className="btn-primary">
                            <i className="fas fa-paper-plane"></i> Contact Support
                        </Link>
                        <Link href="/products" className="btn-outline">
                            <i className="fas fa-laptop"></i> Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
