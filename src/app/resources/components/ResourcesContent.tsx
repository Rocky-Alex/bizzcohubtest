"use client";

import React from "react";
import {
    Eraser,
    Minimize2,
    Sparkles,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

interface ResourceCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    badge: string;
    badgeColor: string;
    actionText?: string;
    gradientClass: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
    title, 
    description, 
    icon, 
    href, 
    badge,
    badgeColor,
    actionText = "Explore Tool",
    gradientClass
}) => {
    return (
        <Link href={href} className={`resource-card ${gradientClass}`}>
            <div className="card-glass-glow"></div>
            <div className="card-top">
                <span className={`tool-badge ${badgeColor}`}>{badge}</span>
            </div>
            <div className="resource-icon-wrapper">
                {icon}
            </div>
            <div className="resource-content">
                <h3 className="resource-title">{title}</h3>
                <p className="resource-description">{description}</p>
                <div className="resource-action">
                    {actionText} <ArrowRight size={18} />
                </div>
            </div>
        </Link>
    );
};

export default function ResourcesContent() {
    return (
        <div className="resources-page">
            <div className="hero-glow-1"></div>
            <div className="hero-glow-2"></div>
            
            <section className="resources-hero">
                <div className="hero-badge">Creative Utilities</div>
                <h1 className="resources-title">Media & Design Toolkit</h1>
                <p className="resources-subtitle">
                    Fast, secure, and professional browser-based utilities to streamline your digital content workflow. Optimized for web performance and quality.
                </p>
            </section>

            <div className="resources-grid">
                {/* Image Background Removal */}
                <ResourceCard
                    title="Background Remover"
                    description="AI-powered tool to instantly remove backgrounds from images with high precision. Clean borders in a single click."
                    icon={<Eraser size={32} />}
                    href="/resources/bg-remover"
                    badge="AI Powered"
                    badgeColor="badge-purple"
                    actionText="Remove Background"
                    gradientClass="card-remover"
                />

                {/* Image Size Reducer */}
                <ResourceCard
                    title="Image Compressor"
                    description="Reduce image file sizes without compromising quality. Optimized for loading speeds and web performance."
                    icon={<Minimize2 size={32} />}
                    href="/resources/compressor"
                    badge="Optimization"
                    badgeColor="badge-teal"
                    actionText="Compress Images"
                    gradientClass="card-compressor"
                />

                {/* Image Clarity Increase */}
                <ResourceCard
                    title="Image Enhancer"
                    description="Upscale and clarify low-resolution images using advanced restoration algorithms for crisp, high-definition results."
                    icon={<Sparkles size={32} />}
                    href="/resources/enhancer"
                    badge="AI Restoration"
                    badgeColor="badge-blue"
                    actionText="Enhance Quality"
                    gradientClass="card-enhancer"
                />
            </div>
        </div>
    );
}
