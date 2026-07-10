"use client";

import React, { useState } from "react";
import { Download, MonitorPlay, HelpCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import "../resources/resources.css";
import "./qc.css";

export default function QaManagementPortal() {
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

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
                    Welcome to the QC Software Management Portal. Use this page to download the latest version of the QC Software.
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
                            <p className="qc-card-subtitle-sub">Management & Download Center</p>
                        </div>
                    </div>

                    <div className="qc-card-body">
                        <div className="qc-portal-btn-group">
                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="qc-portal-btn-primary"
                                style={{ width: "100%" }}
                            >
                                <Download size={20} />
                                {downloading ? `Downloading (${downloadProgress}%)` : "Download QC Software"}
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
        </div>
    );
}

