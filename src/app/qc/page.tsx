"use client";

import React, { useState } from "react";
import { Play, Download, ShieldAlert, MonitorPlay, HelpCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import "../resources/resources.css";
import "./qc.css";

export default function QaManagementPortal() {
    const [loading, setLoading] = useState(false);

    const handleOpenSoftware = async () => {
        setLoading(true);
        toast.info("Checking local workstation for QC Software...");
        try {
            const response = await fetch("/api/skills/launch_qc_software");
            const data = await response.json();

            if (data.success) {
                toast.success("QC Software started successfully on your workstation!");
            } else {
                // Requirement 1.C: If file is not found, trigger alert: 'QC Software not found. Please download and install the software first.'
                alert(data.error || "QC Software not found. Please download and install the software first.");
            }
        } catch (error) {
            console.error("API call failed:", error);
            toast.error("Failed to connect to the local bridge API.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="qc-portal-container">
            <section className="qc-portal-hero">
                <div className="qc-glow-orb"></div>
                <h1 className="qc-portal-title">QC Software Management Portal</h1>
                <p className="qc-portal-subtitle">
                    Welcome to the QC Software Management Portal. Use this page to download the latest version or launch the application directly.
                </p>
            </section>

            <div className="qc-portal-content">
                <div className="qc-portal-card">
                    <div className="qc-card-header">
                        <div className="qc-card-icon-box">
                            <MonitorPlay size={32} />
                        </div>
                        <div>
                            <h2 className="qc-card-title">Bizz Co QC Workstation Control</h2>
                            <p className="qc-card-subtitle-sub">Management & Launch Center</p>
                        </div>
                    </div>

                    <div className="qc-card-body">
                        <div className="qc-alert-banner">
                            <ShieldAlert size={20} className="qc-alert-icon" />
                            <span>
                                <strong>Auto-Installer Mode:</strong> Clicking **Open QC Software** will automatically install the client files on your workstation if not present.
                            </span>
                        </div>

                        <div className="qc-portal-btn-group">
                            {/* Open Software Button */}
                            <button
                                onClick={handleOpenSoftware}
                                disabled={loading}
                                className="qc-portal-btn-primary"
                            >
                                <Play size={20} fill="currentColor" />
                                {loading ? "Launching..." : "Open QC Software"}
                            </button>

                            {/* Download Button */}
                            <a
                                href="/QC_Software/QC_Software.exe"
                                download="QC_Software.exe"
                                className="qc-portal-btn-secondary"
                            >
                                <Download size={20} />
                                Download QC Software
                            </a>
                        </div>
                    </div>
                </div>

                {/* FAQ or Info Row */}
                <div className="qc-portal-info-grid">
                    <div className="qc-info-card">
                        <HelpCircle className="qc-info-icon" size={24} />
                        <h3>How does it work?</h3>
                        <p>The Portal communicates with a local agent skill to securely launch the native diagnostics client on your workstation filesystem.</p>
                    </div>
                    <div className="qc-info-card">
                        <FileText className="qc-info-icon" size={24} />
                        <h3>Target Path</h3>
                        <p>The native launcher expects the application file at: <code>C:\QC Software\QC Software.exe</code></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

