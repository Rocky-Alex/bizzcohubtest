"use client";

import { useState, useEffect } from "react";
import "./AutoRefreshCountdown.css";

export default function AutoRefreshCountdown() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        const updateCountdown = () => {
            const enabled = localStorage.getItem('autoRefreshEnabled') === 'true';
            const hours = parseInt(localStorage.getItem('autoRefreshHours') || '0');
            const minutes = parseInt(localStorage.getItem('autoRefreshMinutes') || '1');
            const seconds = parseInt(localStorage.getItem('autoRefreshSeconds') || '0');

            setIsEnabled(enabled);

            if (!enabled) {
                setTimeRemaining(null);
                return;
            }

            const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
            if (totalMs <= 0) {
                setTimeRemaining(null);
                return;
            }

            const lastRefresh = parseInt(localStorage.getItem('lastAutoRefresh') || '0');
            const now = Date.now();
            const elapsed = now - lastRefresh;
            const remaining = Math.max(0, totalMs - elapsed);

            setTimeRemaining(remaining);
        };

        // Initial update
        updateCountdown();

        // Update every second
        const interval = setInterval(updateCountdown, 1000);

        // Listen for settings changes
        const handleSettingsChange = () => {
            updateCountdown();
        };

        window.addEventListener('autoRefreshSettingsChanged', handleSettingsChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('autoRefreshSettingsChanged', handleSettingsChange);
        };
    }, []);

    const formatTimeRemaining = () => {
        if (timeRemaining === null || timeRemaining === 0) return '--:--';

        const totalSeconds = Math.floor(timeRemaining / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;

        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Don't render if auto-refresh is not enabled or time is invalid
    if (!isEnabled || timeRemaining === null) {
        return null;
    }

    return (
        <div className="auto-refresh-countdown-overlay">
            <div className="countdown-content">
                <i className="fas fa-sync-alt countdown-icon"></i>
                <span className="countdown-text">{formatTimeRemaining()}</span>
            </div>
        </div>
    );
}
