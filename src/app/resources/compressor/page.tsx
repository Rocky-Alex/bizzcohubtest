"use client";

import React, { useState, useRef, useEffect } from "react";
import "./compressor.css";
import { Upload, Download, RefreshCw, X, Image as ImageIcon, Sparkles, FileInput, ArrowRight } from "lucide-react";
import imageCompression from "browser-image-compression";

interface ImageStats {
    size: number;
    width: number;
    height: number;
    url: string;
}

export default function CompressorPage() {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);

    const [processedImage, setProcessedImage] = useState<Blob | null>(null);
    const [processedStats, setProcessedStats] = useState<ImageStats | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings
    const [targetSizeKB, setTargetSizeKB] = useState<string>(""); // User input as string
    const [resizeWidth, setResizeWidth] = useState<string>("");
    const [resizeHeight, setResizeHeight] = useState<string>("");
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [aspectRatio, setAspectRatio] = useState<number>(1);

    // Handle File Selection
    const handleFile = async (file: File) => {
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);

            // Get Dimensions
            const img = new Image();
            img.src = url;
            img.onload = () => {
                setOriginalStats({
                    size: file.size,
                    width: img.width,
                    height: img.height,
                    url: url
                });
                setOriginalImage(file);
                setProcessedImage(null);
                setProcessedStats(null);

                // Initialize settings
                setResizeWidth(img.width.toString());
                setResizeHeight(img.height.toString());
                setAspectRatio(img.width / img.height);
                // Default target size to 80% of original if not set
                setTargetSizeKB(Math.floor(file.size / 1024 * 0.8).toString());
            };
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Resizing Logic for Inputs
    const handleWidthChange = (val: string) => {
        setResizeWidth(val);
        if (maintainAspectRatio && val && aspectRatio) {
            setResizeHeight(Math.round(parseInt(val) / aspectRatio).toString());
        }
    };

    const handleHeightChange = (val: string) => {
        setResizeHeight(val);
        if (maintainAspectRatio && val && aspectRatio) {
            setResizeWidth(Math.round(parseInt(val) * aspectRatio).toString());
        }
    };

    // Main Process Logic
    const processImage = async () => {
        if (!originalImage || !originalStats) return;
        setIsProcessing(true);

        try {
            // 1. Resize Step (if strictly needed to change dimensions independently or Upscale)
            // browser-image-compression handles downscaling well, but for specific W/H resizing (esp. upscale or aspect change),
            // it's safer to pre-process with Canvas.
            let inputToCompress = originalImage;

            const targetW = parseInt(resizeWidth);
            const targetH = parseInt(resizeHeight);

            // Check if resize is needed
            const needsResize = targetW !== originalStats.width || targetH !== originalStats.height;

            if (needsResize) {
                // Perform Canvas Resize (Supports Upscaling)
                const canvas = document.createElement("canvas");
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas context failed");

                // Load image to draw
                await new Promise<void>((resolve, reject) => {
                    const img = new Image();
                    img.src = originalStats.url;
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, targetW, targetH);
                        resolve();
                    };
                    img.onerror = reject;
                });

                // Convert canvas back to file
                const resizedBlob = await new Promise<Blob | null>(resolve =>
                    canvas.toBlob(resolve, originalImage.type, 1.0)
                );

                if (resizedBlob) {
                    inputToCompress = new File([resizedBlob], originalImage.name, {
                        type: originalImage.type,
                        lastModified: Date.now(),
                    });
                }
            }

            // 2. Compression Step
            const targetSize = parseFloat(targetSizeKB) || 0;
            const sizeInMB = targetSize / 1024;

            // If target size is larger than current file and we just resized (or didn't), 
            // browser-image-compression might NOT increase size to meet target.
            // It only compresses DOWN.
            // So if user just wants resize (upscale) without compression limiting, we might skip compression 
            // if the file is already smaller than target (or target is huge).

            let finalBlob = inputToCompress;

            // Only compress if we actually have a target size constraint that requires reduction
            // OR if the user explicitly wants to "compress".
            // However, the library is "imageCompression".
            // If we use maxSizeMB equals to `sizeInMB`, it will try to get under that.

            if (targetSize > 0) {
                const options = {
                    maxSizeMB: sizeInMB,
                    maxWidthOrHeight: undefined, // Already handled resize manually
                    useWebWorker: true,
                    initialQuality: 1.0 // Try to keep quality high if size allows
                };

                try {
                    finalBlob = await imageCompression(inputToCompress, options);
                } catch (err) {
                    console.warn("Compression might have failed or not needed:", err);
                    // Fallback to the resized image
                    finalBlob = inputToCompress;
                }
            }

            // Update Result
            const finalUrl = URL.createObjectURL(finalBlob);

            // Get final dimensions
            const finalImg = new Image();
            finalImg.src = finalUrl;
            await new Promise<void>((resolve) => {
                finalImg.onload = () => resolve();
            });

            setProcessedImage(finalBlob);
            setProcessedStats({
                size: finalBlob.size,
                width: finalImg.width,
                height: finalImg.height,
                url: finalUrl
            });

        } catch (error) {
            console.error("Processing failed:", error);
            alert("An error occurred while processing the image.");
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadImage = () => {
        if (!processedImage || !processedStats) return;
        const link = document.createElement("a");
        link.href = processedStats.url;
        link.download = `compressed-${originalImage?.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="compressor-page">
            <div className="tool-header">
                <h1 className="tool-title">Smart Image Compressor</h1>
                <p className="tool-description">
                    Resize, upscale, and compress your images to the exact size you need.
                    <br />Perfect for web optimization and client requirements.
                </p>
            </div>

            <div className="workspace-container">
                {!originalStats ? (
                    <div
                        className={`upload-area ${dragActive ? 'dragging' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="upload-content">
                            <Upload size={48} className="upload-icon" />
                            <span className="upload-text">Click to upload or drag & drop</span>
                            <span className="upload-subtext">Supports JPG, PNG, WEBP</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="file-input"
                            accept="image/*"
                            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                        />
                    </div>
                ) : (
                    <div className="compressor-workspace">
                        {/* Settings Panel */}
                        <div className="settings-panel">
                            <div className="settings-section">
                                <span className="section-title"><RefreshCw size={18} /> Resize Dimensions</span>
                                <div className="input-group">
                                    <div className="input-row">
                                        <input
                                            type="number"
                                            placeholder="Width"
                                            className="number-input"
                                            value={resizeWidth}
                                            onChange={(e) => handleWidthChange(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Height"
                                            className="number-input"
                                            value={resizeHeight}
                                            onChange={(e) => handleHeightChange(e.target.value)}
                                        />
                                    </div>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={maintainAspectRatio}
                                            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                        />
                                        Lock Aspect Ratio
                                    </label>
                                </div>
                            </div>

                            <div className="settings-section">
                                <span className="section-title"><FileInput size={18} /> Compression Target</span>
                                <div className="input-group">
                                    <label className="input-label">Target File Size (KB)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 500"
                                        className="number-input"
                                        value={targetSizeKB}
                                        onChange={(e) => setTargetSizeKB(e.target.value)}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Current: {formatSize(originalStats.size)}
                                    </span>
                                </div>
                            </div>

                            <div className="settings-section" style={{ border: 'none', flexDirection: 'row', gap: '1rem' }}>
                                <button className="action-btn secondary-btn" onClick={() => {
                                    setOriginalImage(null);
                                    setOriginalStats(null);
                                    setProcessedImage(null);
                                }} style={{ flex: 1 }}>
                                    <X size={16} /> Reset
                                </button>
                                <button
                                    className="action-btn primary-btn"
                                    onClick={processImage}
                                    disabled={isProcessing}
                                    style={{ flex: 1 }}
                                >
                                    {isProcessing ? 'Processing...' : 'Apply Details'}
                                </button>
                            </div>

                            {processedStats && (
                                <button
                                    className="action-btn primary-btn"
                                    onClick={downloadImage}
                                    style={{ background: 'var(--success)', justifyContent: 'center' }}
                                >
                                    <Download size={18} /> Download Result
                                </button>
                            )}
                        </div>

                        {/* Preview Area */}
                        <div className="preview-area">
                            <div className="image-card">
                                <div className="card-header">
                                    <span>Original</span>
                                    <span className="size-badge">{formatSize(originalStats.size)}</span>
                                </div>
                                <div className="image-preview-wrapper">
                                    <img src={originalStats.url} className="preview-img" alt="Original" />
                                </div>
                                <div className="file-info">
                                    <span>{originalStats.width} x {originalStats.height} px</span>
                                </div>
                            </div>

                            <div className="image-card">
                                <div className="card-header">
                                    <span>Result</span>
                                    {processedStats ? (
                                        <span className="size-badge" style={{ color: 'var(--success-dark)', background: '#dcfce7' }}>{formatSize(processedStats.size)}</span>
                                    ) : (
                                        <span className="size-badge">---</span>
                                    )}
                                </div>
                                <div className="image-preview-wrapper">
                                    {isProcessing && (
                                        <div className="loading-overlay">
                                            <div className="spinner"></div>
                                            <span>Crunching pixels...</span>
                                        </div>
                                    )}
                                    {processedStats ? (
                                        <img src={processedStats.url} className="preview-img" alt="Processed" />
                                    ) : (
                                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.5 }}>
                                            <ImageIcon size={48} />
                                            <p>Preview will appear here</p>
                                        </div>
                                    )}
                                </div>
                                <div className="file-info">
                                    {processedStats ? (
                                        <>
                                            <span>{processedStats.width} x {processedStats.height} px</span>
                                            {processedStats.size < originalStats.size && (
                                                <span style={{ color: 'var(--success)' }}>
                                                    Saved {formatSize(originalStats.size - processedStats.size)}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span>&nbsp;</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
