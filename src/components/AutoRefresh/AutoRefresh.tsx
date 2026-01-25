"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh() {
    const router = useRouter();

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        let timeout: NodeJS.Timeout | null = null;

        const setupAutoRefresh = () => {
            // Clear existing timers
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            // Get settings from localStorage
            const isEnabled = localStorage.getItem('autoRefreshEnabled') === 'true';
            const hours = parseInt(localStorage.getItem('autoRefreshHours') || '0');
            const minutes = parseInt(localStorage.getItem('autoRefreshMinutes') || '1');
            const seconds = parseInt(localStorage.getItem('autoRefreshSeconds') || '0');

            // Calculate total milliseconds
            const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

            // Only set up timer if enabled and time is valid
            if (isEnabled && totalMs > 0) {
                const lastRefresh = parseInt(localStorage.getItem('lastAutoRefresh') || '0');
                const now = Date.now();

                // If there's no last refresh time or settings just changed, set it now
                if (lastRefresh === 0) {
                    localStorage.setItem('lastAutoRefresh', now.toString());
                }

                const elapsed = now - (lastRefresh || now);
                const remaining = Math.max(0, totalMs - elapsed);

                // If time has already elapsed, refresh immediately
                if (remaining === 0) {
                    localStorage.setItem('lastAutoRefresh', Date.now().toString());
                    window.location.reload();
                } else {
                    // Set timeout for the remaining time
                    timeout = setTimeout(() => {
                        localStorage.setItem('lastAutoRefresh', Date.now().toString());
                        window.location.reload();
                    }, remaining);
                }
            }
        };

        // Initial setup
        setupAutoRefresh();

        // Listen for settings changes
        const handleSettingsChange = () => {
            // Reset the timer when settings change
            localStorage.setItem('lastAutoRefresh', Date.now().toString());
            setupAutoRefresh();
        };

        window.addEventListener('autoRefreshSettingsChanged', handleSettingsChange);

        // Cleanup
        return () => {
            if (interval) {
                clearInterval(interval);
            }
            if (timeout) {
                clearTimeout(timeout);
            }
            window.removeEventListener('autoRefreshSettingsChanged', handleSettingsChange);
        };
    }, [router]);

    return null;
}
