"use client";

import Link from "next/link";

export default function ServiceDesignsPage() {
    const serviceDesigns = [
        {
            path: "/services",
            name: "Main Services Page (Design 7)",
            description: "Narrative Z-Layout. Good for storytelling and ease of reading. matches project font/style.",
            theme: "Clean / Narrative"
        },
        {
            path: "/service1",
            name: "Service Design 1",
            description: "Premium Glassmorphism. Colorful, vibrant, with mesh gradients and blur effects.",
            theme: "Glass / Modern"
        },
        {
            path: "/service2",
            name: "Service Design 2",
            description: "Cyber Tech Dark. Dark mode, neon accents, tech/gaming aesthetic.",
            theme: "Dark / Cyber"
        },
        {
            path: "/service3",
            name: "Service Design 3",
            description: "Clean Corporate. Professional, white-space heavy, standard business look.",
            theme: "Corporate / Simple"
        },
        {
            path: "/service4",
            name: "Service Design 4",
            description: "Modern Bento Grid. Trendy, boxy layout with varied card sizes.",
            theme: "Bento / SaaS"
        },
        {
            path: "/service5",
            name: "Service Design 5",
            description: "Technical Blueprint. Engineering schematics style, mono fonts, technical vibe.",
            theme: "Technical / Blueprint"
        },
        {
            path: "/service6",
            name: "Service Design 6",
            description: "Minimal List. Sophisticated list view, interaction-heavy hover effects.",
            theme: "Minimal / List"
        }
    ];

    const contactDesigns = [
        {
            path: "/contact1",
            name: "Contact Design 1",
            description: "Modern Split. Overlapping card with blue info sidebar and clean white form.",
            theme: "Modern / Split"
        },
        {
            path: "/contact2",
            name: "Contact Design 2",
            description: "Dark Glass / Cyber. High-contrast dark mode with glowing inputs and glass cards.",
            theme: "Dark / Cyber"
        },
        {
            path: "/contact3",
            name: "Contact Design 3",
            description: "Clean Corporate. Minimalist aesthetic with focus on typography and ease of use.",
            theme: "Corporate / Minimal"
        }
    ];

    const renderGrid = (items: typeof serviceDesigns) => (
        <div style={{ display: "grid", gap: "1.5rem" }}>
            {items.map((design, idx) => (
                <Link href={design.path} key={idx} style={{ textDecoration: "none" }}>
                    <div
                        style={{
                            background: "white",
                            padding: "2rem",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>
                                {design.name}
                            </h3>
                            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>{design.description}</p>
                        </div>
                        <div style={{
                            background: "#f1f5f9",
                            padding: "0.5rem 1rem",
                            borderRadius: "100px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#475569",
                            whiteSpace: "nowrap",
                            marginLeft: "1rem"
                        }}>
                            {design.theme}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );

    return (
        <div style={{ padding: "4rem 2rem", background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "3rem", fontWeight: "800", marginBottom: "1rem", color: "#0f172a" }}>Design Hub</h1>
                <p style={{ marginBottom: "4rem", color: "#64748b", fontSize: "1.1rem" }}>
                    Browse through available layouts for different sections of the BizzCoHub platform.
                </p>

                <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "2rem", color: "#1e293b" }}>
                    <i className="fas fa-layer-group" style={{ marginRight: "1rem", color: "#4079ff" }}></i>
                    Service Layouts
                </h2>
                {renderGrid(serviceDesigns)}

                <h2 style={{ fontSize: "1.75rem", fontWeight: "700", margin: "4rem 0 2rem 0", color: "#1e293b" }}>
                    <i className="fas fa-envelope" style={{ marginRight: "1rem", color: "#4079ff" }}></i>
                    Contact Layouts
                </h2>
                {renderGrid(contactDesigns)}
            </div>
        </div>
    );
}
