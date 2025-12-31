"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Keyboard, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface KeyState {
    code: string;
    label: string;
    width?: number; // relative width, default 1
    isPressed: boolean;
    hasBeenPressed: boolean;
}

// Initial layout data
const ROW_1 = [
    { code: "Escape", label: "Esc" },
    { code: "F1", label: "F1" },
    { code: "F2", label: "F2" },
    { code: "F3", label: "F3" },
    { code: "F4", label: "F4" },
    { code: "F5", label: "F5" },
    { code: "F6", label: "F6" },
    { code: "F7", label: "F7" },
    { code: "F8", label: "F8" },
    { code: "F9", label: "F9" },
    { code: "F10", label: "F10" },
    { code: "F11", label: "F11" },
    { code: "F12", label: "F12" },
    { code: "Delete", label: "Del" },
];

const ROW_2 = [
    { code: "Backquote", label: "`" },
    { code: "Digit1", label: "1" },
    { code: "Digit2", label: "2" },
    { code: "Digit3", label: "3" },
    { code: "Digit4", label: "4" },
    { code: "Digit5", label: "5" },
    { code: "Digit6", label: "6" },
    { code: "Digit7", label: "7" },
    { code: "Digit8", label: "8" },
    { code: "Digit9", label: "9" },
    { code: "Digit0", label: "0" },
    { code: "Minus", label: "-" },
    { code: "Equal", label: "=" },
    { code: "Backspace", label: "Backspace", width: 2 },
];

const ROW_3 = [
    { code: "Tab", label: "Tab", width: 1.5 },
    { code: "KeyQ", label: "Q" },
    { code: "KeyW", label: "W" },
    { code: "KeyE", label: "E" },
    { code: "KeyR", label: "R" },
    { code: "KeyT", label: "T" },
    { code: "KeyY", label: "Y" },
    { code: "KeyU", label: "U" },
    { code: "KeyI", label: "I" },
    { code: "KeyO", label: "O" },
    { code: "KeyP", label: "P" },
    { code: "BracketLeft", label: "[" },
    { code: "BracketRight", label: "]" },
    { code: "Backslash", label: "\\", width: 1.5 },
];

const ROW_4 = [
    { code: "CapsLock", label: "Caps", width: 1.8 },
    { code: "KeyA", label: "A" },
    { code: "KeyS", label: "S" },
    { code: "KeyD", label: "D" },
    { code: "KeyF", label: "F" },
    { code: "KeyG", label: "G" },
    { code: "KeyH", label: "H" },
    { code: "KeyJ", label: "J" },
    { code: "KeyK", label: "K" },
    { code: "KeyL", label: "L" },
    { code: "Semicolon", label: ";" },
    { code: "Quote", label: "'" },
    { code: "Enter", label: "Enter", width: 2.2 },
];

const ROW_5 = [
    { code: "ShiftLeft", label: "Shift", width: 2.4 },
    { code: "KeyZ", label: "Z" },
    { code: "KeyX", label: "X" },
    { code: "KeyC", label: "C" },
    { code: "KeyV", label: "V" },
    { code: "KeyB", label: "B" },
    { code: "KeyN", label: "N" },
    { code: "KeyM", label: "M" },
    { code: "Comma", label: "," },
    { code: "Period", label: "." },
    { code: "Slash", label: "/" },
    { code: "ShiftRight", label: "Shift", width: 2.4 },
];

const ROW_6 = [
    { code: "ControlLeft", label: "Ctrl", width: 1.5 },
    { code: "MetaLeft", label: "Win", width: 1.2 },
    { code: "AltLeft", label: "Alt", width: 1.2 },
    { code: "Space", label: "Space", width: 7 },
    { code: "AltRight", label: "Alt", width: 1.2 },
    { code: "MetaRight", label: "Win", width: 1.2 },
    { code: "ContextMenu", label: "Menu", width: 1.2 },
    { code: "ControlRight", label: "Ctrl", width: 1.5 },
];

const ARROWS = [
    { code: "ArrowUp", label: "↑" },
    { code: "ArrowLeft", label: "←" },
    { code: "ArrowDown", label: "↓" },
    { code: "ArrowRight", label: "→" },
]

export default function KeyboardCheckPage() {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const [lastKey, setLastKey] = useState<string>("");

    useEffect(() => {
        // Aggressively prevent default behavior for all keys
        const blockEvent = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.returnValue = false;
            return false;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            blockEvent(e);
            const code = e.code;
            setActiveKeys(prev => new Set(prev).add(code));
            setPressedKeys(prev => new Set(prev).add(code));
            setLastKey(code);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            blockEvent(e);
            const code = e.code;
            setActiveKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(code);
                return newSet;
            });
        };

        // Use capture phase to intercept events before other listeners
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        window.addEventListener("keyup", handleKeyUp, { capture: true });
        // Block keypress as well usually for complete coverage
        window.addEventListener("keypress", blockEvent, { capture: true });

        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
            window.removeEventListener("keyup", handleKeyUp, { capture: true });
            window.removeEventListener("keypress", blockEvent, { capture: true });
        };
    }, []);

    const resetTest = () => {
        setPressedKeys(new Set());
        setActiveKeys(new Set());
        setLastKey("");
    };

    const renderKey = (key: { code: string; label: string; width?: number }) => {
        const isPressed = activeKeys.has(key.code);
        const hasBeenPressed = pressedKeys.has(key.code);

        // CSS for keys
        const baseStyle: React.CSSProperties = {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.1s ease',
            userSelect: 'none',
            flexGrow: key.width || 1,
            flexBasis: 0,
            margin: '3px',
            height: '56px',
            cursor: 'default',
            boxSizing: 'border-box',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        };

        let activeStyle: React.CSSProperties = {};

        if (isPressed) {
            // Active Blue
            activeStyle = {
                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                color: '#ffffff',
                transform: 'translateY(4px)',
                boxShadow: '0 0 15px rgba(37,99,235,0.6), inset 0 1px 1px rgba(255,255,255,0.4)',
                borderBottom: '0px solid #1e3a8a',
            };
        } else if (hasBeenPressed) {
            // Tested Green-ish
            activeStyle = {
                background: 'linear-gradient(135deg, #262626, #171717)',
                color: '#4ade80', // green-400
                borderBottom: '4px solid rgba(23, 23, 23, 0.8)',
                boxShadow: '0 0 10px rgba(34,197,94,0.1), inset 0 0 0 1px rgba(34,197,94,0.3)',
            };
        } else {
            // default dark
            activeStyle = {
                background: 'linear-gradient(135deg, #262626, #171717)',
                color: '#9ca3af', // neutral-400
                borderBottom: '4px solid #0a0a0a',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.5)',
            };
        }

        // Combine styles. Active overwrites base where needed.
        const combinedStyle = { ...baseStyle, ...activeStyle };

        return (
            <div
                key={key.code}
                style={combinedStyle}
            >
                {/* Highlight */}
                <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '8px',
                    right: '8px',
                    height: '1px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '999px',
                    pointerEvents: 'none',
                }}></div>
                {key.label}
            </div>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a0a', // neutral-950
            color: 'white',
            padding: '24px',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <header style={{
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '1152px',
                width: '100%',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}>
                <Link
                    href="/resources"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#9ca3af',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                    }}
                >
                    <ArrowLeft size={20} style={{ marginRight: '8px' }} />
                    Back to Resources
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#737373' }}>Last Pressed</div>
                        <div style={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 'bold' }}>{lastKey || "-"}</div>
                    </div>
                </div>
            </header>

            <main style={{
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        background: 'rgba(37, 99, 235, 0.2)',
                        padding: '12px',
                        borderRadius: '999px',
                        width: '64px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        color: '#3b82f6'
                    }}>
                        <Keyboard size={32} />
                    </div>
                    <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '8px' }}>Keyboard Tester</h1>
                    <p style={{ color: '#9ca3af' }}>
                        Press keys on your physical keyboard to check functionality.
                    </p>
                </div>

                <div style={{
                    width: '100%',
                    backgroundColor: '#171717',
                    padding: '32px',
                    borderRadius: '16px',
                    border: '1px solid #262626',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflowX: 'auto'
                }}>
                    {/* Main Block - Force Flex Column */}
                    <div style={{ minWidth: '800px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', width: '100%' }}>{ROW_1.map(renderKey)}</div>
                        <div style={{ display: 'flex', width: '100%' }}>{ROW_2.map(renderKey)}</div>
                        <div style={{ display: 'flex', width: '100%' }}>{ROW_3.map(renderKey)}</div>
                        <div style={{ display: 'flex', width: '100%' }}>{ROW_4.map(renderKey)}</div>
                        <div style={{ display: 'flex', width: '100%' }}>{ROW_5.map(renderKey)}</div>
                        <div style={{ display: 'flex', width: '100%' }}>{ROW_6.map(renderKey)}</div>
                    </div>

                    {/* Arrow Keys */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {renderKey(ARROWS[0])}
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {renderKey(ARROWS[1])}
                                {renderKey(ARROWS[2])}
                                {renderKey(ARROWS[3])}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', width: '100%', gap: '16px' }}>
                    <button
                        onClick={resetTest}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: '#262626',
                            color: 'white',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        <RotateCcw size={18} />
                        Reset Test
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                if (!document.fullscreenElement) {
                                    await document.documentElement.requestFullscreen();
                                    const nav = navigator as any;
                                    if (nav.keyboard && nav.keyboard.lock) {
                                        // Request to lock all keys
                                        await nav.keyboard.lock();
                                    }
                                } else {
                                    await document.exitFullscreen();
                                    const nav = navigator as any;
                                    if (nav.keyboard && nav.keyboard.unlock) {
                                        nav.keyboard.unlock();
                                    }
                                }
                            } catch (err) {
                                console.error("Lock failed:", err);
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: '#2563eb',
                            color: 'white',
                            border: '1px solid #1d4ed8',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            boxShadow: '0 0 15px rgba(37,99,235,0.4)'
                        }}
                    >
                        <Keyboard size={18} />
                        Exclusive Mode
                    </button>
                </div>

                <div style={{ marginTop: '32px', color: '#737373', fontSize: '14px', maxWidth: '600px', textAlign: 'center' }}>
                    Note: Some system keys (like Fn) might not be detectable by the browser.
                    PrintScreen and special media keys may have varying behavior depending on OS.
                </div>
            </main>
        </div>
    );
}
