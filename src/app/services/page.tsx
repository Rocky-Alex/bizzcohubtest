import Link from "next/link";
import "./styles/services.css";

export default function ServicesPage() {
    const services = [
        {
            id: 1,
            title: "Premium Refurbished & Desktops",
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
                "Vietnam & ASEAN",
                "Africa Region",
                "UAE Local Wholesale"
            ],
            footer: "Secure Logistics & Customs"
        },
        {
            id: 3,
            title: "Advanced Repair Center",
            icon: "fa-microchip",
            description: "State-of-the-art repair facility capable of component-level diagnostics and fixes. We revive devices others consider obsolete.",
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
            title: "Corporate Buyback & Trade-In",
            icon: "fa-hand-holding-usd",
            description: "Maximize value from your aging IT infrastructure. We offer competitive buyback rates for corporate lots and individual trade-ins.",
            details: [
                "Corporate Bulk Lots",
                "End-of-Life Assets",
                "Secure Data Wipe",
                "Instant Valuation"
            ],
            footer: "Eco-friendly Disposal"
        },
        {
            id: 5,
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
            id: 6,
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
            id: 7,
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
            id: 8,
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
