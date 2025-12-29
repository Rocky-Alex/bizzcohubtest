/**
 * Performance Monitor Component
 * Tracks and reports Web Vitals and custom performance metrics
 */

'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return;

        // Report Web Vitals
        const reportWebVitals = (metric: any) => {
            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`⚡ ${metric.name}:`, Math.round(metric.value), metric.rating);
            }

            // You can send to analytics service here
            // Example: analytics.track(metric.name, { value: metric.value });
        };

        // Measure Core Web Vitals
        if ('web-vital' in window || typeof window.PerformanceObserver !== 'undefined') {
            // Largest Contentful Paint (LCP)
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    reportWebVitals({
                        name: 'LCP',
                        value: lastEntry.startTime,
                        rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
                    });
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // LCP not supported
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        reportWebVitals({
                            name: 'FID',
                            value: entry.processingStart - entry.startTime,
                            rating: entry.processingStart - entry.startTime < 100 ? 'good' : entry.processingStart - entry.startTime < 300 ? 'needs-improvement' : 'poor',
                        });
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                // FID not supported
            }

            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries() as any[]) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    reportWebVitals({
                        name: 'CLS',
                        value: clsValue,
                        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
                    });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // CLS not supported
            }
        }

        // Measure page load time
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (perfData) {
                const pageLoadTime = perfData.loadEventEnd - perfData.fetchStart;
                reportWebVitals({
                    name: 'Page Load Time',
                    value: pageLoadTime,
                    rating: pageLoadTime < 1000 ? 'good' : pageLoadTime < 3000 ? 'needs-improvement' : 'poor',
                });
            }
        });

        // Measure Time to First Byte (TTFB)
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
            const ttfb = perfData.responseStart - perfData.requestStart;
            reportWebVitals({
                name: 'TTFB',
                value: ttfb,
                rating: ttfb < 200 ? 'good' : ttfb < 500 ? 'needs-improvement' : 'poor',
            });
        }
    }, []);

    return null; // This component doesn't render anything
}
