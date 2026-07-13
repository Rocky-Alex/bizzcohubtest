"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { ArrowLeft, Camera, RefreshCw, Settings, Video, Image as ImageIcon, CheckCircle, AlertTriangle, Monitor, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function CameraTestPage() {
    const [backUrl, setBackUrl] = useState("/resources");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("from") === "qc") {
                setBackUrl("/qc");
            }
        }
    }, []);

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
                <button
                    onClick={() => window.location.href = backUrl}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a3a3a3',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '16px',
                        fontFamily: 'inherit'
                    }}
                >
                    <ArrowLeft size={20} /> Back
                </button>
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
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(to right, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Webcam Diagnostics
                </h1>

                <CameraTester />
            </main>
        </div>
    );
}

const CameraTester = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const [isMirrored, setIsMirrored] = useState(true);
    const [resolution, setResolution] = useState({ width: 0, height: 0 });

    // 1. Enumerate Devices
    const getDevices = useCallback(async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true }); // Ask permission first
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);

            if (videoDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error("Permission/Enumeration Error:", err);
            setError("Camera permission denied or no camera found.");
        }
    }, [selectedDeviceId]);

    // 2. Start Camera
    const startCamera = useCallback(async (deviceId: string) => {
        setLoading(true);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError(null);

            // Get actual resolution
            const track = newStream.getVideoTracks()[0];
            const settings = track.getSettings();
            setResolution({ width: settings.width || 0, height: settings.height || 0 });

        } catch (err) {
            console.error("Camera Start Error:", err);
            setError("Failed to access camera.");
        } finally {
            setLoading(false);
        }
    }, [stream]);

    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        getDevices();
    }, []);

    // Cleanup stream reliably using Ref when component unmounts
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, []); // Empty dependency ensuring it runs on unmount

    // Update Ref whenever stream state changes
    useEffect(() => {
        streamRef.current = stream;
    }, [stream]);

    useEffect(() => {
        if (selectedDeviceId) {
            startCamera(selectedDeviceId);
        }
    }, [selectedDeviceId]);

    const takeSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (isMirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            setSnapshot(dataUrl);
            toast.success("Snapshot taken!");
        }
    };

    const handleDownload = () => {
        if (snapshot) {
            const link = document.createElement('a');
            link.href = snapshot;
            link.download = `camera-test-${Date.now()}.png`;
            link.click();
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '900px',
            backgroundColor: '#171717',
            borderRadius: '24px',
            border: '1px solid #262626',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            {/* Header / Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e5e5e5' }}>
                    <Video size={24} color="#10b981" />
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Live Camera Feed</h2>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            background: '#262626',
                            color: 'white',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {devices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                        {devices.length === 0 && <option>Searching cameras...</option>}
                    </select>

                    <button
                        onClick={() => setIsMirrored(!isMirrored)}
                        style={{
                            padding: '8px',
                            background: isMirrored ? '#10b981' : '#262626',
                            color: isMirrored ? 'black' : 'white',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                        title="Toggle Mirror"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Video Area */}
            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: '16px',
                overflow: 'hidden',
                border: loading ? '1px solid #333' : 'none'
            }}>
                {loading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#737373' }}>
                        <RefreshCw className="animate-spin" size={32} />
                        <span>Initializing Camera...</span>
                    </div>
                )}

                {error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                        <AlertTriangle size={48} />
                        <span style={{ fontWeight: 'bold' }}>{error}</span>
                        <button onClick={getDevices} style={{ marginTop: '16px', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Retry Permission
                        </button>
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: isMirrored ? 'scaleX(-1)' : 'none'
                    }}
                />

                {resolution.width > 0 && !loading && !error && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'white',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Monitor size={14} />
                        {resolution.width} x {resolution.height}
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button
                    onClick={takeSnapshot}
                    disabled={!!error || loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#3b82f6', color: 'white',
                        border: 'none', padding: '12px 32px', borderRadius: '12px',
                        fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                        opacity: (error || loading) ? 0.5 : 1
                    }}
                >
                    <Camera size={20} /> Take Snapshot
                </button>
            </div>

            {/* Snapshot Preview */}
            {snapshot && (
                <div style={{ marginTop: '24px', animation: 'fade-in 0.3s ease-out' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#e5e5e5' }}>Last Snapshot</h3>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{
                            border: '2px solid #3b82f6',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            maxWidth: '300px'
                        }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={snapshot} alt="Captured" style={{ display: 'block', width: '100%', height: 'auto' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                                <CheckCircle size={20} /> Capture Successful
                            </div>
                            <button
                                onClick={handleDownload}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: '#262626', color: 'white',
                                    border: '1px solid #404040',
                                    padding: '10px 20px', borderRadius: '8px',
                                    fontSize: '14px', cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                <ImageIcon size={16} /> Download Image
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};
