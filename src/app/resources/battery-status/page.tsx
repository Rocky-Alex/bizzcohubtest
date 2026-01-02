"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Battery, AlertTriangle, Terminal, UploadCloud, FileCode, CheckCircle, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';

interface BatteryManager extends EventTarget {
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    addEventListener(type: string, listener: EventListener | EventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListener | EventListenerObject | null, options?: boolean | EventListenerOptions): void;
}

const BatteryMonitor = () => {
    const [battery, setBattery] = useState<{
        level: number;
        charging: boolean;
        supported: boolean;
    }>({ level: 0, charging: false, supported: true });

    useEffect(() => {
        // @ts-ignore
        if (!("getBattery" in navigator)) {
            setBattery((prev) => ({ ...prev, supported: false }));
            return;
        }

        let batteryInstance: BatteryManager;

        const updateBatteryInfo = (bat: BatteryManager) => {
            setBattery({
                level: bat.level * 100,
                charging: bat.charging,
                supported: true,
            });
        };

        // @ts-ignore
        (navigator as any).getBattery().then((bat: BatteryManager) => {
            batteryInstance = bat;
            updateBatteryInfo(bat);

            bat.addEventListener("levelchange", () => updateBatteryInfo(bat));
            bat.addEventListener("chargingchange", () => updateBatteryInfo(bat));
        });

        return () => {
            if (batteryInstance) {
                batteryInstance.removeEventListener("levelchange", () => { });
                batteryInstance.removeEventListener("chargingchange", () => { });
            }
        };
    }, []);

    if (!battery.supported) {
        return (
            <div style={{
                padding: '32px',
                maxWidth: '420px',
                margin: '0 auto',
                backgroundColor: '#171717',
                borderRadius: '16px',
                border: '1px solid #262626',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%' }}>
                    <AlertTriangle size={32} color="#eab308" />
                </div>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e5e5e5', marginBottom: '8px' }}>
                        Live Status Unavailable
                    </h3>
                    <p style={{ color: '#a3a3a3', fontSize: '14px', lineHeight: '1.6' }}>
                        Your browser or device does not support the Real-time Battery API.
                        This feature is typically available on <strong>Chrome/Edge</strong> for laptops.
                    </p>
                </div>
                <button
                    onClick={() => setBattery({ level: 85, charging: true, supported: true })}
                    style={{
                        marginTop: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#525252',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    View Demo Interface
                </button>
            </div>
        );
    }

    // Determine Color
    let barColor = '#22c55e'; // green-500
    if (battery.level <= 20) barColor = '#ef4444'; // red-500
    else if (battery.level <= 50) barColor = '#eab308'; // yellow-500

    return (
        <div style={{
            padding: '24px',
            maxWidth: '384px', // max-w-sm
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid #e5e5e5',
            color: '#1f2937'
        }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Battery Status</h2>

            {/* Battery Visual */}
            <div style={{
                position: 'relative',
                width: '96px', // w-24
                height: '48px', // h-12
                border: '4px solid #374151', // border-gray-700
                borderRadius: '6px',
                padding: '4px'
            }}>
                <div
                    style={{
                        height: '100%',
                        width: `${battery.level}%`,
                        backgroundColor: barColor,
                        borderRadius: '2px',
                        transition: 'all 500ms'
                    }}
                />
                {/* Battery Nipple */}
                <div style={{
                    position: 'absolute',
                    right: '-11px',
                    top: '8px',
                    width: '6px',
                    height: '16px',
                    backgroundColor: '#374151',
                    borderRadius: '0 2px 2px 0'
                }} />
            </div>

            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '36px', fontWeight: '900', color: '#111827' }}>
                    {Math.round(battery.level)}%
                </span>
                <p style={{ marginTop: '8px', fontWeight: '500', color: battery.charging ? '#2563eb' : '#6b7280' }}>
                    {battery.charging ? "⚡ Charging" : "🔋 Discharging"}
                </p>
            </div>
        </div>
    );
};

export default function BatteryPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [clientDetails, setClientDetails] = useState<any | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const reportId = searchParams.get('reportId');
        if (reportId) {
            handleAutoScan(reportId);
        }
    }, [searchParams]);

    const handleAutoScan = async (id: string) => {
        setAnalyzing(true);
        try {
            const res = await fetch(`/api/battery-check?id=${id}`);
            const data = await res.json();
            if (data.xmlData) {
                parseXMLReport(data.xmlData);
                // Clean URL
                router.replace('/resources/battery-status');
            } else {
                toast.error("Cloud report not found or expired.");
            }
        } catch (e) {
            toast.error("Failed to fetch report.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setAnalyzing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            parseXMLReport(content);
        };
        reader.readAsText(file);
    };

    const parseXMLReport = (xmlContent: string) => {
        try {
            const batteryBlockMatch = xmlContent.match(/<Battery>([\s\S]*?)<\/Battery>/);
            const batteryBlock = batteryBlockMatch ? batteryBlockMatch[1] : xmlContent;

            const extract = (tag: string) => {
                const match = batteryBlock.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
                return match ? match[1] : 'Not Available';
            };

            const formatNum = (val: string) => {
                const num = parseInt(val);
                return isNaN(num) ? val : num.toLocaleString();
            };

            const details = {
                name: "Primary",
                manufacturer: extract('Manufacturer'),
                serialNumber: extract('SerialNumber'),
                chemistry: extract('Chemistry'),
                designCapacity: `${formatNum(extract('DesignCapacity'))} mWh`,
                fullChargeCapacity: `${formatNum(extract('FullChargeCapacity'))} mWh`,
                cycleCount: extract('CycleCount')
            };

            setClientDetails(details);
            toast.success("Battery Report Analyzed Successfully");
        } catch (err) {
            toast.error("Invalid XML format. Make sure to run 'powercfg /batteryreport /xml'");
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const downloadAutoScanScript = () => {
        const apiUrl = `${window.location.origin}/api/battery-check`;
        const resultUrl = `${window.location.origin}/resources/battery-status`;

        // Powershell script is more robust for HTTPS/Parsing
        const scriptContent = `
@echo off
echo ==========================================
echo      BizzcoHub Battery Diagnostics
echo ==========================================
echo.
echo 1. Generating Battery Report...
powercfg /batteryreport /xml /output "%TEMP%\\battery_report.xml"

echo 2. Uploading Data for Analysis...
powershell -Command "$res = Invoke-RestMethod -Uri '${apiUrl}' -Method Post -InFile '%TEMP%\\battery_report.xml' -ContentType 'text/xml'; $url = '${resultUrl}?reportId=' + $res.id; Start-Process $url"

echo.
echo Done! Please check your browser.
pause
        `;

        const blob = new Blob([scriptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AutoScan_Battery.bat'; // Windows Batch File
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Script Downloaded. Run it to scan!");
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <header style={{
                padding: '24px',
                borderBottom: '1px solid #262626',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <Link href="/resources" style={{ color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <ArrowLeft size={20} /> Back
                </Link>
                <div style={{ width: '1px', height: '24px', background: '#404040' }}></div>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>System Dashboard</h1>
            </header>

            <main style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 20px',
                gap: '40px'
            }}>
                <BatteryMonitor />

                {/* Analysis Zone */}
                <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {!clientDetails && (
                        <div style={{
                            backgroundColor: '#171717',
                            borderRadius: '24px',
                            border: '1px solid #262626',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px'
                        }}>
                            {/* OPTION 1: ONE-CLICK ACTION */}
                            <div style={{
                                padding: '24px',
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                borderRadius: '16px',
                                border: '1px solid #334155',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#38bdf8' }}>Option 1: One-Click Auto Scan</h3>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                                    Automatically generate, upload, and view your battery health.
                                </p>
                                <button
                                    onClick={downloadAutoScanScript}
                                    style={{
                                        background: '#0ea5e9',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                                    }}
                                >
                                    <Play size={20} fill="currentColor" />
                                    Download & Run Scanner
                                </button>
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
                                    *Downloads a small .bat file. Run it to see magic.
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ height: '1px', background: '#262626', flex: 1 }}></div>
                                <span style={{ color: '#525252', fontSize: '12px', fontWeight: 'bold' }}>OR MANUALLY</span>
                                <div style={{ height: '1px', background: '#262626', flex: 1 }}></div>
                            </div>

                            {/* OPTION 2: DRAG DROP */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ minWidth: '40px', height: '40px', borderRadius: '10px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UploadCloud size={20} color="#94a3b8" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Option 2: Manual Upload</h3>
                                    <p style={{ color: '#a3a3a3', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                                        If you prefer, manually run <code style={{ color: '#e2e8f0', background: '#262626', padding: '2px 4px', borderRadius: '4px' }}>powercfg /batteryreport /xml</code> and drop the file below.
                                    </p>

                                    <label style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed #404040',
                                        borderRadius: '12px',
                                        padding: '32px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: analyzing ? '#262626' : 'transparent'
                                    }}>
                                        <input type="file" accept=".xml" onChange={handleFileUpload} style={{ display: 'none' }} />
                                        <FileCode size={32} color="#525252" style={{ marginBottom: '12px' }} />
                                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#a3a3a3' }}>
                                            {analyzing ? "Analyzing..." : "Click to Upload XML Report"}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {clientDetails && (
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '24px', color: '#06b6d4', fontWeight: 'bold' }}>Device Diagnostic Results</h2>
                                <button
                                    onClick={() => setClientDetails(null)}
                                    style={{ background: 'transparent', border: 'none', color: '#525252', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Analyze Another
                                </button>
                            </div>

                            <div style={{
                                background: '#171717',
                                border: '1px solid #262626',
                                borderRadius: '16px',
                                padding: '24px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                fontSize: '14px'
                            }}>
                                <div style={{ gridColumn: '1 / -1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '13px', fontWeight: 'bold' }}>
                                    <CheckCircle size={14} /> Report Verified
                                </div>

                                <div style={{ color: '#a3a3a3', fontWeight: '500' }}>MANUFACTURER</div>
                                <div style={{ color: 'white', fontFamily: 'monospace' }}>{clientDetails.manufacturer}</div>

                                <div style={{ width: '100%', height: '1px', background: '#262626', gridColumn: '1 / -1' }}></div>

                                <div style={{ color: '#a3a3a3', fontWeight: '500' }}>SERIAL NUMBER</div>
                                <div style={{ color: 'white', fontFamily: 'monospace' }}>{clientDetails.serialNumber}</div>

                                <div style={{ width: '100%', height: '1px', background: '#262626', gridColumn: '1 / -1' }}></div>

                                <div style={{ color: '#a3a3a3', fontWeight: '500' }}>CHEMISTRY</div>
                                <div style={{ color: 'white', fontFamily: 'monospace' }}>{clientDetails.chemistry}</div>

                                <div style={{ width: '100%', height: '1px', background: '#262626', gridColumn: '1 / -1' }}></div>

                                <div style={{ color: '#a3a3a3', fontWeight: '500' }}>DESIGN CAPACITY</div>
                                <div style={{ color: 'white', fontFamily: 'monospace' }}>{clientDetails.designCapacity}</div>

                                <div style={{ width: '100%', height: '1px', background: '#262626', gridColumn: '1 / -1' }}></div>

                                <div style={{ color: '#a3a3a3', fontWeight: '500' }}>FULL CHARGE CAPACITY</div>
                                <div style={{ color: 'white', fontFamily: 'monospace' }}>{clientDetails.fullChargeCapacity}</div>

                                <div style={{ width: '100%', height: '1px', background: '#262626', gridColumn: '1 / -1' }}></div>

                                <div style={{ color: '#a3a3a3', fontWeight: '500' }}>CYCLE COUNT</div>
                                <div style={{ color: '#eab308', fontFamily: 'monospace', fontWeight: 'bold' }}>{clientDetails.cycleCount}</div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
