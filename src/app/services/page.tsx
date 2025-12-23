import Link from "next/link";
import "./styles/services.css";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Professional Technology Services | Bizz Co Hub',
    description: 'Explore Bizz Co Hub\'s comprehensive IT services including premium refurbished hardware, global bulk supply, advanced repair center, and enterprise IT partnerships.',
    keywords: 'refurbished laptops, IT services, data recovery, bulk electronics, electronics repair, BizzCoHub',
};

export default function ServicesPage() {
    const services = [
        {
            id: 1,
            title: "Premium Refurbished Laptops & Desktops",
            icon: "fa-laptop-code",
            description: "We provide high-performance, certified refurbished laptops and desktops tailored for students, professionals, and enterprise needs. Every device undergoes rigorous testing.",
            details: [
                "Students & Ed-Tech",
                "Corporate Workstations",
                "Graphic Designers",
                "Export Grade Quality"
            ],
            footer: "Verified 30+ Point Check"
        },
        {
            id: 2,
            title: "Bulk Supply & Global Export",
            icon: "fa-shipping-fast",
            description: "A robust logistics network enabling bulk distribution of electronics across international borders, including specialized handling for emerging markets.",
            details: [
                "India & South Asia",
                "Vietnam & Qatar",
                "Africa Region",
                "UAE Local Wholesale"
            ],
            footer: "Secure Logistics & Customs"
        },
        {
            id: 3,
            title: "Advanced Repair Center",
            icon: "fa-microchip",
            description: "We don't just replace parts; we understand the engineering. Equipped with industry-leading diagnostic tools, we repair faults at the microscopic level—saving your data and your device.",
            details: [
                "Motherboard Logic",
                "Screen Replacements",
                "Battery & Power",
                "Liquid Damage Fix"
            ],
            footer: "Fast Turnaround Guaranteed"
        },
        {
            id: 4,
            title: "OS & Software Deployment",
            icon: "fa-cogs",
            description: "Turnkey software solutions ensuring your hardware is ready to deploy immediately upon arrival. Licensed and securely configured.",
            details: [
                "Windows 10/11 Pro",
                "Driver Optimization",
                "Office Suites",
                "Security Hardening"
            ],
            footer: "Plug-and-Play Ready"
        },
        {
            id: 5,
            title: "Enterprise IT Partnerships",
            icon: "fa-building-shield",
            description: "Long-term strategic support for educational institutions and businesses, ensuring operational continuity through managed services.",
            details: [
                "Annual Maintenance (AMC)",
                "On-site Engineers",
                "Fleet Health Reports",
                "Priority Support"
            ],
            footer: "Dedicated Account Managers"
        },
        {
            id: 6,
            title: "Warranty & After-Sales",
            icon: "fa-user-shield",
            description: "Our commitment doesn't end at the sale. Enjoy comprehensive warranty coverage and expert technical guidance for the life of your device.",
            details: [
                "Standard Warranty",
                "Easy Returns",
                "Remote Support",
                "Lifetime Guidance"
            ],
            footer: "Customer First Policy"
        },
        {
            id: 7,
            title: "Custom Configurations",
            icon: "fa-sliders",
            description: "Don't settle for stock specifications. We build machines to your exact requirements for specialized workloads.",
            details: [
                "RAM Expansion",
                "NVMe Storage",
                "Specialized GPUs",
                "Custom OS Builds"
            ],
            footer: "Built to Order"
        },

        {
            id: 8,
            title: "Advanced Data Recovery",
            icon: "fa-database",
            description: "Unexpected data loss shouldn't mean the end of your business operations. Our forensic-grade recovery labs specialize in retrieving critical information from damaged drives and corrupted systems with industry-standard privacy protocols.",
            details: [
                "Data Recovery",
                "Data Backup",
                "Data Security",
                "Data Encryption"
            ],
            footer: "Data Recovery"
        }
    ];

    return (
        <div className="services-page-wrapper">
            {/* Hero */}
            <section className="narrative-hero">
                <div className="container">
                    <h1>
                        Empowering Your<br />
                        <span>Digital Infrastructure.</span>
                    </h1>
                    <p>
                        From individual power users to global enterprise supply chains, Bizz Co Hub delivers end-to-end technology solutions with certified quality and unmatched expertise.
                    </p>
                </div>
            </section>

            {/* Narrative Sections (Z-Pattern) */}
            <div className="narrative-flow">
                {services.map((service, index) => (
                    <section key={service.id} className="narrative-section">
                        <div className="narrative-container">
                            <div className="narrative-content">
                                <span className="narrative-num">0{service.id}</span>
                                <h2>{service.title}</h2>
                                <p>{service.description}</p>
                                <ul className="narrative-list">
                                    {service.details.map((detail, idx) => (
                                        <li key={idx} className="narrative-item">
                                            <i className="fas fa-check-circle"></i> {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="narrative-visual">
                                <div className="visual-card">
                                    <i className={`fas ${service.icon}`}></i>
                                    <div className="visual-label">{service.title}</div>
                                    <div className="visual-footer">
                                        <i className="fas fa-info-circle mr-2"></i> {service.footer}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            {/* CTA */}
            <section className="narrative-cta">
                <div className="container">
                    <h2>Ready to upgrade your technology?</h2>
                    <Link href="/contact" className="btn-white">
                        <i className="fas fa-paper-plane"></i> Get Your Custom Quote
                    </Link>
                </div>
            </section>
        </div>
    );
}
