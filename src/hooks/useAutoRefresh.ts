import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle auto-refresh logic based on local storage settings.
 * @param callback The function to execute when the refresh interval triggers.
 */
export const useAutoRefresh = (callback: () => void) => {
    const savedCallback = useRef(callback);

    // Keep the callback ref up to date
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const tick = () => {
            console.log('Auto-refresh triggered');
            if (savedCallback.current) {
                savedCallback.current();
                localStorage.setItem('lastAutoRefresh', Date.now().toString());
            }
        };

        const setupAutoRefresh = () => {
            // Default to enabled if not set (null) or explicitly 'true'. Only disable if 'false'.
            const enabled = localStorage.getItem('autoRefreshEnabled') !== 'false';

            if (!enabled) {
                if (intervalId) clearInterval(intervalId);
                console.log('Auto-refresh disabled');
                return;
            }

            const h = parseInt(localStorage.getItem('autoRefreshHours') || '0');
            const m = parseInt(localStorage.getItem('autoRefreshMinutes') || '0');
            const s = parseInt(localStorage.getItem('autoRefreshSeconds') || '0');

            // Default to 5 seconds (5000ms) if settings are not present/zero for real-time monitoring
            let totalMs = (h * 3600 + m * 60 + s) * 1000;
            if (totalMs === 0) totalMs = 5000;

            console.log(`Auto-refresh setup: ${totalMs}ms`);

            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(tick, totalMs);
        };

        // Initial setup
        setupAutoRefresh();

        const handleSettingsChange = () => {
            console.log('Auto-refresh settings changed, resetting...');
            setupAutoRefresh();
        };

        window.addEventListener('autoRefreshSettingsChanged', handleSettingsChange);

        const handleInventoryUpdate = () => {
            console.log('Inventory updated event received, refreshing...');
            if (savedCallback.current) savedCallback.current();
        };
        window.addEventListener('inventory-updated', handleInventoryUpdate);

        const handleDashboardUpdate = () => {
            console.log('Dashboard updated event received, refreshing...');
            if (savedCallback.current) savedCallback.current();
        };
        window.addEventListener('dashboard-updated', handleDashboardUpdate);

        // Listen for storage events (Cross-tab)
        const handleStorageChange = (e: StorageEvent) => {
            if ((e.key === 'inventoryLastUpdated' || e.key === 'dashboardLastUpdated') && savedCallback.current) {
                console.log('Cross-tab data update received');
                savedCallback.current();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('autoRefreshSettingsChanged', handleSettingsChange);
            window.removeEventListener('inventory-updated', handleInventoryUpdate);
            window.removeEventListener('dashboard-updated', handleDashboardUpdate);
            window.removeEventListener('storage', handleStorageChange);
            if (intervalId) clearInterval(intervalId);
        };
    }, []); // Effect runs once on mount, immune to callback or setting re-renders
};
