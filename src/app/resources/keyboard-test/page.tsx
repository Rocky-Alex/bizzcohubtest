"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Keyboard, RotateCcw, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface KeyState {
    code: string;
    label: string;
    width?: number; // relative width, default 1
    isPressed: boolean;
    hasBeenPressed: boolean;
}

// Initial layout data
// TKL Layout Data

// 1. Function Row Data - Split for alignment
const FUNCTION_ROW_LEFT = [
    { code: "Escape", label: "Esc", width: 1.5 },
    { code: "gap1", label: "", width: 1.5 }, // Spacing
    { code: "F1", label: "F1" },
    { code: "F2", label: "F2" },
    { code: "F3", label: "F3" },
    { code: "F4", label: "F4" },
    { code: "gap2", label: "", width: 1.5 },
    { code: "F5", label: "F5" },
    { code: "F6", label: "F6" },
    { code: "F7", label: "F7" },
    { code: "F8", label: "F8" },
    { code: "gap3", label: "", width: 1.5 },
    { code: "F9", label: "F9" },
    { code: "F10", label: "F10" },
    { code: "F11", label: "F11" },
    { code: "F12", label: "F12" },
];

const FUNCTION_ROW_RIGHT = [
    { code: "PrintScreen", label: "PrtSc" },
    { code: "ScrollLock", label: "ScrLk" },
    { code: "Pause", label: "Pause" },
];

// 2. Main Alpha Block
const ALPHA_ROW_1 = [
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

const ALPHA_ROW_2 = [
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

const ALPHA_ROW_3 = [
    { code: "CapsLock", label: "Caps", width: 1.95 },
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
    { code: "Enter", label: "Enter", width: 2.20 },
];

const ALPHA_ROW_4 = [
    { code: "ShiftLeft", label: "Shift", width: 2.5 },
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
    { code: "ShiftRight", label: "Shift", width: 2.75 },
];

const ALPHA_ROW_5 = [
    { code: "ControlLeft", label: "Ctrl", width: 1.25 },
    { code: "MetaLeft", label: "Win", width: 1.25 },
    { code: "AltLeft", label: "Alt", width: 1.35 },
    { code: "Space", label: "Space", width: 6.25 },
    { code: "AltRight", label: "Alt", width: 1.45 },
    { code: "MetaRight", label: "Win", width: 1.25 },
    { code: "ContextMenu", label: "Menu", width: 1.25 },
    { code: "ControlRight", label: "Ctrl", width: 1.77 },
];

// 3. Navigation Block (Insert, Home, PgUp...)
const NAV_ROW_1 = [
    { code: "Insert", label: "Ins" },
    { code: "Home", label: "Home" },
    { code: "PageUp", label: "PgUp" },
];

const NAV_ROW_2 = [
    { code: "Delete", label: "Del" },
    { code: "End", label: "End" },
    { code: "PageDown", label: "PgDn" },
];

const ARROW_KEYS = [
    { code: "ArrowUp", label: "↑" },
    { code: "ArrowLeft", label: "←" },
    { code: "ArrowDown", label: "↓" },
    { code: "ArrowRight", label: "→" },
];

const NUMPAD_KEYS = [
    { code: "NumLock", label: "Num", gridArea: "1 / 1 / 2 / 2" },
    { code: "NumpadDivide", label: "/", gridArea: "1 / 2 / 2 / 3" },
    { code: "NumpadMultiply", label: "*", gridArea: "1 / 3 / 2 / 4" },
    { code: "NumpadSubtract", label: "-", gridArea: "1 / 5 / 2 / 6" }, // Moved to Col 5
    { code: "Numpad7", label: "7", gridArea: "2 / 1 / 3 / 2" },
    { code: "Numpad8", label: "8", gridArea: "2 / 2 / 3 / 3" },
    { code: "Numpad9", label: "9", gridArea: "2 / 3 / 3 / 4" },
    { code: "NumpadAdd", label: "+", gridArea: "2 / 5 / 4 / 6" }, // Moved to Col 5
    { code: "Numpad4", label: "4", gridArea: "3 / 1 / 4 / 2" },
    { code: "Numpad5", label: "5", gridArea: "3 / 2 / 4 / 3" },
    { code: "Numpad6", label: "6", gridArea: "3 / 3 / 4 / 4" },
    { code: "Numpad1", label: "1", gridArea: "4 / 1 / 5 / 2" },
    { code: "Numpad2", label: "2", gridArea: "4 / 2 / 5 / 3" },
    { code: "Numpad3", label: "3", gridArea: "4 / 3 / 5 / 4" },
    { code: "NumpadEnter", label: "Ent", gridArea: "4 / 5 / 6 / 6" }, // Moved to Col 5
    { code: "Numpad0", label: "0", gridArea: "5 / 1 / 6 / 3" },
    { code: "NumpadDecimal", label: ".", gridArea: "5 / 3 / 6 / 4" },
];

// ... (existing code)



export default function KeyboardCheckPage() {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const [lastKey, setLastKey] = useState<string>("");

    // Toggle for Mini (60%/TKL) vs Full (with Numpad)
    const [isFullLayout, setIsFullLayout] = useState(true);

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

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


        const handleBlur = () => {
            setActiveKeys(new Set()); // Clear pressed keys visual state when window loses focus
        };

        // Use capture phase to intercept events before other listeners
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        window.addEventListener("keyup", handleKeyUp, { capture: true });
        // Block keypress as well usually for complete coverage
        window.addEventListener("keypress", blockEvent, { capture: true });
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
            window.removeEventListener("keyup", handleKeyUp, { capture: true });
            window.removeEventListener("keypress", blockEvent, { capture: true });
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

    const resetTest = () => {
        setPressedKeys(new Set());
        setActiveKeys(new Set());
        setLastKey("");
    };

    const renderKey = (key: { code: string; label: string; width?: number; gridArea?: string }) => {
        const isPressed = activeKeys.has(key.code);
        const hasBeenPressed = pressedKeys.has(key.code);

        // CSS for keys
        const baseStyle: React.CSSProperties = {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px', // Slightly rounder for modern feel
            fontSize: 'clamp(14px, 1.5vw, 20px)', // Larger, clearer font
            fontWeight: 'bold',
            transition: 'all 0.05s ease-out',
            userSelect: 'none',
            flexGrow: key.width || 1,
            flexBasis: 0,
            gridArea: key.gridArea, // Explicit grid placement for Numpad
            margin: '2px',
            height: key.gridArea ? '100%' : 'clamp(48px, 8vh, 72px)', // Use grid height for Numpad, fixed height for others
            minWidth: key.width ? `calc(${key.width} * clamp(40px, 4vw, 64px))` : 'clamp(40px, 4vw, 64px)', // Enforce minimum widths closer to physical size
            cursor: 'default',
            boxSizing: 'border-box',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: '#e5e5e5',
            border: 'none',
            // Default 3D state
            background: 'linear-gradient(to bottom, #262626, #171717)',
            boxShadow: '0 4px 0 #0a0a0a, 0 5px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)', // Deeper shadow for taller keys
            transform: 'translateY(0)',
        };

        let activeStyle: React.CSSProperties = {};

        if (isPressed) {
            // Pressed State (3D Effect: move down, reduce shadow)
            activeStyle = {
                background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', // Blue gradient
                color: '#ffffff',
                transform: 'translateY(4px)', // Move down equal to shadow height
                boxShadow: '0 0 0 #1e3a8a, inset 0 2px 5px rgba(0,0,0,0.3)', // Remove bottom shadow, add inner shadow
            };
        } else if (hasBeenPressed) {
            // Tested State (3D, Green tint)
            activeStyle = {
                background: 'linear-gradient(to bottom, #171717, #0f0f0f)',
                color: '#4ade80', // Green text
                borderColor: '#4ade80',
                boxShadow: '0 4px 0 #0a0a0a, 0 5px 5px rgba(0,0,0,0.4), inset 0 0 0 1px #22c55e', // Green border glow
            };
        } else {
            // Default inactive state is covered by baseStyle
        }

        // Combine styles. Active overwrites base where needed.
        const combinedStyle = { ...baseStyle, ...activeStyle };

        return (
            <div
                key={key.code}
                style={combinedStyle}
            >
                {/* Key Cap Highlight (Top edge) */}
                {!isPressed && <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '4px',
                    right: '4px',
                    height: '2px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    pointerEvents: 'none',
                }}></div>}

                {key.label}
            </div>
        );
    };

    const NUMPAD_TOP_ROW = [
        { code: "NumLock", label: "Num", width: 1 },
        { code: "NumpadDivide", label: "/", width: 1 },
        { code: "NumpadMultiply", label: "*", width: 1 },
        { code: "NumpadSubtract", label: "-", width: 1 },
    ];
    const NUMPAD_BODY_KEYS = [
        { code: "Numpad7", label: "7", gridArea: "1 / 1 / 2 / 2" },
        { code: "Numpad8", label: "8", gridArea: "1 / 2 / 2 / 3" },
        { code: "Numpad9", label: "9", gridArea: "1 / 3 / 2 / 4" },
        { code: "NumpadAdd", label: "+", gridArea: "1 / 5 / 3 / 6" },
        { code: "Numpad4", label: "4", gridArea: "2 / 1 / 3 / 2" },
        { code: "Numpad5", label: "5", gridArea: "2 / 2 / 3 / 3" },
        { code: "Numpad6", label: "6", gridArea: "2 / 3 / 3 / 4" },
        { code: "Numpad1", label: "1", gridArea: "3 / 1 / 4 / 2" },
        { code: "Numpad2", label: "2", gridArea: "3 / 2 / 4 / 3" },
        { code: "Numpad3", label: "3", gridArea: "3 / 3 / 4 / 4" },
        { code: "NumpadEnter", label: "Ent", gridArea: "3 / 5 / 5 / 6" },
        { code: "Numpad0", label: "0", gridArea: "4 / 1 / 5 / 3" },
        { code: "NumpadDecimal", label: ".", gridArea: "4 / 3 / 5 / 4" },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a', // neutral-950
            color: 'white',
            padding: '96px 16px 16px 16px',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            overflowY: 'auto'
        }}>
            <header style={{
                flex: '0 0 auto',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '1400px',
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
                    Back
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {/* Toggle Mode */}


                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#737373' }}>Last Pressed</div>
                        <div style={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 'bold' }}>{lastKey || "-"}</div>
                    </div>
                </div>
            </header>

            <main style={{
                flex: '1 1 auto',
                width: '100%',
                maxWidth: '100%',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2vh'
            }}>
                <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                    <div style={{
                        background: 'rgba(37, 99, 235, 0.2)',
                        padding: '12px',
                        borderRadius: '999px',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px auto',
                        color: '#3b82f6'
                    }}>
                        <Keyboard size={24} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>Keyboard Tester</h1>
                </div>

                <div style={{
                    width: 'fit-content',
                    backgroundColor: '#0a0a0a', // Main Chassis
                    padding: 'clamp(20px, 3vh, 40px)',
                    borderRadius: '24px',
                    border: '1px solid #262626',
                    boxShadow: '0 0 0 1px #000, 0 20px 60px -10px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start', // Align everything to the left
                    gap: '16px',
                    overflowX: 'auto',
                }}>

                    {/* NEW LAYOUT STRUCTURE: COLUMNS */}
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>

                        {/* COLUMN 1: MAIN BOARD (F-Row Left + Alpha Block) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* F-Row Left */}
                            <div style={{ display: 'flex', width: '100%' }}>
                                {FUNCTION_ROW_LEFT.map((key, i) => {
                                    if (key.code.startsWith('gap')) return <div key={i} style={{ width: `calc(${key.width} * clamp(40px, 4vw, 64px))` }}></div>;
                                    return renderKey(key);
                                })}
                            </div>

                            {/* Alpha Block */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>{ALPHA_ROW_1.map(renderKey)}</div>
                                <div style={{ display: 'flex', gap: '4px' }}>{ALPHA_ROW_2.map(renderKey)}</div>
                                <div style={{ display: 'flex', gap: '4px' }}>{ALPHA_ROW_3.map(renderKey)}</div>
                                <div style={{ display: 'flex', gap: '4px' }}>{ALPHA_ROW_4.map(renderKey)}</div>
                                <div style={{ display: 'flex', gap: '4px' }}>{ALPHA_ROW_5.map(renderKey)}</div>
                            </div>
                        </div>

                        {/* COLUMN 2: NAV CLUSTER (F-Row Right + Nav Keys + Arrows) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 'fit-content' }}>

                            {/* F-Row Right (PrtSc...) */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {FUNCTION_ROW_RIGHT.map(renderKey)}
                            </div>

                            {/* Nav Keys & Arrows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {/* Row 1: Ins Home PgUp */}
                                <div style={{ display: 'flex', gap: '4px' }}>{NAV_ROW_1.map(renderKey)}</div>

                                {/* Row 2: Del End PgDn */}
                                <div style={{ display: 'flex', gap: '4px' }}>{NAV_ROW_2.map(renderKey)}</div>

                                {/* Row 3: Empty Spacer */}
                                {/* Row 3: Site Title (Mini Mode) or Spacer (Full Mode) */}
                                {!isFullLayout ? (
                                    <div style={{
                                        height: 'clamp(48px, 8vh, 72px)',
                                        margin: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#525252',
                                        fontSize: 'clamp(14px, 1.5vw, 18px)',
                                        fontWeight: '900',
                                        fontStyle: 'italic',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        userSelect: 'none',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        Bizz Co Hub
                                    </div>
                                ) : (
                                    <div style={{ height: 'clamp(48px, 8vh, 72px)', margin: '2px' }}></div>
                                )}

                                {/* Row 4: Arrow Up */}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <div style={{ flexGrow: 1, flexBasis: 0, margin: '2px' }}></div>
                                    {renderKey(ARROW_KEYS[0])} {/* UP */}
                                    <div style={{ flexGrow: 1, flexBasis: 0, margin: '2px' }}></div>
                                </div>

                                {/* Row 5: Arrow Left Down Right */}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {renderKey(ARROW_KEYS[1])} {/* LEFT */}
                                    {renderKey(ARROW_KEYS[2])} {/* DOWN */}
                                    {renderKey(ARROW_KEYS[3])} {/* RIGHT */}
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 3: NUMPAD (Toggleable) */}
                        {isFullLayout && (
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 'fit-content' }}>
                                {/* Spacer for Alignment with PrtSc Row */}
                                <div style={{
                                    height: 'clamp(48px, 8vh, 72px)',
                                    margin: '2px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#525252',
                                    fontSize: 'clamp(14px, 1.5vw, 18px)',
                                    fontWeight: '900',
                                    fontStyle: 'italic',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    userSelect: 'none'
                                }}>
                                    Bizz Co Hub
                                </div>

                                {/* Row 1: Num / * - */}
                                {/* Row 1: Num / * - */}
                                {/* Note: Adding marginBottom 8px to satisfy user request "from there downwards 8px gap" */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 2px 1fr', gridAutoRows: 'clamp(48px, 8vh, 72px)', gap: '8px', marginBottom: '8px' }}>
                                    {NUMPAD_TOP_ROW.map((key, i) => {
                                        const col = i === 3 ? 5 : i + 1;
                                        return renderKey({ ...key, gridArea: `1 / ${col} / 2 / ${col + 1}` });
                                    })}
                                </div>

                                {/* Body Grid: 7-9 ... */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr) 2px 1fr',
                                    gridTemplateRows: 'repeat(4, clamp(48px, 8vh, 72px))',
                                    gap: '8px',
                                }}>
                                    {NUMPAD_BODY_KEYS.map(key => renderKey({ ...key, width: undefined }))}
                                </div>
                            </div>
                        )}



                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', width: '100%', gap: '16px', flex: '0 0 auto' }}>
                    {/* Toggle Mode */}
                    <button
                        onClick={() => setIsFullLayout(!isFullLayout)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: '#262626',
                            color: isFullLayout ? '#60a5fa' : '#a3a3a3',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        <Keyboard size={16} />
                        {isFullLayout ? "Full Layout (With Numpad)" : "Mini Layout"}
                    </button>
                    <button
                        onClick={resetTest}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: '#262626',
                            color: 'white',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        <RotateCcw size={16} />
                        Reset
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: '#262626',
                            color: 'white',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        title="Reload the page (F5 is blocked for testing)"
                    >
                        <RefreshCw size={16} />
                        Reload
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                if (!document.fullscreenElement) {
                                    // 1. Always attempt Fullscreen first (works on all modern browsers)
                                    await document.documentElement.requestFullscreen();

                                    // 2. Try to lock keys if supported (Chrome/Edge/Brave)
                                    const nav = navigator as any;
                                    if (nav.keyboard && nav.keyboard.lock) {
                                        try {
                                            // Explicitly request commonly 'slippery' system keys
                                            // Note: 'Escape' is usually not lockable for security reasons (allows exit fullscreen)
                                            await nav.keyboard.lock(["MetaLeft", "MetaRight", "AltLeft", "AltRight", "Tab"]);
                                            toast.success("System Keys Locked (Chrome/Edge)", { description: "The Windows key should now be trapped inside this window." });
                                        } catch (e) {
                                            console.error("Lock error", e);
                                            toast.warning("Could not lock system keys.");
                                        }
                                    } else {
                                        // 3. Fallback for Firefox/Safari/Opera Mini
                                        toast.info("Fullscreen Active.", {
                                            description: "Your browser does not allow websites to control the Windows Key. This is a security limitation of Firefox/Safari.",
                                            duration: 6000,
                                        });
                                    }
                                } else {
                                    // Exit Fullscreen
                                    await document.exitFullscreen();
                                    const nav = navigator as any;
                                    if (nav.keyboard && nav.keyboard.unlock) {
                                        nav.keyboard.unlock();
                                        toast.info("Keyboard Unlocked");
                                    }
                                }
                            } catch (err) {
                                console.error("Fullscreen failed:", err);
                                toast.error("Failed to enter fullscreen mode.");
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: isFullscreen ? '#16a34a' : '#2563eb',
                            color: 'white',
                            border: isFullscreen ? '1px solid #15803d' : '1px solid #1d4ed8',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            boxShadow: isFullscreen ? '0 0 15px rgba(22, 163, 74, 0.4)' : '0 0 15px rgba(37,99,235,0.4)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {isFullscreen ? <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle2 size={18} /> <span>Mode Active (Press Esc to Exit)</span></div> : <><Keyboard size={18} /> <span>Prevent System Keys (Fullscreen)</span></>}
                    </button>
                </div>

                <div style={{ marginTop: '16px', color: '#737373', fontSize: '12px', maxWidth: '600px', textAlign: 'center', flex: '0 0 auto' }}>
                    Note: Some system keys (like Fn) might not be detectable by the browser.
                </div>
            </main>
        </div>
    );
}
