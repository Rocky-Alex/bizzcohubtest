/**
 * Performance Optimization Utilities
 * Helpers for lazy loading, code splitting, and performance monitoring
 */

import { ComponentType, lazy } from 'react';

/**
 * Lazy load a component with a minimum delay to prevent flash of loading state
 * @param importFunc - Dynamic import function
 * @param minDelay - Minimum delay in ms (default: 200ms)
 */
export function lazyWithPreload<T extends ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    minDelay: number = 200
) {
    const Component = lazy(() =>
        Promise.all([
            importFunc(),
            new Promise(resolve => setTimeout(resolve, minDelay))
        ]).then(([moduleExports]) => moduleExports)
    );

    return Component;
}

/**
 * Preload a lazy component
 * Useful for preloading components on hover or route prefetch
 */
export function preloadComponent(importFunc: () => Promise<any>) {
    importFunc();
}

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in ms
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in ms
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Check if an element is in viewport
 * Useful for lazy loading images and components
 */
export function isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Performance mark helper
 * Use for measuring performance of critical operations
 */
export const performanceMark = {
    start: (name: string) => {
        if (typeof window !== 'undefined' && window.performance) {
            performance.mark(`${name}-start`);
        }
    },
    end: (name: string) => {
        if (typeof window !== 'undefined' && window.performance) {
            performance.mark(`${name}-end`);
            try {
                performance.measure(name, `${name}-start`, `${name}-end`);
                const measure = performance.getEntriesByName(name)[0];
                console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
            } catch (e) {
                // Ignore errors
            }
        }
    },
};
