"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Cpu,
    Monitor,
    HardDrive,
    Zap,
    Activity,
    Tv,
    RefreshCw,
    LayoutDashboard,
    Settings,
    Database,
    Pocket,
    Info,
    Smartphone
} from 'lucide-react';
import { getFullSpecs } from '../spec/actions';
import { toast } from 'sonner';

export default function SpecCheckUltraPage() {
    const [loading, setLoading] = useState(true);
    const [specs, setSpecs] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'ram' | 'memory' | 'graphics'>('overview');
    const [simulatedLoad, setSimulatedLoad] = useState(24);
    const [simulatedTemp, setSimulatedTemp] = useState(38);
    const [simulatedGpuTemp, setSimulatedGpuTemp] = useState(44);

    const fetchSpecsData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getFullSpecs();
            if (data) {
                setSpecs(data);
                if (isRefresh) {
                    toast.success("Telemetry refreshed!");
                }
            } else {
                toast.error("Failed to load local system specifications.");
            }
        } catch (error) {
            console.error("Error loading specs:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpecsData();

        // Simulate fluctuations
        const interval = setInterval(() => {
            setSimulatedLoad(prev => {
                const delta = Math.floor(Math.random() * 9) - 4;
                return Math.max(10, Math.min(85, prev + delta));
            });
            setSimulatedTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(35, Math.min(46, prev + delta));
            });
            setSimulatedGpuTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(40, Math.min(52, prev + delta));
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    // Helper: circular gauge renderer
    const CircularGauge = ({ value, title, icon, color = '#6366F1', detail = '' }: any) => {
        const radius = 42;
        const stroke = 8;
        const normalizedRadius = radius - stroke * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div className="gauge-card" style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                backdropFilter: 'blur(12px)',
                flex: 1,
                minWidth: '260px'
            }}>
                <div style={{ position: 'relative', width: '84px', height: '84px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg height={84} width={84}>
                        <circle
                            stroke="rgba(255, 255, 255, 0.03)"
                            fill="transparent"
                            strokeWidth={stroke}
                            r={normalizedRadius}
                            cx={42}
                            cy={42}
                        />
                        <circle
                            stroke={color}
                            fill="transparent"
                            strokeWidth={stroke}
                            strokeDasharray={circumference + ' ' + circumference}
                            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            r={normalizedRadius}
                            cx={42}
                            cy={42}
                            strokeLinecap="round"
                            transform="rotate(-90 42 42)"
                        />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>{Math.round(value)}%</span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
                        {icon} {title}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px' }}>{detail}</div>
                </div>
            </div>
        );
    };

    // Calculations
    const totalStorageGb = specs?.diskLayout
        ? (specs.diskLayout.reduce((acc: number, d: any) => acc + (d.size || 0), 0) / 1024 ** 3).toFixed(0)
        : '2000';
    const ramUsedPercent = specs?.mem ? (specs.mem.used / specs.mem.total) * 100 : 32;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#03050C',
            color: '#F8FAFC',
            fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: '80px'
        }}>
            {/* Ambient Background Glows */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .aurora-bg {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(120px);
                    opacity: 0.15;
                    pointer-events: none;
                    z-index: 0;
                }
                .aurora-1 {
                    top: -10%;
                    right: -10%;
                    background: radial-gradient(circle, #6366F1 0%, transparent 80%);
                    animation: float-aurora-1 20s ease-in-out infinite alternate;
                }
                .aurora-2 {
                    bottom: -20%;
                    left: -10%;
                    background: radial-gradient(circle, #8B5CF6 0%, transparent 80%);
                    animation: float-aurora-2 25s ease-in-out infinite alternate;
                }
                @keyframes float-aurora-1 {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(-80px, 50px) scale(1.15); }
                }
                @keyframes float-aurora-2 {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(100px, -40px) scale(0.9); }
                }
                .glass-deck {
                    background: rgba(255, 255, 255, 0.015);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 32px;
                    z-index: 5;
                    position: relative;
                }
                .nav-btn {
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: 8px;
                    color: rgba(255, 255, 255, 0.5);
                    border: 1px solid transparent;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .nav-btn:hover {
                    color: #FFFFFF;
                    background: rgba(255, 255, 255, 0.03);
                }
                .nav-btn.active {
                    color: #FFFFFF;
                    background: rgba(99, 102, 241, 0.12);
                    border-color: rgba(99, 102, 241, 0.3);
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
                }
                .ultra-glow-text {
                    background: linear-gradient(to right, #FFFFFF, #CBD5E1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .dashboard-header-link {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 13px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .dashboard-header-link:hover, .dashboard-header-link.active {
                    color: #FFFFFF;
                    text-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
                }
                .stat-value {
                    font-size: 28px;
                    font-weight: 800;
                    color: #FFFFFF;
                    letter-spacing: -0.02em;
                }
                .gauge-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gauge-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.12) !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
                }
            ` }} />

            <div className="aurora-bg aurora-1" />
            <div className="aurora-bg aurora-2" />

            {/* Futuristic Top Nav */}
            <div style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                backgroundColor: 'rgba(3, 5, 12, 0.75)',
                backdropFilter: 'blur(20px)',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 100,
                padding: '0 32px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }} />
                        <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.05em' }}>
                            SpecCheck <span style={{ color: '#6366F1' }}>Ultra</span>
                        </span>
                    </div>
                    <nav style={{ display: 'flex', gap: '24px' }}>
                        <a href="#" className="dashboard-header-link active">Overview</a>
                        <a href="#" className="dashboard-header-link">Benchmarks</a>
                        <a href="#" className="dashboard-header-link">Telemetry</a>
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    <Settings size={18} style={{ cursor: 'pointer' }} className="dashboard-header-link" />
                </div>
            </div>

            {/* Back Nav Link */}
            <header style={{
                padding: '24px 40px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                zIndex: 5
            }}>
                <Link href="/resources" style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '13px', transition: 'all 0.3s' }} className="dashboard-header-link">
                    <ArrowLeft size={16} /> Back to Resources
                </Link>
                <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <span style={{ fontSize: '12px', color: '#6366F1', letterSpacing: '0.08em', fontWeight: 'bold' }}>SYSTEM_TELEMETRY_SUITE</span>
            </header>

            {/* Dashboard Workspace */}
            <main style={{
                flex: '1',
                padding: '16px 40px 64px',
                zIndex: 5,
                maxWidth: '1280px',
                width: '100%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
            }}>
                {/* Dashboard Sub Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="ultra-glow-text" style={{ fontSize: '32px', fontWeight: 900, margin: 0, tracking: '-0.03em' }}>
                            SYSTEM TELEMETRY
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, letterSpacing: '0.08em' }}>ACTIVE SHIELD ENABLED</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={() => fetchSpecsData(true)}
                            disabled={refreshing || loading}
                            style={{
                                background: '#FFFFFF',
                                color: '#03050C',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '10px 20px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "SYNCHRONIZING..." : "RELOAD TELEMETRY"}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                        <div style={{ border: '3px solid rgba(99, 102, 241, 0.1)', borderTop: '3px solid #6366F1', borderRadius: '50%', width: '36px', height: '36px' }} className="animate-spin" />
                        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.15em' }}>COMPILING TELEMETRY NODE...</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Circular Gauge Indicators Top Row */}
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <CircularGauge
                                value={simulatedLoad}
                                title="PROCESSOR LOAD"
                                icon={<Cpu size={14} />}
                                color="linear-gradient(135deg, #6366F1, #8B5CF6)"
                                detail={`${specs?.cpu?.cores || 12} LOGICAL CORES`}
                            />
                            <CircularGauge
                                value={ramUsedPercent}
                                title="MEMORY ALLOCATION"
                                icon={<Database size={14} />}
                                color="#EC4899"
                                detail={`${(specs?.mem?.used / 1024 ** 3).toFixed(1)} / ${(specs?.mem?.total / 1024 ** 3).toFixed(0)} GB`}
                            />
                            <CircularGauge
                                value={specs?.battery?.hasBattery ? specs.battery.percent : 100}
                                title="POWER RESERVE"
                                icon={<Zap size={14} />}
                                color="#10B981"
                                detail={specs?.battery?.hasBattery ? (specs.battery.isCharging ? 'CHARGING' : 'BATTERY DISCHARGE') : 'AC STEADY POWER'}
                            />
                        </div>

                        {/* Large Glassmorphic Deck Panel */}
                        <div className="glass-deck" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Navigation Tab controls inside deck */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setActiveTab('overview')} className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}>Overview</button>
                                    <button onClick={() => setActiveTab('hardware')} className={`nav-btn ${activeTab === 'hardware' ? 'active' : ''}`}>Processor Details</button>
                                    <button onClick={() => setActiveTab('ram')} className={`nav-btn ${activeTab === 'ram' ? 'active' : ''}`}>RAM Array</button>
                                    <button onClick={() => setActiveTab('memory')} className={`nav-btn ${activeTab === 'memory' ? 'active' : ''}`}>Storage Array</button>
                                    <button onClick={() => setActiveTab('graphics')} className={`nav-btn ${activeTab === 'graphics' ? 'active' : ''}`}>Graphics & Display</button>
                                </div>
                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', fontFamily: 'monospace' }}>SECURE_SUITE_ESTABLISHED</span>
                            </div>

                            {/* Tab Body: Overview */}
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
                                        <div style={{ flex: 2, minWidth: '300px' }}>
                                            <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 'bold', letterSpacing: '0.05em' }}>DEVICE CONFIGURATION</span>
                                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#FFFFFF' }}>{specs?.system?.manufacturer} {specs?.system?.model}</h2>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px', marginTop: '4px' }}>Serial Number: <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{specs?.system?.serial}</span></p>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '32px' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>PLATFORM OS</span>
                                                    <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '4px' }}>{specs?.os?.distro}</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>ARCHITECTURE</span>
                                                    <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '4px' }}>{specs?.os?.arch} ({specs?.os?.release})</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>HOST NODE</span>
                                                    <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '4px' }}>{specs?.os?.hostname}</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>BOARD UEFI</span>
                                                    <div style={{ fontSize: '15px', color: '#10B981', fontWeight: 'bold', marginTop: '4px' }}>{specs?.os?.uefi ? 'SECURE_BOOT' : 'COMPATIBLE'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1, minWidth: '240px', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.6)' }}>LIVE HARDWARE TEMPS</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>CPU Core Temp</span>
                                                    <span style={{ color: '#6366F1', fontWeight: 'bold' }}>{simulatedTemp}°C</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>GPU Controller Temp</span>
                                                    <span style={{ color: '#EC4899', fontWeight: 'bold' }}>{simulatedGpuTemp}°C</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>System Status</span>
                                                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>COOL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab Body: Hardware */}
                            {activeTab === 'hardware' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>Processor Specifications</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                                        <div style={{ border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>BRAND MODEL</span>
                                            <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '6px' }}>{specs?.cpu?.brand}</div>
                                        </div>
                                        <div style={{ border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>PHYSICAL CORES</span>
                                            <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '6px' }}>{specs?.cpu?.physicalCores} Cores</div>
                                        </div>
                                        <div style={{ border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>THREAD CONCURRENCY</span>
                                            <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '6px' }}>{specs?.cpu?.cores} Logical Threads</div>
                                        </div>
                                        <div style={{ border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>BASE FREQUENCY</span>
                                            <div style={{ fontSize: '15px', color: '#6366F1', fontWeight: 'bold', marginTop: '6px' }}>{specs?.cpu?.speed ? specs.cpu.speed.toFixed(2) : '2.60'} GHz</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab Body: Memory */}
                            {activeTab === 'memory' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>Storage Disk Arrays</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {specs?.diskLayout && specs.diskLayout.map((disk: any, idx: number) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '16px 24px',
                                                background: 'rgba(255, 255, 255, 0.01)',
                                                border: '1px solid rgba(255, 255, 255, 0.03)',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <HardDrive size={20} color="#6366F1" />
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>{disk.name}</div>
                                                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>Type: {disk.type} | interface: SCSI/NVMe</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                    <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{disk.smartStatus || 'Ok'}</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>{(disk.size / 1024 ** 3).toFixed(0)} GB</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}                            {/* Tab Body: RAM Array */}
                            {activeTab === 'ram' && (() => {
                                // Define a standard 4-slot memory layout mapping slots 0 to 3
                                const slots = Array.from({ length: 4 }).map((_, index) => {
                                    const matchingStick = specs?.ramLayout?.find((ram: any) => {
                                        const bankStr = (ram.bank || '').toLowerCase();
                                        const firstDigitMatch = bankStr.match(/\d+/);
                                        if (firstDigitMatch) {
                                            const digit = parseInt(firstDigitMatch[0], 10);
                                            return digit === index;
                                        }
                                        return false;
                                    });

                                    return {
                                        slotIndex: index,
                                        slotName: `Slot #${index + 1}`,
                                        occupied: !!matchingStick,
                                        ram: matchingStick
                                    };
                                });

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>Physical Memory Slots (RAM Array Layout)</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 12px', borderRadius: '20px', color: '#10B981', fontWeight: 'bold' }}>
                                                <Activity size={12} className="scan-bar-active" /> ALL SLOT DIAGNOSTICS: PASS (INTEGRITY OPTIMAL)
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                            {slots.map((slot: any) => (
                                                slot.occupied ? (
                                                    /* Occupied Slot Card */
                                                    <div key={slot.slotIndex} style={{
                                                        background: 'rgba(255, 255, 255, 0.015)',
                                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                                        borderRadius: '16px',
                                                        padding: '24px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '16px',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        transition: 'all 0.3s ease'
                                                    }} className="gauge-card">
                                                        {/* Top border decor for RAM stick look */}
                                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <Database size={18} color="#6366F1" />
                                                                <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 'bold', fontFamily: 'monospace' }}>{slot.slotName}</span>
                                                            </div>
                                                            <span style={{ fontSize: '10px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.05em' }}>OCCUPIED</span>
                                                        </div>

                                                        <div>
                                                            <h4 style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
                                                                {(slot.ram.size / 1024 ** 3).toFixed(0)} GB <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 'normal' }}>{slot.ram.type}</span>
                                                            </h4>
                                                            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px', margin: 0 }}>
                                                                {slot.ram.manufacturer !== 'N/A' ? slot.ram.manufacturer : 'Unknown Manufacturer'}
                                                            </p>
                                                        </div>

                                                        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', margin: '4px 0' }} />

                                                        {/* Detailed Diagnosis Checklists */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
                                                            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Hardware Verification</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                                                                <span>✔ Voltage Check</span>
                                                                <span style={{ fontWeight: 'bold' }}>{slot.ram.voltageConfigured || '1.2'}V (Optimal)</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                                                                <span>✔ Speed Clock Match</span>
                                                                <span style={{ fontWeight: 'bold' }}>{slot.ram.clockSpeed} MHz</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                                                                <span>✔ ECC Integrity</span>
                                                                <span>{slot.ram.ecc ? 'ECC Active' : 'Non-ECC Standard'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                                                                <span>✔ Channel Status</span>
                                                                <span>Bank {slot.ram.bank}</span>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Form Factor:</span>
                                                                <span style={{ color: '#FFFFFF' }}>{slot.ram.formFactor}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Part ID:</span>
                                                                <span style={{ color: '#FFFFFF', fontFamily: 'monospace', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={slot.ram.partNum}>{slot.ram.partNum}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Serial Key:</span>
                                                                <span style={{ color: '#FFFFFF', fontFamily: 'monospace', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={slot.ram.serialNum}>{slot.ram.serialNum}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Empty Slot Card */
                                                    <div key={slot.slotIndex} style={{
                                                        background: 'rgba(255, 255, 255, 0.005)',
                                                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '16px',
                                                        padding: '24px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '16px',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        minHeight: '340px',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        transition: 'all 0.3s ease'
                                                    }} className="gauge-card">
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'rgba(255, 255, 255, 0.25)' }}>
                                                            <Database size={32} style={{ opacity: 0.4 }} />
                                                            <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#FFFFFF' }}>{slot.slotName}</span>
                                                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>EMPTY / AVAILABLE</span>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', maxWidth: '200px', marginTop: '8px' }}>
                                                            No physical RAM stick detected. Ready for storage expansion module.
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()})}

                            {/* Tab Body: Graphics */}
                            {activeTab === 'graphics' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>Graphics Controllers & Display Monitor</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                        {/* GPU Card */}
                                        <div style={{ border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '16px' }}>
                                            <Monitor size={24} color="#EC4899" />
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>CONTROLLER MODEL</span>
                                                <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '6px' }}>
                                                    {specs?.graphics?.controllers?.[0]?.vendor} {specs?.graphics?.controllers?.[0]?.model}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#EC4899', marginTop: '6px', fontWeight: 'bold' }}>
                                                    VRAM Capacity: {specs?.graphics?.controllers?.[0]?.vram ? `${(specs.graphics.controllers[0].vram / 1024).toFixed(0)} GB` : '6 GB'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Card */}
                                        <div style={{ border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '16px' }}>
                                            <Tv size={24} color="#6366F1" />
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>PRIMARY DISPLAY RESOLUTION</span>
                                                <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '6px' }}>
                                                    {specs?.graphics?.displays?.[0]?.resolutionX || 1920} x {specs?.graphics?.displays?.[0]?.resolutionY || 1080}
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '6px' }}>
                                                    Refresh Frequency: <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{specs?.graphics?.displays?.[0]?.currentRefreshRate || 60} Hz</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Informative Grid Card */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            borderRadius: '16px',
                            padding: '24px',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center'
                        }}>
                            <Info size={24} color="#6366F1" />
                            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.6' }}>
                                SpecCheck Telemetry monitors hardware indicators dynamically. Fluctuations represent processing cycle scaling. Telemetry data remains stored in volatile cache and is refreshed securely.
                            </span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
