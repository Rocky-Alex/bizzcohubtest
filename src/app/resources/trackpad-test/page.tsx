"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MousePointer2, Mouse, ArrowDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackpadPage() {
    const [events, setEvents] = useState<string[]>([]);
    const [stats, setStats] = useState({
        leftClick: false,
        rightClick: false,
        doubleClick: false,
        scroll: false
    });

    const addLog = (msg: string) => {
        setEvents(prev => [msg, ...prev].slice(0, 10)); // Keep last 10
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setStats(prev => ({ ...prev, rightClick: true }));
        addLog("Right Click Detected");
        toast.success("Right Click OK");
    };

    const handleClick = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setStats(prev => ({ ...prev, leftClick: true }));
            addLog("Left Click Detected");
        }
    };

    const handleDoubleClick = () => {
        setStats(prev => ({ ...prev, doubleClick: true }));
        addLog("Double Click Detected");
        toast.success("Double Click OK");
    };

    const handleWheel = () => {
        if (!stats.scroll) {
            setStats(prev => ({ ...prev, scroll: true }));
            addLog("Scroll Detected");
            toast.success("Scrolling OK");
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            paddingTop: '80px',
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
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '40px'
            }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Trackpad & Mouse Check
                </h1>

                {/* Test Area */}
                <div
                    onContextMenu={handleContextMenu}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    onWheel={handleWheel}
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        height: '300px',
                        background: '#171717',
                        border: '2px dashed #404040',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'crosshair',
                        transition: 'all 0.2s',
                        position: 'relative',
                        userSelect: 'none'
                    }}
                >
                    <MousePointer2 size={48} color="#525252" />
                    <p style={{ marginTop: '16px', color: '#737373', fontWeight: 'bold' }}>
                        Interact here to test gestures
                    </p>
                    <p style={{ fontSize: '12px', color: '#525252' }}>
                        (Left Click, Right Click, Double Click, Scroll)
                    </p>

                    {/* Floating logs */}
                    <div style={{
                        position: 'absolute', bottom: '16px', left: '0', right: '0',
                        textAlign: 'center', fontSize: '12px', color: '#8b5cf6',
                        height: '20px', overflow: 'hidden'
                    }}>
                        {events[0]}
                    </div>
                </div>

                {/* Status Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%', maxWidth: '800px' }}>
                    <StatusBox label="Left Click" active={stats.leftClick} />
                    <StatusBox label="Right Click" active={stats.rightClick} />
                    <StatusBox label="Double Click" active={stats.doubleClick} />
                    <StatusBox label="Scroll" active={stats.scroll} />
                </div>

            </main>
        </div>
    );
}

const StatusBox = ({ label, active }: { label: string, active: boolean }) => (
    <div style={{
        background: active ? 'rgba(34, 197, 94, 0.1)' : '#171717',
        border: active ? '1px solid #22c55e' : '1px solid #262626',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        transition: 'all 0.3s'
    }}>
        {active ? <CheckCircle2 size={24} color="#22c55e" /> : <Mouse size={24} color="#525252" />}
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: active ? 'white' : '#737373' }}>
            {label}
        </span>
    </div>
);
