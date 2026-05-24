"use client";

import React from "react";
import "../resources.css"; // Adjusted path
import {
    Download,
    MonitorCheck,
    Eraser,
    Minimize2,
    Sparkles,
    Wrench,
    ArrowRight,
    Cpu,
    HardDrive,
    Search,
    Monitor,
    Keyboard,
    Battery,
    Volume2,
    Video,
    Touchpad,
    Wifi,
    MousePointer2
} from "lucide-react";
import Link from "next/link";

interface ResourceCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    actionText?: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ title, description, icon, href, actionText = "Explore Tool" }) => {
    return (
        <Link href={href} className="resource-card">
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
            <section className="resources-hero">
                <h1 className="resources-title">Developer & Tech Resources</h1>
                <p className="resources-subtitle">
                    Essential tools for developers, designers, and technicians.
                    Manage your workflow with our premium suite of utilities.
                </p>
            </section>

            {/* Laptop & Desktop Quality Checking Section */}
            <section className="section-wrapper">
                <div className="section-header">
                    <h2 className="section-title">Laptop & Desktop Quality Checking</h2>
                    <p className="section-subtitle">
                        Comprehensive diagnostic suite to verify hardware integrity. Test displays, inputs, audio, and performance.
                    </p>
                </div>
                <div className="resources-grid" style={{ paddingTop: '1rem' }}>

                    <ResourceCard
                        title="LCD Screen Test"
                        description="Check for dead pixels, bleeding, and color accuracy."
                        icon={<Monitor size={32} />}
                        href="/resources/lcd-check"
                        actionText="Start Check"
                    />
                    <ResourceCard
                        title="Keyboard Tester"
                        description="Test every key on your keyboard to ensure they are registering correctly."
                        icon={<Keyboard size={32} />}
                        href="/resources/keyboard-test"
                        actionText="Test Keyboard"
                    />
                    <ResourceCard
                        title="Trackpad Check"
                        description="Test mouse clicks, scrolling, and trackpad gestures."
                        icon={<MousePointer2 size={32} />}
                        href="/resources/trackpad-test"
                        actionText="Test Trackpad"
                    />
                    <ResourceCard
                        title="Battery Status"
                        description="View real-time battery charge level and charging status."
                        icon={<Battery size={32} />}
                        href="/resources/battery-status"
                        actionText="Check Status"
                    />
                    <ResourceCard
                        title="Audio Diagnostics"
                        description="Test speaker stereo separation and microphone input levels."
                        icon={<Volume2 size={32} />}
                        href="/resources/sound-test"
                        actionText="Test Audio"
                    />

                    <ResourceCard
                        title="Webcam Diagnostics"
                        description="Verify camera functionality, resolution, and capture test snapshots."
                        icon={<Video size={32} />}
                        href="/resources/camera-test"
                        actionText="Test Camera"
                    />

                    <ResourceCard
                        title="Connectivity Test"
                        description="Check WiFi signal, internet status, and network interfaces."
                        icon={<Wifi size={32} />}
                        href="/resources/connectivity-test"
                        actionText="Check Network"
                    />

                    <ResourceCard
                        title="SpecCheck"
                        description="Real-time futuristic hardware & system diagnostics suite."
                        icon={<Cpu size={32} />}
                        href="/resources/spec"
                        actionText="Run Diagnostics"
                    />

                    <ResourceCard
                        title="SpecCheck Ultra"
                        description="Vibrant glassmorphic telemetry dashboard with circular gauge meters."
                        icon={<Cpu size={32} />}
                        href="/resources/spec2"
                        actionText="Open Telemetry"
                    />

                    <ResourceCard
                        title="Touch Screen Test"
                        description="Verify touch sensitivity and dead zones by dragging an icon across the screen."
                        icon={<Touchpad size={32} />}
                        href="/resources/touch-test"
                        actionText="Test Touch"
                    />

                </div>
            </section>

            <div className="resources-grid">
                {/* Image Background Removal */}
                <ResourceCard
                    title="Image Background Remover"
                    description="AI-powered tool to instantly remove backgrounds from images with high precision."
                    icon={<Eraser size={32} />}
                    href="/resources/bg-remover"
                    actionText="Remove Background"
                />

                {/* Image Size Reducer */}
                <ResourceCard
                    title="Image Compressor"
                    description="Reduce image file sizes without compromising quality. Optimized for web performance."
                    icon={<Minimize2 size={32} />}
                    href="/resources/compressor"
                    actionText="Compress Images"
                />

                {/* Image Clarity Increase */}
                <ResourceCard
                    title="Image Enhancer"
                    description="Upscale and clarify low-resolution images using advanced restoration algorithms."
                    icon={<Sparkles size={32} />}
                    href="/resources/enhancer"
                    actionText="Enhance Quality"
                />
            </div>
        </div>
    );
}
