"use client";

import React, { useEffect } from "react";
import {
    Play,
    Download
} from "lucide-react";
import { toast } from "sonner";
import "../resources/resources.css";

export default function QaBridgePage() {
    const triggerDiagnostic = (command: string) => {
        const originParam = encodeURIComponent(window.location.origin);
        const protocolUrl = `bizzco-qa://${command}?origin=${originParam}`;
        window.location.href = protocolUrl;
        toast.success(`Triggered diagnostic command: ${command}`);
    };

    useEffect(() => {
        let launched = false;
        
        const triggerLaunch = () => {
            if (!launched) {
                launched = true;
                triggerDiagnostic("check-qc");
            }
        };

        // Try immediate launch on page load
        triggerLaunch();

        // Fallback: trigger launch on first user gesture anywhere on the page
        const handleGesture = (e: MouseEvent | KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Ignore if user clicked a button/link directly to avoid double execution
            if (target && (target.closest("button") || target.closest("a"))) {
                return;
            }
            triggerLaunch();
        };

        window.addEventListener("click", handleGesture);
        window.addEventListener("keydown", handleGesture);

        return () => {
            window.removeEventListener("click", handleGesture);
            window.removeEventListener("keydown", handleGesture);
        };
    }, []);

    return (
        <div className="resources-page" style={{ paddingBottom: "4rem" }}>
            <section className="resources-hero" style={{ paddingBottom: "2rem" }}>
                <h1 className="resources-title">Quality Checking Software</h1>
                <p className="resources-subtitle">
                    We Provide Quality Checking Software For Laptop Refurbishment & Quality Checking Purpose
                </p>
            </section>

            <section className="qc-container">

                {/* Prominent Main QC Master Suite Card (QC_Software.exe) */}
                <div className="qc-card">
                    <div className="qc-card-content">
                        <div className="qc-header-flex">
                            <div className="qc-title-group">
                                <div className="qc-icon-box">
                                    <Play size={26} fill="currentColor" />
                                </div>
                                <div>
                                    <h2 className="qc-title">Bizz Co QC Master Suite</h2>
                                    <p className="qc-subtitle">Workstation Master Client</p>
                                </div>
                            </div>
                            <div className="qc-badge-status">
                                <span className="qc-pulse-dot"></span>
                                Bridge Active
                            </div>
                        </div>

                        <p className="qc-description">
                            Launches the main control panel application (<code>QC_Software.exe</code>).
                        </p>

                        <div className="qc-badge-pill">
                            <span>⚙️ Target File:</span> <strong>QC_Software.exe</strong>
                        </div>

                        <div className="qc-button-group">
                            <button
                                onClick={() => triggerDiagnostic("check-qc")}
                                className="qc-btn-launch"
                            >
                                <Play size={20} fill="currentColor" /> Open QC Software
                            </button>

                            <button
                                onClick={() => triggerDiagnostic("download-qc")}
                                className="qc-btn-download"
                            >
                                <Download size={20} /> Download QC Software
                            </button>
                        </div>
                    </div>
                </div>





            </section>
        </div>
    );
}
