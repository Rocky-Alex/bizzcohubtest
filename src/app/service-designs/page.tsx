"use client";

import Link from "next/link";

export default function ServiceDesignsPage() {
    const designs = [
        {
            path: "/services",
            name: "Main Services Page (Design 7)",
            description: "Narrative Z-Layout. Good for storytelling and ease of reading. matches project font/style.",
            theme: "Clean / Narrative"
        },
        {
            path: "/service1",
            name: "Design 1",
            description: "Premium Glassmorphism. Colorful, vibrant, with mesh gradients and blur effects.",
            theme: "Glass / Modern"
        },
        {
            path: "/service2",
            name: "Design 2",
            description: "Cyber Tech Dark. Dark mode, neon accents, tech/gaming aesthetic.",
            theme: "Dark / Cyber"
        },
        {
            path: "/service3",
            name: "Design 3",
            description: "Clean Corporate. Professional, white-space heavy, standard business look.",
            theme: "Corporate / Simple"
        },
        {
            path: "/service4",
            name: "Design 4",
            description: "Modern Bento Grid. Trendy, boxy layout with varied card sizes.",
            theme: "Bento / SaaS"
        },
        {
            path: "/service5",
            name: "Design 5",
            description: "Technical Blueprint. Engineering schematics style, mono fonts, technical vibe.",
            theme: "Technical / Blueprint"
        },
        {
            path: "/service6",
            name: "Design 6",
            description: "Minimal List. Sophisticated list view, interaction-heavy hover effects.",
            theme: "Minimal / List"
        }
    ];

    return (
        <div style={{ padding: "4rem 2rem", background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "1rem", color: "#0f172a" }}>Service Page Designs</h1>
                <p style={{ marginBottom: "3rem", color: "#64748b" }}>
                    A collection of different design approaches for the "Our Services" page. Click to view each live component.
                </p>

                <div style={{ display: "grid", gap: "1.5rem" }}>
                    {designs.map((design, idx) => (
                        <Link href={design.path} key={idx} style={{ textDecoration: "none" }}>
                            <div style={{
                                background: "white",
                                padding: "2rem",
                                borderRadius: "16px",
                                border: "1px solid #e2e8f0",
                                transition: "transform 0.2s, box-shadow 0.2s",
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
            </div>
        </div>
    );
}
