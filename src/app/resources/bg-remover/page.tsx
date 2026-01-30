"use client";

import React, { useState, useRef, useEffect } from "react";
import "./bg-remover.css";
import {
    Upload, Download, X, Image as ImageIcon, Sparkles,
    Pencil, Eraser, Wand2, Crop, Check
} from "lucide-react";
// import { removeBackground } from "@imgly/background-removal";

type ToolType = 'object-select' | 'quick-select' | 'magic-wand' | 'pen' | 'eraser' | 'crop' | null;

export default function BackgroundRemoverPage() {
    // --- State ---
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTool, setActiveTool] = useState<ToolType>(null);

    // Tool Settings
    const [brushSize, setBrushSize] = useState(20);
    const [tolerance, setTolerance] = useState(20);

    // Interaction State
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const [longPressProgress, setLongPressProgress] = useState(0);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // Canvas Refs
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const originalImageRef = useRef<HTMLImageElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const uiCanvasRef = useRef<HTMLCanvasElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number, y: number } | null>(null);

    // --- Helper: Get Pointer Position ---
    const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = uiCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
            clientX,
            clientY
        };
    };

    // --- 1. File Upload Logic ---
    const handleFile = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setOriginalImage(url);
            setProcessedImage(null);
            setActiveTool(null);
            if (maskCanvasRef.current) {
                const ctx = maskCanvasRef.current.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
            }
        }
    };

    // --- Smart Select: Long Press Logic ---
    const performSmartSelect = async () => {
        if (!originalImage || !maskCanvasRef.current || !originalImageRef.current) return;
        setIsProcessing(true);
        try {
            const { removeBackground } = await import("@imgly/background-removal");
            const blob = await removeBackground(originalImage);
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await new Promise(r => img.onload = r);

            const w = maskCanvasRef.current.width;
            const h = maskCanvasRef.current.height;
            const ctx = maskCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, w, h);
            }
            renderUiOverlay();
        } catch (e) {
            console.error(e);
            alert("Smart selection failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const startSmartSelect = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPointerPos(e);
        if (!pos) return;
        setCursorPos({ x: pos.clientX, y: pos.clientY });
        setLongPressProgress(0);

        let progress = 0;
        // Start Progress Interval
        progressInterval.current = setInterval(() => {
            progress += 5;
            setLongPressProgress(Math.min(progress, 100));
        }, 50);

        // Start Trigger Timer
        longPressTimer.current = setTimeout(() => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
            setLongPressProgress(100);
            performSmartSelect();
            setCursorPos(null);
        }, 1000); // 1s Hold Time
    };

    const stopSmartSelect = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }
        setLongPressProgress(0);
        setCursorPos(null);
    };

    // --- Manual Painting Logic ---
    // --- Manual Painting Logic ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPointerPos(e);
        if (!pos) return;
        isDrawingRef.current = true;
        lastPosRef.current = { x: pos.x, y: pos.y };

        if (activeTool === 'quick-select') {
            performFloodFill(pos.x, pos.y);
        } else if (activeTool === 'pen' || activeTool === 'eraser') {
            paint(pos.x, pos.y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingRef.current) return;
        const pos = getPointerPos(e);
        if (!pos) return;

        if (activeTool === 'quick-select') {
            // Continuous Smart Selection
            const dist = Math.abs(pos.x - (lastPosRef.current?.x || 0)) + Math.abs(pos.y - (lastPosRef.current?.y || 0));
            if (dist > 5) {
                performFloodFill(pos.x, pos.y);
                lastPosRef.current = { x: pos.x, y: pos.y };
            }
        } else if (activeTool === 'pen' || activeTool === 'eraser') {
            const last = lastPosRef.current || { x: pos.x, y: pos.y };
            paintLine(last.x, last.y, pos.x, pos.y);
            lastPosRef.current = { x: pos.x, y: pos.y };
        }
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
        lastPosRef.current = null;
    };

    const paint = (x: number, y: number) => {
        const ctx = maskCanvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);

        if (activeTool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000000';
        }
        ctx.fill();
        renderUiOverlay();
    };

    const paintLine = (x1: number, y1: number, x2: number, y2: number) => {
        const ctx = maskCanvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;

        if (activeTool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = '#ffffff';
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = '#000000';
        }
        ctx.stroke();
        renderUiOverlay();
    };

    // --- Flood Fill ---
    const performFloodFill = (startX: number, startY: number) => {
        if (!maskCanvasRef.current || !originalImageRef.current) return;

        const w = maskCanvasRef.current.width;
        const h = maskCanvasRef.current.height;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        tempCtx.drawImage(originalImageRef.current, 0, 0, w, h);
        const sourceData = tempCtx.getImageData(0, 0, w, h).data;

        const maskCtx = maskCanvasRef.current.getContext('2d');
        if (!maskCtx) return;
        const maskImgData = maskCtx.getImageData(0, 0, w, h);
        const maskData = maskImgData.data;

        const startIdx = (Math.floor(startY) * w + Math.floor(startX)) * 4;
        const sr = sourceData[startIdx];
        const sg = sourceData[startIdx + 1];
        const sb = sourceData[startIdx + 2];
        const tol = (tolerance / 100) * 255 * 3;
        const stack = [Math.floor(startX), Math.floor(startY)];
        const visited = new Uint8Array(w * h);

        while (stack.length) {
            const y = stack.pop()!;
            const x = stack.pop()!;
            const idx = y * w + x;
            if (x < 0 || x >= w || y < 0 || y >= h || visited[idx]) continue;
            visited[idx] = 1;

            const pIdx = idx * 4;
            const diff = Math.abs(sourceData[pIdx] - sr) + Math.abs(sourceData[pIdx + 1] - sg) + Math.abs(sourceData[pIdx + 2] - sb);

            if (diff <= tol) {
                stack.push(x + 1, y);
                stack.push(x - 1, y);
                stack.push(x, y + 1);
                stack.push(x, y - 1);
                maskData[pIdx + 3] = 255;
            }
        }
        maskCtx.putImageData(maskImgData, 0, 0);
        renderUiOverlay();
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (activeTool === 'object-select') {
            startSmartSelect(e);
        } else if (['pen', 'eraser', 'quick-select', 'magic-wand'].includes(activeTool || '')) {
            startDrawing(e);
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (['pen', 'eraser', 'quick-select'].includes(activeTool || '')) {
            draw(e);
        }
    };

    const handlePointerUp = () => {
        if (activeTool === 'object-select') {
            stopSmartSelect();
        } else {
            stopDrawing();
        }
    };

    // --- UI Overlay ---
    const renderUiOverlay = () => {
        const uiCanvas = uiCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!uiCanvas || !maskCanvas) return;

        const ctx = uiCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, 0, uiCanvas.width, uiCanvas.height);
        ctx.restore();
    };

    const handleProceed = () => {
        if (!originalImage || !maskCanvasRef.current) return;
        setIsProcessing(true);

        const canvas = document.createElement('canvas');
        canvas.width = maskCanvasRef.current.width;
        canvas.height = maskCanvasRef.current.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = originalImage;
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskCanvasRef.current!, 0, 0);
            setProcessedImage(canvas.toDataURL('image/png'));
            setIsProcessing(false);
            setActiveTool(null);
        };
    };

    // --- Canvas Sync ---
    useEffect(() => {
        if (originalImageRef.current && uiCanvasRef.current) {
            const img = originalImageRef.current;
            const updateSize = () => {
                if (uiCanvasRef.current && img.naturalWidth) {
                    uiCanvasRef.current.width = img.naturalWidth;
                    uiCanvasRef.current.height = img.naturalHeight;

                    if (!maskCanvasRef.current) {
                        maskCanvasRef.current = document.createElement('canvas');
                        maskCanvasRef.current.width = img.naturalWidth;
                        maskCanvasRef.current.height = img.naturalHeight;
                    }
                }
            };
            img.onload = updateSize;
        }
    }, [originalImage]);

    return (
        <div className="bg-remover-page">
            {/* Header */}
            <div className="editor-header">
                <h1 className="editor-title">Advanced Image Editor</h1>
                <div className="header-actions">
                    <button className="action-btn secondary-btn" onClick={() => window.location.reload()}>
                        <X size={16} /> Close
                    </button>
                    {processedImage ? (
                        <button className="action-btn primary-btn" onClick={() => {
                            const a = document.createElement('a');
                            a.href = processedImage;
                            a.download = 'edited-image.png';
                            a.click();
                        }}>
                            <Download size={16} /> Download
                        </button>
                    ) : (
                        originalImage && (
                            <button className="action-btn primary-btn" onClick={handleProceed} disabled={isProcessing}>
                                <Check size={16} /> Proceed / Remove BG
                            </button>
                        )
                    )}
                </div>
            </div>

            <div className="editor-main">
                {/* --- TOOLBAR (Left) --- */}
                {originalImage && !processedImage && (
                    <div className="editor-sidebar">
                        <div className="sidebar-group">
                            <span className="group-label">Tools</span>
                            <button
                                className={`sidebar-tool ${activeTool === 'object-select' ? 'active' : ''}`}
                                onClick={() => setActiveTool('object-select')}
                                title="Object Selection (Click & Hold)"
                            >
                                <Sparkles size={24} />
                                <span className="tool-name">Object Select</span>
                            </button>
                            <button
                                className={`sidebar-tool ${activeTool === 'quick-select' ? 'active' : ''}`}
                                onClick={() => setActiveTool('quick-select')}
                                title="Quick Selection (Paint)"
                            >
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/paint-brush.png" style={{ width: 24, height: 24, filter: 'invert(1)' }} alt="" /> {/* Using icon image or similar if Icon unavailable, reverting to generic if needed*/}
                                <span className="tool-name">Quick Select</span>
                            </button>
                            <button
                                className={`sidebar-tool ${activeTool === 'magic-wand' ? 'active' : ''}`}
                                onClick={() => setActiveTool('magic-wand')}
                                title="Magic Wand (Color Select)"
                            >
                                <Wand2 size={24} />
                                <span className="tool-name">Magic Wand</span>
                            </button>
                            <button
                                className={`sidebar-tool ${activeTool === 'pen' ? 'active' : ''}`}
                                onClick={() => setActiveTool('pen')}
                                title="Pen Tool"
                            >
                                <Pencil size={24} />
                                <span className="tool-name">Pen</span>
                            </button>
                            <button
                                className={`sidebar-tool ${activeTool === 'eraser' ? 'active' : ''}`}
                                onClick={() => setActiveTool('eraser')}
                                title="Eraser"
                            >
                                <Eraser size={24} />
                                <span className="tool-name">Eraser</span>
                            </button>
                            <button
                                className={`sidebar-tool ${activeTool === 'crop' ? 'active' : ''}`}
                                onClick={() => setActiveTool('crop')}
                                title="Crop Tool"
                            >
                                <Crop size={24} />
                                <span className="tool-name">Crop</span>
                            </button>
                        </div>
                        {/* SETTINGS PANELS */}
                        <div className="sidebar-settings">
                            {activeTool === 'object-select' && (
                                <div className="setting-panel">
                                    <p>Click & Hold to detect.</p>
                                </div>
                            )}
                            {(activeTool === 'pen' || activeTool === 'eraser') && (
                                <div className="setting-panel">
                                    <label>Size: {brushSize}px</label>
                                    <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
                                </div>
                            )}
                            {(activeTool === 'quick-select' || activeTool === 'magic-wand') && (
                                <div className="setting-panel">
                                    <label>Tolerance: {tolerance}</label>
                                    <input type="range" min="1" max="100" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- CANVAS AREA --- */}
                <div className="editor-canvas-area" ref={canvasContainerRef}>
                    {!originalImage ? (
                        <div className="upload-placeholder">
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                            <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={48} className="mb-4 text-primary" />
                                <h3>Upload Image</h3>
                                <p>Click here to start editing</p>
                            </div>
                        </div>
                    ) : (
                        <div className="canvas-wrapper-centered">
                            {processedImage ? (
                                <img src={processedImage} alt="Processed" className="result-img" />
                            ) : (
                                <div className="interactive-canvas-layer">
                                    <img ref={originalImageRef} src={originalImage} alt="Original" className="base-img" />
                                    <canvas
                                        ref={uiCanvasRef}
                                        className="overlay-canvas"
                                        onMouseDown={handlePointerDown}
                                        onMouseMove={handlePointerMove}
                                        onMouseUp={handlePointerUp}
                                        onMouseLeave={handlePointerUp}
                                        onTouchStart={handlePointerDown}
                                        onTouchMove={handlePointerMove}
                                        onTouchEnd={handlePointerUp}
                                    />
                                    {/* Smart Select Loader */}
                                    {cursorPos && activeTool === 'object-select' && (
                                        <div
                                            style={{
                                                position: 'fixed',
                                                top: cursorPos.y - 40,
                                                left: cursorPos.x - 40,
                                                width: 80, height: 80,
                                                pointerEvents: 'none',
                                                zIndex: 100
                                            }}
                                        >
                                            <svg viewBox="0 0 100 100" width="100%" height="100%">
                                                <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.3)" strokeWidth="6" fill="none" />
                                                <circle
                                                    cx="50" cy="50" r="45"
                                                    stroke="#4ade80"
                                                    strokeWidth="6"
                                                    fill="none"
                                                    strokeDasharray="283"
                                                    strokeDashoffset={283 - (283 * longPressProgress / 100)}
                                                    transform="rotate(-90 50 50)"
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    {isProcessing && (
                                        <div className="processing-overlay">
                                            <div className="spinner"></div>
                                            <span>Processing...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
