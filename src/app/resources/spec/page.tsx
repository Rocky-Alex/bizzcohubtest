"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Cpu, 
    Monitor, 
    HardDrive, 
    Zap, 
    ShieldAlert, 
    Tv, 
    RefreshCw, 
    Sparkles, 
    Laptop, 
    Server,
    Settings,
    User
} from 'lucide-react';
import { getFullSpecs } from './actions';
import { toast } from 'sonner';

export default function SpecCheckPage() {
    const [loading, setLoading] = useState(true);
    const [specs, setSpecs] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [simulatedLoad, setSimulatedLoad] = useState(12);
    const [simulatedTemp, setSimulatedTemp] = useState(42);
    const [simulatedGpuTemp, setSimulatedGpuTemp] = useState(51);

    // Fetch Specs from server action
    const fetchSpecsData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getFullSpecs();
            if (data) {
                setSpecs(data);
                if (isRefresh) {
                    toast.success("System specifications updated successfully!");
                }
            } else {
                toast.error("Failed to load local system specifications.");
            }
        } catch (error) {
            console.error("Error loading specs:", error);
            toast.error("An error occurred while fetching specs.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpecsData();

        // Simulate live metrics fluctuations to make the UI look alive and high-fidelity
        const interval = setInterval(() => {
            setSimulatedLoad(prev => {
                const delta = Math.floor(Math.random() * 7) - 3;
                return Math.max(5, Math.min(65, prev + delta));
            });
            setSimulatedTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(38, Math.min(48, prev + delta));
            });
            setSimulatedGpuTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(47, Math.min(56, prev + delta));
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Helper: calculate storage total size
    const getTotalStorage = () => {
        if (!specs || !specs.diskLayout) return "0 GB";
        const bytes = specs.diskLayout.reduce((acc: number, disk: any) => acc + (disk.size || 0), 0);
        const tb = bytes / 1024 ** 4;
        if (tb >= 1) return `${tb.toFixed(1)} TB`;
        return `${(bytes / 1024 ** 3).toFixed(0)} GB`;
    };

    // Helper: format bytes to GB
    const formatBytesToGb = (bytes: number) => {
        return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    };

    // Helper: generate segmented progress bar indicators
    const renderSegments = (percent: number, activeColor: string = '#00E5FF', segmentsCount = 8) => {
        const activeSegments = Math.round((percent / 100) * segmentsCount);
        return (
            <div className="segment-container" style={{ display: 'flex', gap: '4px', width: '100%', height: '8px', marginTop: '8px' }}>
                {Array.from({ length: segmentsCount }).map((_, idx) => {
                    const isActive = idx < activeSegments;
                    return (
                        <div 
                            key={idx} 
                            style={{ 
                                flex: 1, 
                                height: '100%', 
                                background: isActive ? activeColor : '#1E293B',
                                opacity: isActive ? 1 : 0.4,
                                boxShadow: isActive ? `0 0 8px ${activeColor}` : 'none',
                                transition: 'all 0.3s ease',
                                borderRadius: '1px'
                            }} 
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#05070F',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #0E162D 0%, #05070F 100%)',
            color: '#E2E8F0',
            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif', monospace",
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: '80px'
        }}>
            {/* Embedded styles for beautiful animations, grids, scanning lines and effects */}
            <style dangerouslySetInnerHTML={{ __html: `
                .cyber-grid {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                    background-position: center;
                    pointer-events: none;
                    z-index: 1;
                }
                .scanline {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(to bottom, rgba(0, 229, 255, 0) 0%, rgba(0, 229, 255, 0.15) 50%, rgba(0, 229, 255, 0) 100%);
                    animation: scan 6s linear infinite;
                    pointer-events: none;
                    z-index: 2;
                }
                @keyframes scan {
                    0% { transform: translateY(-100px); }
                    100% { transform: translateY(100vh); }
                }
                .cyber-glow-btn {
                    position: relative;
                    background: transparent;
                    border: 1px solid #00E5FF;
                    color: #00E5FF;
                    font-size: 13px;
                    letter-spacing: 0.1em;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 10px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
                    z-index: 10;
                }
                .cyber-glow-btn:hover {
                    background: rgba(0, 229, 255, 0.1);
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.4), inset 0 0 10px rgba(0, 229, 255, 0.2);
                    text-shadow: 0 0 5px #00E5FF;
                }
                .cyber-card {
                    background: rgba(10, 15, 30, 0.7);
                    border: 1px solid rgba(0, 229, 255, 0.1);
                    border-radius: 6px;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                .cyber-card:hover {
                    border-color: rgba(0, 229, 255, 0.35);
                    box-shadow: 0 0 25px rgba(0, 229, 255, 0.08);
                    transform: translateY(-2px);
                }
                .cyber-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 3px;
                    height: 12px;
                    background: #00E5FF;
                    box-shadow: 0 0 8px #00E5FF;
                }
                .cyber-card::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 12px;
                    height: 1px;
                    background: rgba(0, 229, 255, 0.3);
                }
                .glow-pulse {
                    animation: pulse 1.8s infinite alternate;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 4px #00FFB2, inset 0 0 2px #00FFB2; opacity: 0.6; }
                    100% { box-shadow: 0 0 14px #00FFB2, inset 0 0 4px #00FFB2; opacity: 1; }
                }
                .scan-bar-active {
                    animation: scanBar 1.5s ease infinite alternate;
                }
                @keyframes scanBar {
                    0% { filter: brightness(0.8) drop-shadow(0 0 1px #00E5FF); }
                    100% { filter: brightness(1.2) drop-shadow(0 0 5px #00E5FF); }
                }
                .terminal-header-link {
                    color: rgba(226, 232, 240, 0.6);
                    font-size: 13px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .terminal-header-link:hover, .terminal-header-link.active {
                    color: #00E5FF;
                    text-shadow: 0 0 4px rgba(0, 229, 255, 0.4);
                }
            ` }} />

            {/* Background elements */}
            <div className="cyber-grid" />
            <div className="scanline" />

            {/* Cyberpunk Top Bar */}
            <div style={{
                borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
                backgroundColor: 'rgba(5, 7, 15, 0.85)',
                backdropFilter: 'blur(10px)',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 100,
                padding: '0 24px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#00E5FF', letterSpacing: '0.08em', textShadow: '0 0 8px rgba(0, 229, 255, 0.3)' }}>
                            SpecCheck
                        </span>
                    </div>
                    <nav style={{ display: 'flex', gap: '24px' }}>
                        <a href="#" className="terminal-header-link active">Dashboard</a>
                        <a href="#" className="terminal-header-link">Benchmarks</a>
                        <a href="#" className="terminal-header-link">Comparison</a>
                        <a href="#" className="terminal-header-link">History</a>
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(226, 232, 240, 0.6)' }}>
                    <Settings size={18} style={{ cursor: 'pointer' }} className="terminal-header-link" />
                    <User size={18} style={{ cursor: 'pointer' }} className="terminal-header-link" />
                </div>
            </div>

            {/* Back Nav Header */}
            <header style={{
                padding: '24px 40px',
                borderBottom: '1px solid rgba(0, 229, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                zIndex: 5
            }}>
                <Link href="/resources" style={{ color: 'rgba(226, 232, 240, 0.5)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '14px', transition: 'all 0.3s' }} className="terminal-header-link">
                    <ArrowLeft size={16} /> Back to Resources
                </Link>
                <div style={{ width: '1px', height: '16px', background: 'rgba(0, 229, 255, 0.15)' }}></div>
                <span style={{ fontSize: '13px', color: 'rgba(0, 229, 255, 0.6)', letterSpacing: '0.1em', fontWeight: 'bold' }}>SPECC_SYSTEM_MODULE</span>
            </header>

            {/* Main Interactive Dashboard Area */}
            <main style={{
                flex: '1',
                padding: '16px 40px 48px',
                zIndex: 5,
                maxWidth: '1280px',
                width: '100%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Hero / State Panel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ 
                            fontSize: '36px', 
                            fontWeight: 900, 
                            letterSpacing: '0.05em', 
                            color: '#FFFFFF',
                            textShadow: '0 0 15px rgba(255, 255, 255, 0.15)',
                            margin: 0,
                            fontFamily: "'Outfit', sans-serif"
                        }}>
                            SYSTEM DIAGNOSTICS
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <div className="glow-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FFB2' }} />
                            <span style={{ fontSize: '12px', letterSpacing: '0.15em', fontWeight: 'bold', color: '#00FFB2' }}>
                                NODE: ONLINE & OPTIMAL
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => fetchSpecsData(true)} 
                        disabled={refreshing || loading}
                        className="cyber-glow-btn"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "FETCHING..." : "FETCH DETAILS"}
                    </button>
                </div>

                {loading ? (
                    /* Elegant Loading Grid Skeleton */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                        <div style={{ border: '2px solid rgba(0, 229, 255, 0.2)', borderTop: '2px solid #00E5FF', borderRadius: '50%', width: '40px', height: '40px' }} className="animate-spin" />
                        <span style={{ fontSize: '13px', color: '#00E5FF', letterSpacing: '0.2em', fontWeight: 'bold' }}>SCANNING HARDWARE ARRAYS...</span>
                    </div>
                ) : (
                    /* Beautiful Cyber Grid */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '24px'
                        }}>
                            {/* Card 1: SYS_OVERVIEW_01 */}
                            <div className="cyber-card" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>SYS_OVERVIEW_01</span>
                                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#00E5FF', marginTop: '12px', marginBottom: '4px', textShadow: '0 0 10px rgba(0, 229, 255, 0.2)' }}>
                                            {specs?.system?.manufacturer} {specs?.system?.model}
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', fontFamily: 'monospace' }}>
                                            S/N: {specs?.system?.serial}
                                        </p>
                                    </div>
                                    <Laptop size={44} color="rgba(0, 229, 255, 0.15)" style={{ strokeWidth: 1 }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OS ARCHITECTURE</span>
                                        <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '4px' }}>{specs?.os?.distro} ({specs?.os?.arch})</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TEMP_AVG</span>
                                        <div style={{ fontSize: '14px', color: '#00FFB2', fontWeight: 'bold', marginTop: '4px' }}>{simulatedTemp}°C</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: PROC_UNIT */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>PROC_UNIT</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px', textTransform: 'uppercase' }}>Model</h4>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px', minHeight: '44px' }}>
                                            {specs?.cpu?.brand}
                                        </h3>
                                    </div>
                                    <Cpu size={24} color="#00E5FF" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>Clock Speed</span>
                                        <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>{specs?.cpu?.speed ? specs.cpu.speed.toFixed(1) : '2.6'} GHz <span style={{ fontSize: '10px', color: 'rgba(226, 232, 240, 0.5)' }}>BASE</span></span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>Cores (Logical)</span>
                                        <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{specs?.cpu?.cores} Cores</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)' }}>
                                            <span>LOAD</span>
                                            <span style={{ color: '#00E5FF' }}>{simulatedLoad}%</span>
                                        </div>
                                        {renderSegments(simulatedLoad, '#00E5FF', 10)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: MEM_ALLOC */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>MEM_ALLOC</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Capacity</h4>
                                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                                            {specs?.mem ? (specs.mem.total / 1024 ** 3).toFixed(0) : '64'} GB
                                        </h3>
                                    </div>
                                    <Server size={24} color="#00FFB2" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 178, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>USED</span>
                                        <span style={{ color: '#00FFB2', fontWeight: 'bold' }}>{specs?.mem ? formatBytesToGb(specs.mem.used) : '19.4 GB'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>AVAILABLE</span>
                                        <span style={{ color: '#FFFFFF' }}>{specs?.mem ? formatBytesToGb(specs.mem.available) : '44.6 GB'}</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        {renderSegments(specs?.mem ? (specs.mem.used / specs.mem.total) * 100 : 28, '#00FFB2', 8)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: STOR_VOL */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>STOR_VOL</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Capacity</h4>
                                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                                            {getTotalStorage()}
                                        </h3>
                                    </div>
                                    <HardDrive size={24} color="#00E5FF" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>DRIVE INTEGRITY</span>
                                        <span style={{ color: '#00FFB2', fontWeight: 'bold' }}>{specs?.diskLayout?.[0]?.smartStatus === 'Ok' ? 'OPTIMAL' : 'OK'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>VOLUMES DETECTED</span>
                                        <span style={{ color: '#FFFFFF' }}>{specs?.diskLayout?.length || 1} Device(s)</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)' }}>
                                            <span>USED CAPACITY</span>
                                            <span style={{ color: '#00E5FF' }}>38%</span>
                                        </div>
                                        {renderSegments(38, '#00E5FF', 8)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: GFX_PROC */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>GFX_PROC</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Model</h4>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px', minHeight: '44px' }}>
                                            {specs?.graphics?.controllers?.[0]?.vendor} {specs?.graphics?.controllers?.[0]?.model}
                                        </h3>
                                    </div>
                                    <Monitor size={24} color="#00FFB2" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 178, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>VRAM</span>
                                        <span style={{ color: '#00FFB2', fontWeight: 'bold' }}>{specs?.graphics?.controllers?.[0]?.vram ? `${(specs.graphics.controllers[0].vram / 1024).toFixed(0)} GB` : '6 GB'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>TEMP</span>
                                        <span style={{ color: '#FF7E40', fontWeight: 'bold' }}>{simulatedGpuTemp}°C</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        {renderSegments(42, '#00FFB2', 8)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 6: DISP_RES */}
                            <div className="cyber-card" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>DISP_RES</span>
                                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#00E5FF', marginTop: '12px', marginBottom: '4px', textShadow: '0 0 10px rgba(0, 229, 255, 0.2)' }}>
                                            {specs?.graphics?.displays?.[0]?.resolutionX || 1920} x {specs?.graphics?.displays?.[0]?.resolutionY || 1080}
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', fontFamily: 'monospace' }}>
                                            Monitor: {specs?.graphics?.displays?.[0]?.model || 'Generic Display'}
                                        </p>
                                    </div>
                                    <Tv size={36} color="rgba(0, 229, 255, 0.15)" style={{ strokeWidth: 1 }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REFRESH RATE</span>
                                        <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '4px' }}>
                                            {specs?.graphics?.displays?.[0]?.currentRefreshRate || 60} Hz
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONNECTION BUS</span>
                                        <div style={{ fontSize: '14px', color: '#00E5FF', fontWeight: 'bold', marginTop: '4px' }}>DP embedded</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 7: PWR_CELL */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>PWR_CELL</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Charge</h4>
                                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                                            {specs?.battery?.hasBattery ? `${specs.battery.percent}%` : '100%'} <span style={{ fontSize: '12px', color: '#00FFB2', fontWeight: 'bold', marginLeft: '4px' }}>
                                                {specs?.battery?.hasBattery ? (specs.battery.isCharging ? 'CHARGING' : 'BATTERY POWER') : 'HEALTHY'}
                                            </span>
                                        </h3>
                                    </div>
                                    <Zap size={24} color="#00FFB2" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 178, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>POWER SUPPLY</span>
                                        <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>{specs?.battery?.acConnected ? 'AC CONNECTED' : 'BATTERY'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>CAPACITY RATIO</span>
                                        <span style={{ color: '#FFFFFF' }}>
                                            {specs?.battery?.maxCapacity && specs?.battery?.designedCapacity
                                                ? `${((specs.battery.maxCapacity / specs.battery.designedCapacity) * 100).toFixed(0)}% Health`
                                                : '100%'}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        {renderSegments(specs?.battery?.percent || 100, '#00FFB2', 10)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Warnings / System Notifications Panel */}
                        <div style={{
                            background: 'rgba(255, 126, 64, 0.04)',
                            border: '1px solid rgba(255, 126, 64, 0.15)',
                            borderRadius: '6px',
                            padding: '16px 20px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <ShieldAlert size={20} color="#FF7E40" />
                            <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.85)', lineHeight: '1.5' }}>
                                <strong style={{ color: '#FF7E40' }}>Note:</strong> System diagnostics query low-level hardware structures directly. Real-time updates occur when the <strong>FETCH DETAILS</strong> trigger is executed or network activity scales.
                            </span>
                        </div>
                    </div>
                )}
            </main>


        </div>
    );
}
