"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wifi, Globe, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getConnectivityData } from './actions';
import { toast } from 'sonner';

export default function ConnectivityPage() {
    const [data, setData] = useState<{ interfaces: any[], wifi: any[] } | null>(null);
    const [backUrl, setBackUrl] = useState("/resources");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("from") === "qc") {
                setBackUrl("/qc");
            }
        }
    }, []);
    const [online, setOnline] = useState(true);
    const [speed, setSpeed] = useState<number | null>(null);
    const [loadingSpeed, setLoadingSpeed] = useState(false);

    useEffect(() => {
        // Initial Fetch
        getConnectivityData().then(setData);

        // Online Status
        setOnline(navigator.onLine);
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const testLatency = async () => {
        setLoadingSpeed(true);
        const start = Date.now();
        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
            const end = Date.now();
            setSpeed(end - start);
            toast.success(`Latency: ${end - start}ms`);
        } catch (e) {
            toast.error("Connection failed");
            setSpeed(null);
        } finally {
            setLoadingSpeed(false);
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
                <Link href={backUrl} style={{ color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
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
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Connectivity & Network
                </h1>

                {/* Status Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%', maxWidth: '900px' }}>

                    {/* Internet Status */}
                    <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '16px', background: online ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                            <Globe size={32} color={online ? '#22c55e' : '#ef4444'} />
                        </div>
                        <div>
                            <div style={{ color: '#a3a3a3', fontSize: '14px', fontWeight: 'bold' }}>INTERNET STATUS</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: online ? 'white' : '#ef4444' }}>
                                {online ? "Connected" : "Offline"}
                            </div>
                        </div>
                    </div>

                    {/* WiFi Signal */}
                    <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}>
                            <Wifi size={32} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ color: '#a3a3a3', fontSize: '14px', fontWeight: 'bold' }}>ACTIVE WIFI</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                                {data?.wifi?.[0]?.ssid || "No WiFi Connected"}
                            </div>
                            {data?.wifi?.[0]?.signalLevel && (
                                <div style={{ fontSize: '13px', color: '#3b82f6' }}>Signal: {data.wifi[0].signalLevel} dBm</div>
                            )}
                        </div>
                    </div>

                    {/* Latency Test */}
                    <div style={{ background: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%' }}>
                            <Activity size={32} color="#a855f7" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#a3a3a3', fontSize: '14px', fontWeight: 'bold' }}>LATENCY Check</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                                    {speed ? `${speed}ms` : '---'}
                                </div>
                                <button
                                    onClick={testLatency}
                                    disabled={loadingSpeed}
                                    style={{
                                        background: '#262626', border: '1px solid #404040', color: 'white',
                                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                                    }}>
                                    {loadingSpeed ? 'Testing...' : 'Test'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interfaces List */}
                <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Network Interfaces</h2>
                    {data?.interfaces?.map((iface, idx) => (
                        <div key={idx} style={{
                            background: '#171717',
                            border: '1px solid #262626',
                            borderRadius: '12px',
                            padding: '20px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '24px',
                            alignItems: 'center'
                        }}>
                            <div style={{ minWidth: '150px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{iface.iface}</div>
                                <div style={{ fontSize: '13px', color: '#737373' }}>{iface.ifaceName}</div>
                            </div>

                            <div style={{ display: 'flex', gap: '32px', flex: 1, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#525252', fontWeight: 'bold' }}>IP ADDRESS (v4)</div>
                                    <div style={{ color: '#e5e5e5', fontFamily: 'monospace' }}>{iface.ip4 || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#525252', fontWeight: 'bold' }}>MAC ADDRESS</div>
                                    <div style={{ color: '#e5e5e5', fontFamily: 'monospace' }}>{iface.mac || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#525252', fontWeight: 'bold' }}>TYPE</div>
                                    <div style={{ color: '#e5e5e5' }}>{iface.virtual ? 'Virtual' : 'Physical'}</div>
                                </div>
                            </div>

                            {iface.operstate === 'up' ? (
                                <CheckCircle2 size={20} color="#22c55e" />
                            ) : (
                                <ShieldAlert size={20} color="#525252" />
                            )}
                        </div>
                    ))}
                    {!data && (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#525252' }}>Loading interfaces...</div>
                    )}
                </div>

            </main>
        </div>
    );
}
