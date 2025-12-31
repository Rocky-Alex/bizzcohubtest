"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./enhancer.css";
import { Upload, Download, X, ArrowLeftRight, Check, Zap } from "lucide-react";

export default function ImageEnhancerPage() {
    // --- State ---
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Settings
    const [upscaleFactor, setUpscaleFactor] = useState<1 | 2 | 4>(2);
    const [sharpness, setSharpness] = useState(50); // 0-100
    const [clarity, setClarity] = useState(30);     // 0-100 (Contrast/Details)

    // Comparison
    const [sliderPos, setSliderPos] = useState(50); // %
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Image Processing Helpers ---

    const processImage = useCallback(async () => {
        if (!originalUrl) return;
        setIsProcessing(true);

        // Allow UI to update before blocking thread
        await new Promise(r => setTimeout(r, 50));

        const img = new Image();
        img.src = originalUrl;
        await new Promise(r => img.onload = r);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Upscale
        const targetWidth = img.width * upscaleFactor;
        const targetHeight = img.height * upscaleFactor;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Get Data for Pixel Maniupulation
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;
        const w = targetWidth;
        const h = targetHeight;

        // Buffer for sharpening to avoid reading modified pixels
        const outputBuffer = new Uint8ClampedArray(data);

        // 2. Sharpening Kernel [0, -1, 0, -1, 5, -1, 0, -1, 0]
        // Strength approx determined by mixing
        const sharpenAmount = sharpness / 100; // 0 to 1
        const contrastAmount = (clarity - 20) * 2; // -40 to +160 approx logic

        // Apply Convolution & Contrast in one pass if possible (or simplistic pass)
        // Note: Full convolution in JS on large images is slow. 
        // We will do a simplified unsharp mask approach or just a kernel.
        // Let's do a simple 3x3 kernel for sharpening + basic contrast.

        if (sharpness > 0 || clarity !== 0) {
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = (y * w + x) * 4;

                    // Simple Kernel neighbors
                    const up = ((y - 1) * w + x) * 4;
                    const down = ((y + 1) * w + x) * 4;
                    const left = (y * w + (x - 1)) * 4;
                    const right = (y * w + (x + 1)) * 4;

                    for (let c = 0; c < 3; c++) { // R, G, B
                        const val = data[idx + c];

                        // Sharpening Logic
                        // 4 * val - up - down - left - right
                        const laplacian = 4 * val
                            - data[up + c]
                            - data[down + c]
                            - data[left + c]
                            - data[right + c];

                        let newVal = val + (laplacian * sharpenAmount);

                        // Clarity/Contrast Logic
                        // Factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
                        // Simplified: (val - 128) * factor + 128
                        if (clarity !== 0) {
                            const factor = (259 * (contrastAmount + 255)) / (255 * (259 - contrastAmount));
                            newVal = factor * (newVal - 128) + 128;
                        }

                        outputBuffer[idx + c] = Math.min(255, Math.max(0, newVal));
                    }
                    // Alpha remains same
                }
            }
            // Put back modified buffer
            for (let i = 0; i < data.length; i++) {
                data[i] = outputBuffer[i];
            }
            ctx.putImageData(imageData, 0, 0);
        }

        setProcessedUrl(canvas.toDataURL('image/jpeg', 0.9));
        setIsProcessing(false);

    }, [originalUrl, upscaleFactor, sharpness, clarity]);

    // Handle Upload
    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setOriginalUrl(url);
            setProcessedUrl(null);
            // Reset Defaults
            setUpscaleFactor(2);
            setSharpness(50);
            setClarity(30);
        }
    };

    // Auto-process on change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (originalUrl) processImage();
        }, 500);
        return () => clearTimeout(timer);
    }, [processImage, originalUrl]);


    // Slider Drag Logic
    const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        let clientX;
        if ('touches' in e) clientX = e.touches[0].clientX;
        else clientX = (e as React.MouseEvent).clientX;

        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    };

    return (
        <div className="enhancer-page">
            {/* Header */}
            <header className="enhancer-header">
                <div className="flex items-center gap-3">
                    <Zap className="text-blue-500" />
                    <h1 className="enhancer-title">AI Image Enhancer</h1>
                </div>
                <div className="header-actions">
                    <button className="action-btn secondary-btn" onClick={() => window.location.reload()}>
                        <X size={16} /> Close
                    </button>
                    {processedUrl && (
                        <button className="action-btn primary-btn" onClick={() => {
                            const a = document.createElement('a');
                            a.href = processedUrl;
                            a.download = 'enhanced-image.jpg';
                            a.click();
                        }}>
                            <Download size={16} /> Download Result
                        </button>
                    )}
                </div>
            </header>

            <div className="enhancer-main">
                {/* Sidebar */}
                {originalUrl && (
                    <aside className="enhancer-sidebar">
                        <div className="control-group">
                            <span className="group-title">Upscale Resolution</span>
                            <div className="upscale-options">
                                <button
                                    className={`upscale-btn ${upscaleFactor === 1 ? 'active' : ''}`}
                                    onClick={() => setUpscaleFactor(1)}
                                >
                                    Original
                                </button>
                                <button
                                    className={`upscale-btn ${upscaleFactor === 2 ? 'active' : ''}`}
                                    onClick={() => setUpscaleFactor(2)}
                                >
                                    2x (HD)
                                </button>
                                <button
                                    className={`upscale-btn ${upscaleFactor === 4 ? 'active' : ''}`}
                                    onClick={() => setUpscaleFactor(4)}
                                >
                                    4x (Ultra)
                                </button>
                            </div>
                        </div>

                        <div className="control-group">
                            <div className="control-slider">
                                <div className="slider-header">
                                    <span>Sharpening</span>
                                    <span className="slider-value">{sharpness}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={sharpness}
                                    onChange={(e) => setSharpness(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="control-group">
                            <div className="control-slider">
                                <div className="slider-header">
                                    <span>Clarity / Detail</span>
                                    <span className="slider-value">{clarity}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={clarity}
                                    onChange={(e) => setClarity(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </aside>
                )}

                {/* Canvas Area */}
                <main className="enhancer-canvas-area">
                    {!originalUrl ? (
                        <div className="upload-placeholder">
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                            <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={48} className="mb-4 text-blue-500" />
                                <h3>Upload Low-Res Image</h3>
                                <p>Drag & drop or click to enhance</p>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="comparison-container"
                            ref={containerRef}
                            onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
                            onTouchMove={handleSliderMove}
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            {/* Layer 1: Bottom (Enhanced/Processed) */}
                            <img
                                src={processedUrl || originalUrl}
                                alt="Enhanced"
                                className="compare-img"
                                draggable={false}
                                style={{ display: 'block', width: '100%', height: 'auto' }}
                            />
                            <div className="badge badge-enhanced">Enhanced</div>

                            {/* Layer 2: Top (Original), Clipped */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    width: `${sliderPos}%`,
                                    overflow: 'hidden',
                                    borderRight: '2px solid white'
                                }}
                            >
                                {/* We use the same image dimensions to ensure alignment */}
                                <img
                                    src={originalUrl}
                                    alt="Original"
                                    draggable={false}
                                    style={{
                                        display: 'block',
                                        width: containerRef.current ? containerRef.current.clientWidth : '100%',     // Match container
                                        height: containerRef.current ? containerRef.current.clientHeight : '100%',   // Match container
                                        maxWidth: 'none', // Allow it to perform full stretch/match
                                        objectFit: 'fill' // Force stretch to match the bottom layer exactly if aspect ratios differ slightly due to upscale
                                        // Ideally, upscale preserves aspect ratio perfectly.
                                    }}
                                // A better way to ensure exact alignment is to force both to 100% of container 
                                // and let container dictate size based on aspect ratio of the main image.
                                />
                                <div className="badge badge-original">Original</div>
                            </div>

                            {/* Slider Handle */}
                            <div className="slider-handle" style={{ left: `${sliderPos}%` }} onMouseDown={() => { }}>
                                <div className="handle-line"></div>
                                <div className="handle-circle">
                                    <ArrowLeftRight size={20} />
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="processing-overlay">
                                    <div className="spinner"></div>
                                    <span>Enhancing & Upscaling...</span>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
