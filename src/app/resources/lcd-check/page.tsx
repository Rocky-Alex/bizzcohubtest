"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface ColorDef {
    id: string;
    key: string;
    name: string;
    hex: string;
}

const COLORS: ColorDef[] = [
    { id: "white", key: "1", name: "White", hex: "#FFFFFF" },
    { id: "black", key: "2", name: "Black", hex: "#000000" },
    { id: "red", key: "3", name: "Red", hex: "#FF0000" },
    { id: "green", key: "4", name: "Green", hex: "#00FF00" },
    { id: "blue", key: "5", name: "Blue", hex: "#0000FF" },
];

export default function LcdCheckPage() {
    // Always start with White
    const [activeColor, setActiveColor] = useState<ColorDef>(COLORS[0]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showHint, setShowHint] = useState(true);
    const router = useRouter();

    const enterFullscreen = async () => {
        try {
            const elem = containerRef.current;
            if (elem) {
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                } else if ((elem as any).webkitRequestFullscreen) {
                    (elem as any).webkitRequestFullscreen(); // Safari
                } else if ((elem as any).msRequestFullscreen) {
                    (elem as any).msRequestFullscreen(); // IE11
                }
            }
        } catch (err) {
            console.error("Error attempting to enable fullscreen:", err);
        }
    };

    const exitFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) {
                    (document as any).msExitFullscreen();
                }
            }
        } catch (err) {
            console.error("Error attempting to exit fullscreen:", err);
        }
    };

    const exitTest = useCallback(() => {
        exitFullscreen();
        router.push("/resources");
    }, [router]);

    const handleContainerClick = () => {
        if (!document.fullscreenElement) {
            enterFullscreen();
            setShowHint(false);
        }
    };

    useEffect(() => {
        // Attempt to auto-fullscreen on mount
        enterFullscreen();

        // Hide hint after 3 seconds
        const timer = setTimeout(() => {
            setShowHint(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key;

            if (key === "Escape") {
                // Prevent default behavior if needed, giving us control to exit and navigate
                // event.preventDefault(); // Optional, let's let browser handle exit FS, then we nav

                // We'll rely on the logic inside exitTest or just call it directly.
                // However, 'Escape' usually triggers browser exit-fullscreen. 
                // We can catch that or let it happen and catch logic below.
                // To be safe and explicit:
                exitTest();
                return;
            }

            const foundColor = COLORS.find((c) => c.key === key);
            if (foundColor) {
                setActiveColor(foundColor);
            }
        };

        // We can listen for fullscreen change to detect if user pressed Esc to exit fullscreen
        const handleFullscreenChange = () => {
            // We do NOT want to auto-exit to resources just because they left fullscreen 
            // (maybe they Alt-Tabbed or clicked exit).
            // BUT the user said "Once we click the Esc button it goes to resources page".
            // Browsers map Esc to Exit Fullscreen.
            // So if we detect full screen exit, should we navigate?
            // The prompt specifically said "click the Esc button".

            // If we bind "Escape" key, we handle that.
            // If the user clicks the browser "X" or exits some other way, maybe we stay on page?
            // Let's stick to the KeyDown event for navigation to be precise.
            // Actually, if they leave fullscreen, the page just sits there small. 
            // Let's leave it as is: KeyDown -> Navigate.
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [exitTest]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-screen"
            onClick={handleContainerClick}
            style={{
                backgroundColor: activeColor.hex,
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 9999,
                cursor: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            {/* Hint overlay */}
            {showHint && (
                <div className="bg-black/50 text-white px-6 py-3 rounded-full backdrop-blur-sm pointer-events-none select-none font-sans">
                    <p className="font-medium text-sm">Click for Fullscreen • Press Esc to Exit</p>
                </div>
            )}
        </div>
    );
}
