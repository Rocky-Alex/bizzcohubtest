"use client";

import React, { useState } from "react";
import { Download, MonitorPlay, HelpCircle, FileText, Play } from "lucide-react";
import { toast } from "sonner";
import "../resources/resources.css";
import "./qc.css";

export default function QaManagementPortal() {
    const [downloading, setDownloading] = useState(false);
    const [running, setRunning] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [showChoiceModal, setShowChoiceModal] = useState(false);

    const handleAutoRun = async () => {
        setRunning(true);
        toast.info("Checking local workstation for installer...");
        try {
            // Step 1: Check if installer is in Downloads
            const checkRes = await fetch("/api/skills/launch_qc_software?action=check");
            const checkData = await checkRes.json();

            if (checkData.useProtocol) {
                toast.info("Routing launch request via browser protocol...");
                const originParam = encodeURIComponent(window.location.origin);
                window.location.href = `bizzco-qa://check-qc?origin=${originParam}`;
                return;
            }

            if (checkData.exists) {
                // Step 2: Found! Run it
                toast.info("Installer found in Downloads. Launching installer...");
                const runRes = await fetch("/api/skills/launch_qc_software?action=run");
                const runData = await runRes.json();

                if (runData.useProtocol) {
                    toast.info("Routing launch request via browser protocol...");
                    const originParam = encodeURIComponent(window.location.origin);
                    window.location.href = `bizzco-qa://check-qc?origin=${originParam}`;
                    return;
                }

                if (runData.success) {
                    toast.success("QC Software installer launched successfully!");
                } else {
                    toast.error(runData.error || "Failed to launch installer.");
                }
            } else {
                // Step 3: Not found! Show choice modal
                setShowChoiceModal(true);
            }
        } catch (error: any) {
            console.error("Auto Run check failed:", error);
            // Protocol fallback if cloud/offline
            toast.info("Routing launch request via custom protocol...");
            const originParam = encodeURIComponent(window.location.origin);
            window.location.href = `bizzco-qa://check-qc?origin=${originParam}`;
        } finally {
            setRunning(false);
        }
    };

    const handleAutoDownload = async () => {
        setShowChoiceModal(false);
        setRunning(true);
        toast.info("Initiating auto download and silent installation...");
        try {
            const res = await fetch("/api/skills/launch_qc_software?action=autodownload");
            const data = await res.json();

            if (data.useProtocol) {
                toast.info("Routing install request via browser protocol...");
                const originParam = encodeURIComponent(window.location.origin);
                window.location.href = `bizzco-qa://check-qc?origin=${originParam}`;
                return;
            }

            if (data.success) {
                toast.success("QC Software downloaded and installed successfully!");
            } else {
                toast.error(data.error || "Auto download and installation failed.");
            }
        } catch (error: any) {
            console.error("Auto download failed:", error);
            toast.error("An error occurred during auto download.");
        } finally {
            setRunning(false);
        }
    };

    const handleDownloadOnlyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setShowChoiceModal(false);
        handleDownload(e);
    };

    const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (downloading) return;

        setDownloading(true);
        setDownloadProgress(0);
        toast.info("Starting download of QC Software...");

        try {
            const response = await fetch("/QC_Software/QC_Software.exe");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const contentLength = response.headers.get("content-length");
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            if (!response.body) {
                throw new Error("ReadableStream not supported or no response body returned");
            }

            const reader = response.body.getReader();
            let loaded = 0;
            const chunks: Uint8Array[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                    loaded += value.length;
                    if (total > 0) {
                        setDownloadProgress(Math.round((loaded / total) * 100));
                    }
                }
            }

            const blob = new Blob(chunks as BlobPart[], { type: "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "QC Software.exe";
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Download completed successfully!");
        } catch (error: any) {
            console.error("Download failed:", error);
            toast.error(`Download failed: ${error.message || error}`);
        } finally {
            setDownloading(false);
            setDownloadProgress(null);
        }
    };

    return (
        <div className="qc-portal-container">
            <section className="qc-portal-hero">
                <div className="qc-glow-orb"></div>
                <h1 className="qc-portal-title">QC Software Management Portal</h1>
                <p className="qc-portal-subtitle">
                    Welcome to the QC Software Management Portal. Use this page to run or download the latest version of the QC Software.
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
                            <p className="qc-card-subtitle-sub">Management & Execution Center</p>
                        </div>
                    </div>

                    <div className="qc-card-body">
                        <div className="qc-portal-btn-group">
                            {/* Auto Run Button */}
                            <button
                                onClick={handleAutoRun}
                                disabled={running || downloading}
                                className="qc-portal-btn-primary"
                                style={{ flex: 2 }}
                            >
                                <Play size={20} fill="currentColor" />
                                {running ? "Checking..." : "Auto Run"}
                            </button>

                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                disabled={downloading || running}
                                className="qc-portal-btn-secondary"
                                style={{ flex: 1 }}
                            >
                                <Download size={20} />
                                {downloading ? `Downloading (${downloadProgress}%)` : "Download"}
                            </button>
                        </div>

                        {downloadProgress !== null && (
                            <div className="qc-progress-container">
                                <div className="qc-progress-info">
                                    <span>Downloading QC Software.exe</span>
                                    <span>{downloadProgress}%</span>
                                </div>
                                <div className="qc-progress-bar-bg">
                                    <div 
                                        className="qc-progress-bar-fill" 
                                        style={{ width: `${downloadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FAQ or Info Row */}
                <div className="qc-portal-info-grid">
                    <div className="qc-info-card">
                        <HelpCircle className="qc-info-icon" size={24} />
                        <h3>How does it work?</h3>
                        <p>Clicking the download button streams the official installer directly to your system's Downloads folder.</p>
                    </div>
                    <div className="qc-info-card">
                        <FileText className="qc-info-icon" size={24} />
                        <h3>Installation</h3>
                        <p>Once downloaded, run the installer to automatically configure the diagnostic tools under your <code>C:\QC Software</code> directory.</p>
                    </div>
                </div>
            </div>

            {showChoiceModal && (
                <div className="qc-modal-overlay">
                    <div className="qc-modal-card">
                        <h3 className="qc-modal-title">QC Software Not Found</h3>
                        <p className="qc-modal-message">
                            The installer was not found in your Downloads folder. Please select an option:
                        </p>
                        <div className="qc-modal-btn-stack">
                            <button onClick={handleAutoDownload} className="qc-modal-btn-primary">
                                Auto Download & Install
                            </button>
                            <button onClick={handleDownloadOnlyClick} className="qc-modal-btn-secondary">
                                Download Only
                            </button>
                            <button onClick={() => setShowChoiceModal(false)} className="qc-modal-btn-link">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

