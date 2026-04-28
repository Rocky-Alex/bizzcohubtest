'use client';

import React from 'react';
import { motion } from 'framer-motion';
import '../styles/logo-orbit.css';

const LogoOrbit = () => {
    // 4 Rings with adjusted radii and dot sizes
    const rings = [
        { dots: 20, radius: 155, size: 5.5, offset: 0 },         
        { dots: 20, radius: 185, size: 7.5, offset: Math.PI / 20 }, 
        { dots: 20, radius: 215, size: 10.5, offset: 0 },            
        { dots: 20, radius: 245, size: 14.0, offset: Math.PI / 20 }, 
    ];

    // High-fidelity color spectrum
    const spectrum = [
        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', 
        '#f97316', '#fb923c', '#facc15', '#a3e635', '#22c55e', '#10b981', '#06b6d4', 
        '#0ea5e9', '#3b82f6',
    ];

    const getColorAtAngle = (angle: number) => {
        const normalized = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI) / (2 * Math.PI);
        const index = normalized * spectrum.length;
        const i1 = Math.floor(index) % spectrum.length;
        const i2 = (i1 + 1) % spectrum.length;
        const t = index - Math.floor(index);

        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        };

        const c1 = hexToRgb(spectrum[i1]);
        const c2 = hexToRgb(spectrum[i2]);
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);

        return `rgb(${r}, ${g}, ${b})`;
    };

    return (
        <div className="apple-style-orbit">
            <div className="apple-logo-center">
                <img src="/icon/nav-logo.png" alt="Logo" className="apple-center-img" />
            </div>

            <svg viewBox="-300 -300 600 600" className="apple-dots-svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <radialGradient id="soft-dot-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="65%" stopColor="currentColor" stopOpacity="1" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {rings.map((ring, ringIndex) => (
                    <React.Fragment key={ringIndex}>
                        {Array.from({ length: ring.dots }).map((_, i) => {
                            const angle = ((i / ring.dots) * 2 * Math.PI) + ring.offset;
                            const x = ring.radius * Math.cos(angle);
                            const y = ring.radius * Math.sin(angle);
                            
                            const color = getColorAtAngle(angle);

                            return (
                                <motion.circle 
                                    key={`${ringIndex}-${i}`} 
                                    cx={x}
                                    cy={y}
                                    r={ring.size}
                                    fill={color}
                                    initial={{ 
                                        opacity: 1,
                                        scale: 1,
                                        // Starting sharp (no filter)
                                        filter: "blur(0px)" 
                                    }}
                                    animate={{ 
                                        // Syncing scale, opacity, and softness (blur)
                                        scale: [1, 1.35, 1],
                                        opacity: [1, 0.6, 1],
                                        filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: (ringIndex * 0.45) + (i * 0.1)
                                    }}
                                    className="apple-dot"
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </svg>
        </div>
    );
};

export default LogoOrbit;
