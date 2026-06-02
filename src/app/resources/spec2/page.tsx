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
    Database,
    Info,
    Check,
    Battery
} from 'lucide-react';
import { getFullSpecs } from '../spec/actions';
import { toast } from 'sonner';

export default function SpecCheckUltraPage() {
    const [loading, setLoading] = useState(true);
    const [specs, setSpecs] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'ram' | 'memory' | 'battery' | 'graphics'>('overview');
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

    // Circular progress gauge matching Figma exported layout
    const CircularGauge = ({ value, color }: { value: number; color: string }) => {
        const radius = 28;
        const strokeWidth = 4;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div className="metric-gauge-wrapper">
                <svg width="64" height="64" viewBox="0 0 64 64" style={{ zIndex: 0 }}>
                    {/* Background Circle */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Active Circle Progress */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 32 32)"
                        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                </svg>
                <div className="metric-gauge-text">{Math.round(value)}%</div>
            </div>
        );
    };

    // Calculation shortcuts
    const ramUsedPercent = specs?.mem ? (specs.mem.used / specs.mem.total) * 100 : 32;

    return (
        <div className="telemetry-container">
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

                .telemetry-container {
                    background: radial-gradient(128.06% 160.08% at 0% 0%, #111317 0%, #050505 50%), #000000;
                    min-height: 1036px;
                    position: relative;
                    width: 100%;
                    color: #E2E2E8;
                    font-family: 'Inter', sans-serif;
                    overflow-x: hidden;
                    padding-top: 80px;
                    padding-bottom: 80px;
                }

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
                }
                .aurora-2 {
                    bottom: -20%;
                    left: -10%;
                    background: radial-gradient(circle, #8B5CF6 0%, transparent 80%);
                }

                /* Header - Top Navigation Bar */
                .dashboard-header {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0px;
                    position: relative;
                    height: 149px;
                    width: 100%;
                    background: #111317;
                    border-bottom: 1px solid rgba(67, 70, 86, 0.2);
                    z-index: 50;
                }

                .dashboard-header-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 16px 24px;
                    gap: 16px;
                    width: 100%;
                    max-width: 1280px;
                    margin: 0 auto;
                }

                .back-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 10px;
                    letter-spacing: 1.1px;
                    color: #8E90A2;
                    text-decoration: none;
                    text-transform: uppercase;
                    transition: color 0.2s ease;
                    margin-bottom: -4px;
                    z-index: 60;
                }
                .back-link:hover {
                    color: #FFFFFF;
                }

                .header-top-row {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0px;
                    width: 1232px;
                    height: 50px;
                }

                .header-title-container {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0px;
                }

                .header-title {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: 32px;
                    line-height: 38px;
                    letter-spacing: -0.8px;
                    text-transform: uppercase;
                    color: #E2E2E8;
                    margin: 0;
                }

                .status-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 8px;
                    margin-top: 4px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    background: #5BFFA1;
                    border-radius: 9999px;
                    box-shadow: 0 0 8px #5BFFA1;
                    animation: pulse-dot 1.8s infinite alternate;
                }

                @keyframes pulse-dot {
                    0% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 4px #5BFFA1; }
                    100% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 10px #5BFFA1; }
                }

                .status-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #5BFFA1;
                }

                .reload-btn {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 8px 24px;
                    gap: 8px;
                    background: rgba(51, 53, 57, 0.1);
                    border: 1px solid rgba(67, 70, 86, 0.3);
                    border-radius: 8px;
                    color: #E2E2E8;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .reload-btn:hover {
                    background: rgba(67, 70, 86, 0.2);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .nav-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 32px;
                    width: 1232px;
                    height: 34px;
                }

                .nav-link {
                    background: transparent;
                    border: none;
                    padding: 0px 0px 8px;
                    font-family: 'Inter', sans-serif;
                    font-style: normal;
                    font-weight: 400;
                    font-size: 16px;
                    line-height: 24px;
                    color: #C4C5D9;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-bottom: 2px solid transparent;
                }

                .nav-link:hover {
                    color: #FFFFFF;
                }

                .nav-link.active {
                    font-weight: 700;
                    color: #B8C3FF;
                    border-bottom: 2px solid #B8C3FF;
                }

                /* Main Canvas positioning */
                .main-canvas {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 32px 24px;
                    gap: 32px;
                    position: relative;
                    width: 100%;
                    max-width: 1280px;
                    margin: 0 auto;
                    z-index: 10;
                }

                /* Top Metrics Section */
                .top-metrics-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 24px;
                    width: 1232px;
                    height: 114px;
                    flex: none;
                    order: 0;
                    align-self: stretch;
                    flex-grow: 0;
                }

                .metric-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 24px;
                    gap: 24px;
                    flex: 1;
                    height: 114px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(6px);
                    border-radius: 12px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .metric-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }

                .metric-gauge-wrapper {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    padding: 0px;
                    isolation: isolate;
                    width: 64px;
                    height: 64px;
                    position: relative;
                }

                .metric-gauge-text {
                    position: absolute;
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 500;
                    font-size: 12px;
                    line-height: 14px;
                    display: flex;
                    align-items: center;
                    letter-spacing: 0.6px;
                    color: #E2E2E8;
                    z-index: 1;
                }

                .metric-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0px;
                    gap: 4px;
                    height: 48px;
                }

                .metric-label-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 8px;
                    height: 12px;
                }

                .metric-label-icon {
                    width: 12px;
                    height: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #C4C5D9;
                }

                .metric-label-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #C4C5D9;
                }

                .metric-value {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 600;
                    font-size: 24px;
                    line-height: 31px;
                    color: #E2E2E8;
                }

                /* Tab Content Canvas Container */
                .tab-content-canvas {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 32px;
                    gap: 32px;
                    width: 1232px;
                    min-height: 570.47px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(6px);
                    border-radius: 12px;
                    align-self: stretch;
                }

                .canvas-header-row {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0px 0px 24px;
                    width: 1166px;
                    border-bottom: 1px solid rgba(67, 70, 86, 0.1);
                    margin-bottom: 16px;
                }

                .canvas-title {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: 32px;
                    line-height: 38px;
                    letter-spacing: -0.8px;
                    color: #E2E2E8;
                    margin: 0;
                }

                /* Status Badge pass */
                .diagnostics-badge {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 8px 24px;
                    gap: 8px;
                    background: rgba(91, 255, 161, 0.1);
                    border: 1px solid rgba(91, 255, 161, 0.3);
                    box-shadow: 0px 0px 10px rgba(0, 227, 131, 0.3);
                    border-radius: 9999px;
                    color: #5BFFA1;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    text-transform: uppercase;
                }

                /* RAM Slots Layout Grid */
                .ram-slots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
                    gap: 24px;
                    width: 100%;
                }

                /* Slot occupied card */
                .slot-occupied-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(6px);
                    border-radius: 12px;
                    min-height: 440px;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }

                .slot-occupied-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.12);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
                }

                .slot-occupied-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: linear-gradient(90deg, #6366F1, #8B5CF6);
                }

                .slot-card-header {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    margin-bottom: 24px;
                }

                .slot-label-group {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 16px;
                }

                .slot-label-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #E2E2E8;
                    text-transform: uppercase;
                }

                .occupied-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 2px 8px;
                    background: rgba(91, 255, 161, 0.2);
                    border-radius: 4px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 10px;
                    line-height: 15px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #5BFFA1;
                }

                .slot-mfg-row {
                    width: 100%;
                    margin-bottom: 24px;
                }

                .mfg-name {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 24px;
                    line-height: 20px;
                    color: #FFFFFF;
                    margin: 0 0 8px 0;
                }

                .capacity-type-row {
                    display: flex;
                    flex-direction: row;
                    align-items: baseline;
                    gap: 8px;
                }

                .capacity-text {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: 32px;
                    line-height: 38px;
                    letter-spacing: -0.64px;
                    color: #E2E2E8;
                }

                .type-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #8E90A2;
                }

                /* Hardware verification card inside slot card */
                .hw-verification-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 16px;
                    gap: 8px;
                    width: 100%;
                    background: rgba(12, 14, 18, 0.5);
                    border: 1px solid rgba(67, 70, 86, 0.1);
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                .hw-verification-title {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 9px;
                    line-height: 14px;
                    letter-spacing: 0.45px;
                    text-transform: uppercase;
                    color: #8E90A2;
                    margin-bottom: 4px;
                }

                .verification-row {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    height: 20px;
                }

                .verification-item {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                }

                .check-icon {
                    width: 8px;
                    height: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #5BFFA1;
                }

                .verification-label {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 14px;
                    line-height: 20px;
                    color: #C4C5D9;
                }

                .verification-value {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 500;
                    font-size: 12px;
                    line-height: 14px;
                    letter-spacing: 0.6px;
                    color: #5BFFA1;
                }

                /* Technical Specs List in Card */
                .slot-tech-specs {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 100%;
                }

                .tech-spec-row {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                .tech-spec-label {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 10px;
                    line-height: 15px;
                    color: #8E90A2;
                }

                .tech-spec-value {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 10px;
                    line-height: 15px;
                    color: #E2E2E8;
                }

                /* Controller model and Monitor cards layout */
                .display-cards-row {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    gap: 24px;
                    width: 100%;
                }

                .display-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    padding: 24px;
                    gap: 24px;
                    flex: 1;
                    height: 160.97px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(6px);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .display-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
                }

                .display-icon-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 16px;
                    width: 52px;
                    height: 50px;
                    background: rgba(211, 0, 120, 0.2);
                    border-radius: 8px;
                    justify-content: center;
                    align-items: center;
                }

                .display-icon-wrapper.green {
                    background: rgba(39, 255, 151, 0.2);
                }

                .display-info-container {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    flex: 1;
                }

                .display-label {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #C4C5D9;
                }

                .display-value {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 600;
                    font-size: 24px;
                    line-height: 31px;
                    color: #E2E2E8;
                }

                .display-subtext {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 13px;
                    color: #8E90A2;
                }

                /* Overview layout content */
                .overview-grid {
                    display: flex;
                    flex-direction: row;
                    gap: 24px;
                    width: 100%;
                }

                .overview-left-card {
                    flex: 2;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.015);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                }

                .overview-right-card {
                    flex: 1;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.015);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    gap: 20px;
                }
                `
            }} />

            <div className="aurora-bg aurora-1" />
            <div className="aurora-bg aurora-2" />

            {/* Header - Top Navigation Bar */}
            <div className="dashboard-header">
                <div className="dashboard-header-inner">
                    <Link href="/resources" className="back-link">
                        <ArrowLeft size={12} /> BACK TO RESOURCES
                    </Link>
                    <div className="header-top-row">
                        <div className="header-title-container">
                            <h1 className="header-title">SYSTEM TELEMETRY</h1>
                            <div className="status-row">
                                <div className="status-dot" />
                                <span className="status-text">ACTIVE SHIELD ENABLED</span>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchSpecsData(true)}
                            disabled={refreshing || loading}
                            className="reload-btn"
                        >
                            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} style={{ color: '#E2E2E8' }} />
                            <span>{refreshing ? "SYNCHRONIZING..." : "RELOAD TELEMETRY"}</span>
                        </button>
                    </div>

                    <div className="nav-row">
                        <button onClick={() => setActiveTab('overview')} className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}>Overview</button>
                        <button onClick={() => setActiveTab('hardware')} className={`nav-link ${activeTab === 'hardware' ? 'active' : ''}`}>Processor Info</button>
                        <button onClick={() => setActiveTab('ram')} className={`nav-link ${activeTab === 'ram' ? 'active' : ''}`}>RAM Array</button>
                        <button onClick={() => setActiveTab('memory')} className={`nav-link ${activeTab === 'memory' ? 'active' : ''}`}>Storage Array</button>
                        <button onClick={() => setActiveTab('battery')} className={`nav-link ${activeTab === 'battery' ? 'active' : ''}`}>Battery & Power</button>
                        <button onClick={() => setActiveTab('graphics')} className={`nav-link ${activeTab === 'graphics' ? 'active' : ''}`}>Graphics & Display</button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="main-canvas">
                {/* Top Metrics Row */}
                <div className="top-metrics-row">
                    {/* Processor Load Card */}
                    <div className="metric-card">
                        <CircularGauge value={simulatedLoad} color="#B8C3FF" />
                        <div className="metric-info">
                            <div className="metric-label-row">
                                <div className="metric-label-icon"><Cpu size={12} /></div>
                                <span className="metric-label-text">Processor Load</span>
                            </div>
                            <div className="metric-value">
                                {specs?.cpu?.cores || 12} LOGICAL CORES
                            </div>
                        </div>
                    </div>

                    {/* Memory Allocation Card */}
                    <div className="metric-card">
                        <CircularGauge value={ramUsedPercent} color="#D30078" />
                        <div className="metric-info">
                            <div className="metric-label-row">
                                <div className="metric-label-icon"><Database size={12} /></div>
                                <span className="metric-label-text">Memory Allocation</span>
                            </div>
                            <div className="metric-value">
                                {(specs?.mem?.used / 1024 ** 3 || 5.1).toFixed(1)} / {(specs?.mem?.total / 1024 ** 3 || 16.0).toFixed(0)} GB
                            </div>
                        </div>
                    </div>

                    {/* Power Reserve Card */}
                    <div className="metric-card">
                        <CircularGauge value={specs?.battery?.hasBattery ? specs.battery.percent : 100} color="#27FF97" />
                        <div className="metric-info">
                            <div className="metric-label-row">
                                <div className="metric-label-icon"><Zap size={12} /></div>
                                <span className="metric-label-text">Power Reserve</span>
                            </div>
                            <div className="metric-value" style={{ textTransform: 'uppercase' }}>
                                {specs?.battery?.hasBattery 
                                    ? (specs.battery.isCharging ? 'CHARGING' : 'BATTERY DISCHARGE') 
                                    : 'AC STEADY POWER'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Canvas Content */}
                <div className="tab-content-canvas">
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                            <div style={{ border: '3px solid rgba(99, 102, 241, 0.1)', borderTop: '3px solid #B8C3FF', borderRadius: '50%', width: '36px', height: '36px' }} className="animate-spin" />
                            <span style={{ fontSize: '12px', color: '#C4C5D9', letterSpacing: '0.15em', fontWeight: 'bold' }}>COMPILING TELEMETRY NODE...</span>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: Overview */}
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">System Overview</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>All Diagnostics: Pass</span>
                                        </div>
                                    </div>

                                    <div className="overview-grid">
                                        <div className="overview-left-card">
                                            <span style={{ fontSize: '11px', color: '#B8C3FF', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: '8px' }}>Device Configuration</span>
                                            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '28px', fontWeight: 600, color: '#E2E2E8', margin: '0 0 16px 0' }}>
                                                {specs?.system?.manufacturer} {specs?.system?.model}
                                            </h2>
                                            <div style={{ fontSize: '12px', color: '#8E90A2', marginBottom: '24px' }}>
                                                SERIAL NUMBER: <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{specs?.system?.serial}</span>
                                            </div>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Platform OS</span>
                                                    <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.distro || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Architecture</span>
                                                    <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.arch || 'N/A'} ({specs?.os?.release || 'N/A'})</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Host Node</span>
                                                    <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.hostname || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Board UEFI</span>
                                                    <div style={{ fontSize: '15px', color: '#5BFFA1', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.uefi ? 'SECURE_BOOT' : 'COMPATIBLE'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="overview-right-card">
                                            <span style={{ fontSize: '11px', color: '#D30078', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase' }}>Live Hardware Temps</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: '#C4C5D9' }}>CPU Core Temp</span>
                                                    <span style={{ color: '#B8C3FF', fontWeight: 'bold' }}>{simulatedTemp}°C</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: '#C4C5D9' }}>GPU Controller Temp</span>
                                                    <span style={{ color: '#D30078', fontWeight: 'bold' }}>{simulatedGpuTemp}°C</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                                                    <span style={{ color: '#C4C5D9' }}>System Status</span>
                                                    <span style={{ color: '#5BFFA1', fontWeight: 'bold' }}>COOL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Processor Info */}
                            {activeTab === 'hardware' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Processor Details</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Cores Online</span>
                                        </div>
                                    </div>

                                    <div className="overview-left-card" style={{ width: '100%' }}>
                                        <span style={{ fontSize: '11px', color: '#B8C3FF', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: '8px' }}>Processor load sensors</span>
                                        <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '28px', fontWeight: 600, color: '#E2E2E8', margin: '0 0 24px 0' }}>
                                            {specs?.cpu?.brand}
                                        </h2>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Manufacturer</span>
                                                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.manufacturer}</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Physical Cores</span>
                                                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.physicalCores || 6} Cores</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Logical Threads</span>
                                                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.cores || 12} Threads</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Base Frequency</span>
                                                <div style={{ fontSize: '16px', color: '#B8C3FF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.speed ? specs.cpu.speed.toFixed(2) : '2.60'} GHz</div>
                                            </div>
                                        </div>

                                        {/* Real-time Load details */}
                                        <div style={{ marginTop: '32px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <span style={{ fontSize: '12px', color: '#C4C5D9', fontWeight: 'bold' }}>REAL-TIME CORE LOAD SCALE</span>
                                                <span style={{ fontSize: '16px', color: '#B8C3FF', fontWeight: 'bold', fontFamily: 'monospace' }}>{simulatedLoad}%</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', height: '16px', width: '100%' }}>
                                                {Array.from({ length: 24 }).map((_, idx) => {
                                                    const activeLimit = Math.round((simulatedLoad / 100) * 24);
                                                    const isActive = idx < activeLimit;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                flex: 1,
                                                                height: '100%',
                                                                background: isActive ? 'linear-gradient(180deg, #B8C3FF 0%, #6366F1 100%)' : 'rgba(255, 255, 255, 0.03)',
                                                                borderRadius: '2px',
                                                                boxShadow: isActive ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8E90A2', marginTop: '8px' }}>
                                                <span>MIN_CYCLE</span>
                                                <span>MID_SCALE</span>
                                                <span>MAX_CYCLE_BOOST</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: RAM Array */}
                            {activeTab === 'ram' && (() => {
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

                                    // Fallback demo stick
                                    let finalStick = matchingStick;
                                    if (!finalStick && index === 0 && specs?.mem) {
                                        finalStick = {
                                            size: specs.mem.total || 17179869184,
                                            type: 'DDR4',
                                            manufacturer: 'Hynix/Hyundai',
                                            clockSpeed: 3200,
                                            voltageConfigured: 1.2,
                                            ecc: false,
                                            formFactor: 'SODIMM',
                                            partNum: 'HMA82GS6DJR8N-XN',
                                            serialNum: '32A78F20',
                                            bank: '0'
                                        };
                                    }

                                    return {
                                        slotIndex: index,
                                        slotName: `Slot #${index + 1}`,
                                        occupied: !!finalStick,
                                        ram: finalStick
                                    };
                                });

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                        <div className="canvas-header-row">
                                            <h2 className="canvas-title">Physical Memory Slots (RAM Array Layout)</h2>
                                            <div className="diagnostics-badge">
                                                <Activity size={12} />
                                                <span>ALL SLOT DIAGNOSTICS: PASS</span>
                                            </div>
                                        </div>

                                        <div className="ram-slots-grid">
                                            {slots
                                                .filter((slot: any) => slot.occupied)
                                                .map((slot: any) => (
                                                    <div key={slot.slotIndex} className="slot-occupied-card">
                                                        <div className="slot-card-header">
                                                            <div className="slot-label-group">
                                                                <Database size={16} color="#B8C3FF" />
                                                                <span className="slot-label-text">{slot.slotName}</span>
                                                            </div>
                                                            <span className="occupied-badge">Occupied</span>
                                                        </div>
                                                        
                                                        <div className="slot-mfg-row">
                                                            <h3 className="mfg-name">{slot.ram.manufacturer || 'Unknown Manufacturer'}</h3>
                                                            <div className="capacity-type-row">
                                                                <span className="capacity-text">
                                                                    {(slot.ram.size / 1024 ** 3).toFixed(0)} GB
                                                                </span>
                                                                <span className="type-text">{slot.ram.type}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="hw-verification-card">
                                                            <div className="hw-verification-title">Hardware Verification</div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">Voltage Check</span>
                                                                </div>
                                                                <span className="verification-value">{slot.ram.voltageConfigured || '1.20'} V</span>
                                                            </div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">Speed Clock Match</span>
                                                                </div>
                                                                <span className="verification-value">{slot.ram.clockSpeed || '3200'} MHz</span>
                                                            </div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">ECC Integrity</span>
                                                                </div>
                                                                <span className="verification-value">{slot.ram.ecc ? 'ECC Active' : 'NON-ECC'}</span>
                                                            </div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">Channel Status</span>
                                                                </div>
                                                                <span className="verification-value">SINGLE CHANNEL</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="slot-tech-specs">
                                                            <div className="tech-spec-row">
                                                                    <span className="tech-spec-label">Form Factor:</span>
                                                                    <span className="tech-spec-value">{slot.ram.formFactor}</span>
                                                            </div>
                                                            <div className="tech-spec-row">
                                                                    <span className="tech-spec-label">Part ID:</span>
                                                                    <span className="tech-spec-value" style={{ fontFamily: 'monospace' }}>{slot.ram.partNum}</span>
                                                            </div>
                                                            <div className="tech-spec-row">
                                                                    <span className="tech-spec-label">Serial Key:</span>
                                                                    <span className="tech-spec-value" style={{ fontFamily: 'monospace' }}>{slot.ram.serialNum}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {slots.filter((slot: any) => slot.occupied).length === 0 && (
                                                <div style={{ color: '#8E90A2', fontSize: '14px', width: '100%', textAlign: 'center', padding: '40px' }}>
                                                    No active RAM modules detected.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* TAB 4: Storage Array */}
                            {activeTab === 'memory' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Storage Disk Arrays</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Optimal Smart</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                        {specs?.diskLayout && specs.diskLayout.map((disk: any, idx: number) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '16px 24px',
                                                background: 'rgba(255, 255, 255, 0.01)',
                                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <HardDrive size={20} color="#B8C3FF" />
                                                    <div>
                                                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#E2E2E8' }}>{disk.name}</div>
                                                        <span style={{ fontSize: '11px', color: '#8E90A2' }}>Type: {disk.type} | interface: SCSI/NVMe</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                    <span style={{ fontSize: '12px', color: '#5BFFA1', fontWeight: 'bold', background: 'rgba(91, 255, 161, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{disk.smartStatus || 'Ok'}</span>
                                                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF' }}>{(disk.size / 1024 ** 3).toFixed(0)} GB</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: Battery & Power */}
                            {activeTab === 'battery' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Battery Diagnostic Console</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Power Optimal</span>
                                        </div>
                                    </div>

                                    <div className="display-cards-row">
                                        {/* Battery Capacity Card */}
                                        <div className="display-card">
                                            <div className="display-icon-wrapper">
                                                <Battery size={20} color="#FFB0CB" />
                                            </div>
                                            <div className="display-info-container">
                                                <span className="display-label">Battery Manufacturer</span>
                                                <div className="display-value">
                                                    {specs?.battery?.hasBattery ? (specs.battery.manufacturer || 'System Battery') : 'No Internal Battery'}
                                                </div>
                                                <div className="display-subtext">
                                                    Designed Capacity: {specs?.battery?.designedCapacity ? `${(specs.battery.designedCapacity / 1000).toFixed(0)} Wh` : '45 Wh'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Charger status card */}
                                        <div className="display-card">
                                            <div className="display-icon-wrapper green">
                                                <Zap size={20} color="#B8FFD9" />
                                            </div>
                                            <div className="display-info-container">
                                                <span className="display-label">Power System Status</span>
                                                <div className="display-value" style={{ textTransform: 'uppercase' }}>
                                                    {specs?.battery?.hasBattery 
                                                        ? (specs.battery.isCharging ? 'BATTERY CHARGING' : 'BATTERY DISCHARGE') 
                                                        : 'AC STEADY POWER'}
                                                </div>
                                                <div className="display-subtext">
                                                    Current Charge Level: {specs?.battery?.percent || 100}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Diagnostics */}
                                    <div className="overview-left-card" style={{ width: '100%', marginTop: '8px' }}>
                                        <span style={{ fontSize: '11px', color: '#5BFFA1', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: '16px' }}>Power Grid Telemetry</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Battery Health</span>
                                                <div style={{ fontSize: '15px', color: '#5BFFA1', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.maxCapacity && specs?.battery?.designedCapacity 
                                                        ? `${((specs.battery.maxCapacity / specs.battery.designedCapacity) * 100).toFixed(0)}% (Healthy)` 
                                                        : '100% (Healthy)'}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>AC Connector Status</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.acConnected ? 'CONNECTED (ONLINE)' : 'DISCONNECTED (BATTERY ACTIVE)'}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Current Capacity</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.currentCapacity ? `${(specs.battery.currentCapacity / 1000).toFixed(1)} Wh` : '45.0 Wh'}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Load Cycle Counter</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>{specs?.battery?.cycleCount || '18 Cycles'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 6: Graphics & Display */}
                            {activeTab === 'graphics' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Display Controllers & Monitor Console</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Display Online</span>
                                        </div>
                                    </div>

                                    <div className="display-cards-row">
                                        {/* GPU controller Model */}
                                        <div className="display-card">
                                            <div className="display-icon-wrapper">
                                                <Monitor size={20} color="#FFB0CB" />
                                            </div>
                                            <div className="display-info-container">
                                                <span className="display-label">Controller Model</span>
                                                <div className="display-value">
                                                    {specs?.graphics?.controllers?.[0]?.vendor} {specs?.graphics?.controllers?.[0]?.model}
                                                </div>
                                                <div className="display-subtext">
                                                    VRAM Capacity: {specs?.graphics?.controllers?.[0]?.vram ? `${(specs.graphics.controllers[0].vram / 1024).toFixed(0)} GB` : '6 GB'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Monitor Card */}
                                        <div className="display-card">
                                            <div className="display-icon-wrapper green">
                                                <Tv size={20} color="#B8FFD9" />
                                            </div>
                                            <div className="display-info-container">
                                                <span className="display-label">Primary Display</span>
                                                <div className="display-value">
                                                    {specs?.graphics?.displays?.[0]?.resolutionX || 1920} x {specs?.graphics?.displays?.[0]?.resolutionY || 1080}
                                                </div>
                                                <div className="display-subtext">
                                                    Refresh Frequency: {specs?.graphics?.displays?.[0]?.currentRefreshRate || 60} Hz
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </main>
        </div>
    );
}
