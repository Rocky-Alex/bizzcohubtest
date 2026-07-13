"use client";

/* ── GitHub Release constants ───────────────────────────────── */
const GH_RELEASES_PAGE = "https://github.com/Rocky-Alex/BC-Elite-QC/releases";

import React, { useState, useEffect, useCallback } from "react";
import {
    Download, Play, Cpu, HardDrive, Battery, Keyboard,
    Monitor, Volume2, Shield, RefreshCw, Terminal, Activity,
    Server, Github, ExternalLink, AlertTriangle, CheckCircle2,
    Zap, Package, Clock, BarChart2, Layers, ArrowRight,
    ChevronDown, Wifi, Video, MousePointer2, Touchpad
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import "./qc.css";

/* ── Static data ──────────────────────────────────────────────── */
const TOOLS = [
    { id: "master", icon: Terminal, name: "Master Checker", file: "BizzCoHubQC.exe", color: "#818cf8", tag: "CORE", desc: "Central Tauri-powered hub that coordinates all tests, logs results and syncs analytics." },
    { id: "battery", icon: Battery, name: "Battery Tester", file: "Battery_checking.exe", color: "#34d399", tag: "HEALTH", desc: "Deep battery health: capacity, charge-cycles, voltage & cloud-sync to BCH dashboard." },
    { id: "cpu", icon: Cpu, name: "CPU-Z Hardware", file: "cpuz_x64.exe", color: "#fbbf24", tag: "SPECS", desc: "Full auto-discovery: CPU, RAM, motherboard, BIOS — zero technician input needed." },
    { id: "hdd", icon: HardDrive, name: "Hard Disk Sentinel", file: "HDSentinel.exe", color: "#f43f5e", tag: "S.M.A.R.T", desc: "SMART diagnostics, health %, reallocated sectors, temperature & audio alerts." },
    { id: "keyboard", icon: Keyboard, name: "Keyboard Tester", file: "Keyboard_checking.exe", color: "#a78bfa", tag: "INPUT", desc: "Real-time keypress visualiser — catch dead or stuck keys before shipping." },
    { id: "lcd", icon: Monitor, name: "LCD Pixel Checker", file: "LCD_checking.exe", color: "#38bdf8", tag: "DISPLAY", desc: "Full-screen RGB sweep on black & white panels to reveal dead pixels & backlight bleed." },
    { id: "sound", icon: Volume2, name: "Sound Checker", file: "Sound_checking.mp4", color: "#fb923c", tag: "AUDIO", desc: "Stereo test playback verifies left/right balance, output volume & headphone jack." },
];

const CAPABILITIES = [
    { icon: Zap, label: "Auto Spec Discovery", detail: "CPU · RAM · GPU · BIOS" },
    { icon: Activity, label: "Live Diagnostic Log", detail: "Timestamped events" },
    { icon: Server, label: "Cloud Analytics Sync", detail: "Battery → BCH server" },
    { icon: BarChart2, label: "Device History", detail: "Local audit trail" },
    { icon: Shield, label: "Admin Elevated", detail: "Full hardware access" },
    { icon: Layers, label: "7 Sub-Tools", detail: "Individual shortcuts" },
    { icon: RefreshCw, label: "Silent Auto-Install", detail: "One-click from web portal" },
    { icon: Package, label: "Tauri v2 / Rust", detail: "Lightweight native app" },
];

const ONLINE_TOOLS = [
    {
        id: "lcd-check",
        name: "LCD Pixel Checker",
        href: "/resources/lcd-check?from=qc",
        icon: Monitor,
        gradient: "linear-gradient(135deg, #0a84ff, #0051a8)"
    },
    {
        id: "keyboard-test",
        name: "Keyboard Tester",
        href: "/resources/keyboard-test?from=qc",
        icon: Keyboard,
        gradient: "linear-gradient(135deg, #bf5af2, #892cd8)"
    },
    {
        id: "trackpad-test",
        name: "Trackpad Check",
        href: "/resources/trackpad-test?from=qc",
        icon: MousePointer2,
        gradient: "linear-gradient(135deg, #8e8e93, #636366)"
    },
    {
        id: "battery-status",
        name: "Battery Status",
        href: "/resources/battery-status?from=qc",
        icon: Battery,
        gradient: "linear-gradient(135deg, #30d158, #1c9d3f)"
    },
    {
        id: "sound-test",
        name: "Sound & Audio Test",
        href: "/resources/sound-test?from=qc",
        icon: Volume2,
        gradient: "linear-gradient(135deg, #ff453a, #c92c22)"
    },
    {
        id: "camera-test",
        name: "Webcam Diagnostics",
        href: "/resources/camera-test?from=qc",
        icon: Video,
        gradient: "linear-gradient(135deg, #ff375f, #c9183c)"
    },
    {
        id: "connectivity-test",
        name: "Connectivity Test",
        href: "/resources/connectivity-test?from=qc",
        icon: Wifi,
        gradient: "linear-gradient(135deg, #5e5ce6, #3b39c0)"
    },
    {
        id: "touch-test",
        name: "Touch Screen Test",
        href: "/resources/touch-test?from=qc",
        icon: Touchpad,
        gradient: "linear-gradient(135deg, #64d2ff, #00a4e4)"
    }
];

/* ── Component ────────────────────────────────────────────────── */
export default function QCPage() {
    const [downloading, setDownloading] = useState(false);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [scanLine, setScanLine] = useState(0);
    const [mounted, setMounted] = useState(false);

    // Dynamic release version and asset info state
    const [releaseTag, setReleaseTag] = useState("v1.0.2");
    const [assetName, setAssetName] = useState("BC_Elite_QC_Setup_Version_1.0.2.exe");

    // Fetch dynamic GitHub release info on mount
    useEffect(() => {
        setMounted(true);
        const getReleaseInfo = async () => {
            try {
                const res = await fetch("/api/qc/download?info=true");
                const data = await res.json();
                if (data.success && data.version && data.assetName) {
                    setReleaseTag(data.version);
                    setAssetName(data.assetName);
                }
            } catch (err) {
                console.error("Failed to load release info from server proxy API:", err);
            }
        };
        getReleaseInfo();
    }, []);

    // Animated scan-line for the right panel
    useEffect(() => {
        const id = setInterval(() => setScanLine(p => (p + 1) % 100), 30);
        return () => clearInterval(id);
    }, []);

    /* ── Handlers ── */
    const handleAutoRun = async () => {
        setRunning(true);
        toast.info("Scanning workstation for BC Elite QC…");
        try {
            const checkRes = await fetch("/api/skills/launch_qc_software?action=check");
            const checkData = await checkRes.json();
            if (checkData.useProtocol) {
                window.location.href = `bizzco-qa://check-qc?origin=${encodeURIComponent(window.location.origin)}`;
                return;
            }
            if (checkData.exists) {
                toast.info("Found. Launching…");
                const runRes = await fetch("/api/skills/launch_qc_software?action=run");
                const runData = await runRes.json();
                if (runData.useProtocol) {
                    window.location.href = `bizzco-qa://check-qc?origin=${encodeURIComponent(window.location.origin)}`;
                    return;
                }
                if (runData.success) {
                    toast.success("BC Elite QC launched!");
                } else {
                    toast.error(runData.error || "Launch failed.");
                }
            } else {
                setShowModal(true);
            }
        } catch {
            window.location.href = `bizzco-qa://check-qc?origin=${encodeURIComponent(window.location.origin)}`;
        } finally {
            setRunning(false);
        }
    };

    const triggerProxyDownload = useCallback(() => {
        const a = document.createElement("a");
        a.href = "/api/qc/download";
        a.download = assetName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [assetName]);

    const handleAutoInstall = async () => {
        setShowModal(false);
        setRunning(true);
        toast.info("Auto-downloading & installing via GitHub Releases…");
        try {
            const downloadUrl = `https://github.com/Rocky-Alex/BC-Elite-QC/releases/download/${releaseTag}/${assetName}`;
            const res = await fetch(`/api/skills/launch_qc_software?action=autodownload&downloadUrl=${encodeURIComponent(downloadUrl)}&assetName=${encodeURIComponent(assetName)}`);
            const data = await res.json();
            if (data.useProtocol) {
                window.location.href = `bizzco-qa://check-qc?origin=${encodeURIComponent(window.location.origin)}`;
                return;
            }
            if (data.success) { toast.success("Installed successfully!"); }
            else { triggerProxyDownload(); }
        } catch { triggerProxyDownload(); }
        finally { setRunning(false); }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (downloading) return;
        setDownloading(true);
        setProgress(0);
        toast.info("Fetching installer from GitHub Releases…");
        try {
            const res = await fetch("/api/qc/download");
            if (!res.ok) throw new Error(`Server ${res.status}`);
            const total = parseInt(res.headers.get("content-length") ?? "0", 10);
            const reader = res.body!.getReader();
            let loaded = 0;
            const chunks: BlobPart[] = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) { chunks.push(value); loaded += value.length; if (total) setProgress(Math.round(loaded / total * 100)); }
            }
            const blobUrl = window.URL.createObjectURL(new Blob(chunks, { type: "application/octet-stream" }));
            const a = Object.assign(document.createElement("a"), { href: blobUrl, download: assetName, style: "display:none" });
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(blobUrl); document.body.removeChild(a);
            setProgress(100);
            toast.success("Download complete — run the installer to set up BC Elite QC.");
        } catch (err: any) {
            toast.error(`Download failed: ${err.message}`);
        } finally {
            setDownloading(false);
            setTimeout(() => setProgress(null), 1600);
        }
    };

    /* ── JSX ── */
    return (
        <div className={`qcr ${mounted ? "qcr--in" : ""}`}>

            {/* ── Background ── */}
            <div className="qcr-bg" aria-hidden>
                <div className="qcr-bg-grid" />
                <div className="qcr-bg-orb qcr-bg-orb-a" />
                <div className="qcr-bg-orb qcr-bg-orb-b" />
                <div className="qcr-bg-orb qcr-bg-orb-c" />
                <div className="qcr-noise" />
            </div>

            {/* ══════════════════════════════════════════
                HERO — split layout
            ══════════════════════════════════════════ */}
            <section className="qcr-hero">
                <div className="qcr-hero-left">

                    {/* eyebrow */}
                    <div className="qcr-eyebrow">
                        <span className="qcr-pulse-ring" />
                        <span className="qcr-eyebrow-dot" />
                        <span>BC Elite QC — Diagnostic Suite</span>
                        <span className="qcr-eyebrow-ver">{releaseTag}</span>
                    </div>

                    {/* heading */}
                    <h1 className="qcr-heading">
                        <span className="qcr-heading-main">BC Elite <br />Quality Checker</span>
                    </h1>

                    <p className="qcr-tagline">
                        Automates spec discovery, runs 7 component health tests,
                        logs diagnostic events and syncs battery analytics to the&nbsp;
                        <strong>Bizz&nbsp;Co&nbsp;Hub</strong> server — all from a single installer.
                    </p>

                    {/* CTA */}
                    <div className="qcr-cta-row">
                        <button
                            id="qcr-btn-run"
                            className="qcr-btn qcr-btn-run"
                            onClick={handleAutoRun}
                            disabled={running || downloading}
                        >
                            {running
                                ? <><RefreshCw size={17} className="qcr-spin" />Scanning…</>
                                : <><Play size={17} fill="currentColor" />Auto&nbsp;Run</>}
                        </button>

                        <button
                            id="qcr-btn-dl"
                            className="qcr-btn qcr-btn-dl"
                            onClick={handleDownload}
                            disabled={downloading || running}
                        >
                            {downloading
                                ? <><RefreshCw size={17} className="qcr-spin" />{progress ?? 0}%&nbsp;Downloading</>
                                : <><Download size={17} />Download&nbsp;Installer</>}
                        </button>
                    </div>

                    {/* progress bar */}
                    {progress !== null && (
                        <div className="qcr-prog-wrap">
                            <div className="qcr-prog-meta">
                                <span className="qcr-prog-file">{assetName}</span>
                                <span className="qcr-prog-pct">{progress}%</span>
                            </div>
                            <div className="qcr-prog-track">
                                <div className="qcr-prog-fill" style={{ width: `${progress}%` }} />
                                <div className="qcr-prog-glow" style={{ left: `${progress}%` }} />
                            </div>
                        </div>
                    )}



                    {/* quick stat chips */}
                    <div className="qcr-chips">
                        {[
                            { icon: <Package size={13} />, t: "7 Modules" },
                            { icon: <Shield size={13} />, t: "Admin Access" },
                            { icon: <Clock size={13} />, t: "Instant Launch" },
                            { icon: <Wifi size={13} />, t: "Cloud Sync" },
                            { icon: <Activity size={13} />, t: "Live Logs" },
                        ].map(c => (
                            <span key={c.t} className="qcr-chip">{c.icon}{c.t}</span>
                        ))}
                    </div>
                </div>

                {/* Right — scan panel */}
                <div className="qcr-scan-panel" aria-hidden>
                    <div className="qcr-scan-header">
                        <span className="qcr-scan-dot" />
                        <span className="qcr-scan-dot qcr-scan-dot--y" />
                        <span className="qcr-scan-dot qcr-scan-dot--g" />
                        <code className="qcr-scan-title">bc_elite_qc — diagnostic_modules</code>
                    </div>

                    {/* scan sweep line */}
                    <div className="qcr-scan-sweep" style={{ top: `${scanLine}%` }} />

                    <div className="qcr-scan-list">
                        {TOOLS.map((t, i) => (
                            <div
                                key={t.id}
                                className={`qcr-scan-row ${activeTool === t.id ? "qcr-scan-row--active" : ""}`}
                                style={{ animationDelay: `${i * 80}ms` }}
                                onMouseEnter={() => setActiveTool(t.id)}
                                onMouseLeave={() => setActiveTool(null)}
                            >
                                <span className="qcr-scan-status" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                                <t.icon size={14} style={{ color: t.color }} />
                                <span className="qcr-scan-name">{t.name}</span>
                                <code className="qcr-scan-file">{t.file}</code>
                                <span className="qcr-scan-tag" style={{ color: t.color, borderColor: `${t.color}40` }}>{t.tag}</span>
                            </div>
                        ))}
                    </div>

                    <div className="qcr-scan-footer">
                        <CheckCircle2 size={12} />
                        <span>7 modules loaded · ready to execute</span>
                    </div>
                </div>
            </section>



            {/* ══════════════════════════════════════════
                BUILD SPECS
            ══════════════════════════════════════════ */}
            <section className="qcr-section">
                <div className="qcr-section-label">
                    <Package size={14} />
                    <span>Build Specs</span>
                    <div className="qcr-section-line" />
                </div>
                <div className="qcr-specs-table">
                    {[
                        ["App Name", "BC Elite QC"],
                        ["Version", releaseTag],
                        ["Publisher", "Bizz Co Hub LLC"],
                        ["Platform", "Windows x64"],
                        ["Developer", "Rocky Alex"],
                    ].map(([k, v]) => (
                        <div key={k} className="qcr-spec-row">
                            <span className="qcr-spec-k">{k}</span>
                            <code className="qcr-spec-v">{v}</code>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                ONLINE WEB DIAGNOSTICS (APPLE STYLE)
            ══════════════════════════════════════════ */}
            <section className="qcr-section">
                <div className="qcr-section-label">
                    <Monitor size={14} />
                    <span>Web Diagnostics Suite</span>
                    <div className="qcr-section-line" />
                </div>
                
                <div className="qcr-apple-grid">
                    {ONLINE_TOOLS.map((t) => (
                        <Link href={t.href} key={t.id} className="qcr-apple-card">
                            <div className="qcr-apple-icon-wrapper" style={{ background: t.gradient }}>
                                <t.icon size={20} />
                            </div>
                            <h3 className="qcr-apple-title">{t.name}</h3>
                            <ArrowRight size={16} className="qcr-apple-arrow" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                MODAL
            ══════════════════════════════════════════ */}
            {showModal && (
                <div className="qcr-overlay" role="dialog" aria-modal>
                    <div className="qcr-modal">
                        <div className="qcr-modal-warn"><AlertTriangle size={26} /></div>
                        <h3 className="qcr-modal-h">Software Not Found</h3>
                        <p className="qcr-modal-p">BC Elite QC was not detected on this workstation. How would you like to proceed?</p>
                        <div className="qcr-modal-acts">
                            <button id="qcr-modal-install" className="qcr-btn qcr-btn-run" onClick={handleAutoInstall}>
                                <Download size={16} />Auto Download &amp; Install
                            </button>
                            <button id="qcr-modal-dl-only" className="qcr-btn qcr-btn-dl" onClick={e => { setShowModal(false); handleDownload(e as any); }}>
                                <Download size={16} />Download Only
                            </button>
                            <button id="qcr-modal-cancel" className="qcr-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
