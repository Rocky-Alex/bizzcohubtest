'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Hand, Move, Eraser } from 'lucide-react';
import { toast } from 'sonner';

export default function TouchTestPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [showControls, setShowControls] = useState(true);

    const boxRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    // Auto-Fullscreen and Key Listener
    useEffect(() => {
        // Enter Fullscreen on mount
        const enterFullscreen = async () => {
            try {
                if (containerRef.current) {
                    if (containerRef.current.requestFullscreen) {
                        await containerRef.current.requestFullscreen();
                    } else if ((containerRef.current as any).webkitRequestFullscreen) {
                        (containerRef.current as any).webkitRequestFullscreen();
                    }
                }
            } catch (e) { console.error("FS Error", e); }
        };
        enterFullscreen();

        // Initialize position
        if (typeof window !== 'undefined') {
            setPosition({
                x: window.innerWidth / 2 - 32,
                y: window.innerHeight / 2 - 32
            });
            handleResize();
        }

        // Hide controls timer
        const timer = setTimeout(() => setShowControls(false), 3000);

        const handleResizeListener = () => handleResize();
        window.addEventListener('resize', handleResizeListener);

        // Key Listener (Esc to Exit)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => { });
                }
                window.location.href = '/resources';
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('resize', handleResizeListener);
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timer);
        };
    }, []);

    const handleResize = () => {
        if (canvasRef.current && containerRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
        }
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        toast.info("Canvas cleared");
        setPosition({
            x: window.innerWidth / 2 - 32,
            y: window.innerHeight / 2 - 32
        });
    };

    const handleStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        // Show controls briefly on interaction? No, might annoy dragging.
        // Let's just drag.
        setPosition({ x: clientX - 32, y: clientY - 32 });
        lastPos.current = { x: clientX, y: clientY };
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        const newX = clientX;
        const newY = clientY;

        setPosition({ x: newX - 32, y: newY - 32 });

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && lastPos.current) {
            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(newX, newY);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 40;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
        lastPos.current = { x: newX, y: newY };
    };

    const handleEnd = () => {
        setIsDragging(false);
        lastPos.current = null;
    };

    // Global Events
    const onEventHandler = (e: React.MouseEvent | React.TouchEvent, type: 'start' | 'move' | 'end') => {
        // Filter button clicks
        if ((e.target as HTMLElement).closest('button')) return;

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            if (e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        if (type === 'start') handleStart(clientX, clientY);
        if (type === 'move') handleMove(clientX, clientY);
        if (type === 'end') handleEnd();
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#0a0a0a',
                overflow: 'hidden',
                touchAction: 'none',
                cursor: isDragging ? 'none' : 'default',
                userSelect: 'none'
            }}
            onMouseDown={(e) => onEventHandler(e, 'start')}
            onMouseMove={(e) => onEventHandler(e, 'move')}
            onMouseUp={() => handleEnd()}
            onMouseLeave={() => handleEnd()}
            onTouchStart={(e) => onEventHandler(e, 'start')}
            onTouchMove={(e) => onEventHandler(e, 'move')}
            onTouchEnd={() => handleEnd()}
        >
            {/* Controls Overlay - Floating */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none',
                opacity: showControls ? 1 : 0.3, // Fade out instead of hide, so buttons are findable
                transition: 'opacity 0.5s',
                zIndex: 50
            }}
                onMouseEnter={() => setShowControls(true)}
                onTouchStart={() => setShowControls(true)}
            >
                <button
                    onClick={() => window.location.href = '/resources'}
                    style={{
                        pointerEvents: 'auto',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid #404040',
                        color: 'white',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', padding: '10px 20px', borderRadius: '24px',
                        fontSize: '14px', backdropFilter: 'blur(4px)'
                    }}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <div style={{ pointerEvents: 'auto' }}>
                    <button
                        onClick={clearCanvas}
                        style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid #404040',
                            color: 'white',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', padding: '10px', borderRadius: '50%',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Instructional Text (Fades out) */}
            {showControls && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none', color: 'rgba(255,255,255,0.5)', textAlign: 'center',
                    animation: 'fade-out 1s forwards 2s'
                }}>
                    <p>Touch & Drag Anywhere</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Press Esc to Exit</p>
                </div>
            )}

            {/* Canvas */}
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

            {/* Icon */}
            <div
                style={{
                    position: 'absolute',
                    left: `${position.x}px`, top: `${position.y}px`,
                    width: '64px', height: '64px',
                    backgroundColor: isDragging ? '#10b981' : '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                    pointerEvents: 'none',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                    transform: isDragging ? 'scale(1.2)' : 'scale(1)',
                    transition: isDragging ? 'none' : 'transform 0.2s',
                    zIndex: 20
                }}
            >
                {isDragging ? <Move size={32} /> : <Hand size={32} />}
            </div>
        </div>
    );
}
