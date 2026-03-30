"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Receipt, Printer, Download, RefreshCcw, Power, Clock, Info, CheckCircle, PauseCircle, AlertTriangle, X } from "lucide-react";
import "../shared/AutoRefreshSettings.css";

export default function AutoRefreshPage() {
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(false);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(5);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from backend on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch('/api/settings/auto-refresh');
                if (response.ok) {
                    const data = await response.json();
                    const { enabled, hours, minutes, seconds } = data.settings;

                    setIsEnabled(enabled);
                    setHours(hours);
                    setMinutes(minutes);
                    setSeconds(seconds);

                    // Also sync to localStorage for client-side use
                    localStorage.setItem('autoRefreshEnabled', enabled.toString());
                    localStorage.setItem('autoRefreshHours', hours.toString());
                    localStorage.setItem('autoRefreshMinutes', minutes.toString());
                    localStorage.setItem('autoRefreshSeconds', seconds.toString());
                }
            } catch (error) {
                console.error('Error loading auto-refresh settings:', error);
                // Fallback to localStorage if API fails
                const savedEnabled = localStorage.getItem('autoRefreshEnabled') === 'true';
                const savedHours = parseInt(localStorage.getItem('autoRefreshHours') || '0');
                const savedMinutes = parseInt(localStorage.getItem('autoRefreshMinutes') || '0');
                const savedSeconds = parseInt(localStorage.getItem('autoRefreshSeconds') || '5');

                setIsEnabled(savedEnabled);
                setHours(savedHours);
                setMinutes(savedMinutes);
                setSeconds(savedSeconds);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Save settings to backend and localStorage
    const saveSettings = async () => {
        // Save to localStorage immediately for client-side use
        localStorage.setItem('autoRefreshEnabled', isEnabled.toString());
        localStorage.setItem('autoRefreshHours', hours.toString());
        localStorage.setItem('autoRefreshMinutes', minutes.toString());
        localStorage.setItem('autoRefreshSeconds', seconds.toString());

        // Save to backend
        try {
            await fetch('/api/settings/auto-refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enabled: isEnabled,
                    hours,
                    minutes,
                    seconds
                }),
            });
        } catch (error) {
            console.error('Error saving auto-refresh settings to backend:', error);
        }

        // Trigger a custom event to notify AutoRefresh component
        window.dispatchEvent(new CustomEvent('autoRefreshSettingsChanged'));
    };

    useEffect(() => {
        if (!isLoading) {
            saveSettings();
        }
    }, [isEnabled, hours, minutes, seconds]);

    // Calculate total milliseconds
    const getTotalMs = () => {
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    };

    // Update countdown timer
    useEffect(() => {
        if (!isEnabled) {
            setTimeRemaining(null);
            return;
        }

        const totalMs = getTotalMs();
        if (totalMs <= 0) {
            setTimeRemaining(null);
            return;
        }

        // Get the last refresh time from localStorage
        const lastRefresh = parseInt(localStorage.getItem('lastAutoRefresh') || '0');
        const now = Date.now();
        const elapsed = now - lastRefresh;
        const remaining = Math.max(0, totalMs - elapsed);

        setTimeRemaining(remaining);

        const interval = setInterval(() => {
            const lastRefresh = parseInt(localStorage.getItem('lastAutoRefresh') || '0');
            const now = Date.now();
            const elapsed = now - lastRefresh;
            const remaining = Math.max(0, totalMs - elapsed);
            setTimeRemaining(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [isEnabled, hours, minutes, seconds]);

    const formatTimeRemaining = () => {
        if (timeRemaining === null || timeRemaining === 0) return '--:--:--';

        const totalSeconds = Math.floor(timeRemaining / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleToggle = () => {
        const newEnabled = !isEnabled;
        setIsEnabled(newEnabled);

        if (newEnabled) {
            // Reset the timer when enabling
            localStorage.setItem('lastAutoRefresh', Date.now().toString());
        }
    };

    const handleNumberInput = (value: string, setter: (val: number) => void, max: number) => {
        const num = parseInt(value) || 0;
        setter(Math.min(Math.max(0, num), max));
    };

    if (isLoading) return null;

    return (
        <div className="auto-refresh-page-container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: '#f8fafc' }}>
            <div className="auto-refresh-modal" style={{ position: 'relative', top: 'auto', left: 'auto', right: 'auto', bottom: 'auto', transform: 'none', margin: '0 auto', animation: 'none' }}>
                <div className="auto-refresh-header">
                    <h2>
                        <RefreshCcw size={20} />
                        Auto Refresh Settings
                    </h2>
                </div>

                <div className="auto-refresh-content">
                    {/* Enable/Disable Toggle */}
                    <div className="setting-row toggle-row">
                        <div className="setting-label">
                            <Power size={18} />
                            <span>Auto Refresh</span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={handleToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    {/* Status Indicator */}
                    <div className={`status-indicator ${isEnabled ? 'active' : 'inactive'}`}>
                        {isEnabled ? <CheckCircle size={18} /> : <PauseCircle size={18} />}
                        <span>{isEnabled ? 'Active' : 'Inactive'}</span>
                    </div>

                    {/* Time Settings */}
                    <div className="time-settings">
                        <h3>Refresh Interval</h3>
                        <div className="time-inputs-container">
                            <div className="time-input-wrapper">
                                <label className="input-label">HOURS</label>
                                <div className="input-box">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={hours}
                                        onChange={(e) => handleNumberInput(e.target.value, setHours, 23)}
                                        disabled={!isEnabled}
                                    />
                                </div>
                                <span className="unit-label">h</span>
                            </div>

                            <div className="time-separator">:</div>

                            <div className="time-input-wrapper">
                                <label className="input-label">MINUTES</label>
                                <div className="input-box">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={minutes}
                                        onChange={(e) => handleNumberInput(e.target.value, setMinutes, 59)}
                                        disabled={!isEnabled}
                                    />
                                </div>
                                <span className="unit-label">m</span>
                            </div>

                            <div className="time-separator">:</div>

                            <div className="time-input-wrapper">
                                <label className="input-label">SECONDS</label>
                                <div className="input-box">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={seconds}
                                        onChange={(e) => handleNumberInput(e.target.value, setSeconds, 59)}
                                        disabled={!isEnabled}
                                    />
                                </div>
                                <span className="unit-label">s</span>
                            </div>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    {isEnabled && getTotalMs() > 0 && (
                        <div className="countdown-display">
                            <div className="countdown-label">Next refresh in:</div>
                            <div className="countdown-timer">{formatTimeRemaining()}</div>
                        </div>
                    )}

                    {/* Warning for invalid time */}
                    {isEnabled && getTotalMs() <= 0 && (
                        <div className="warning-message">
                            <AlertTriangle size={18} />
                            <span>Please set a valid time interval (greater than 0)</span>
                        </div>
                    )}

                    {/* Info */}
                    <div className="info-box">
                        <Info size={18} />
                        <p>The page will automatically refresh when the countdown reaches 00:00, then the timer will reset and loop continuously.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
