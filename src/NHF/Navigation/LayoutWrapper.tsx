"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import AutoRefresh from "../../components/AutoRefresh/AutoRefresh";
import AutoRefreshCountdown from "../../components/AutoRefresh/AutoRefreshCountdown";
import { ToastProvider } from "../../context/ToastContext";
import { ThemeProvider } from "../../context/ThemeContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/bch');

    // Strict Security: Logout Admin if they leave the admin section
    // Requirement: "If one exits the Admin section... then Re-login should be mandatory"
    // We achieve this by clearing the admin session whenever the user visits a non-admin page.
    // Force hard refresh on navigation change to ensure clean state and cover loading issues
    // Path tracking for potential future use (removed aggressive reload)
    useEffect(() => {
        sessionStorage.setItem('last_nav_path', pathname || '');
    }, [pathname]);

    // Strict Security: Logout Admin if they leave the admin section
    // Requirement: "If one exits the Admin section... then Re-login should be mandatory"
    // We achieve this by clearing the admin session whenever the user visits a non-admin page.
    useEffect(() => {
        if (!isAdmin) {
            const storedAdmin = localStorage.getItem('admin_user');
            if (storedAdmin) {
                localStorage.removeItem('admin_user');
            }
        }
    }, [isAdmin]);

    const hideHeaderFooter = isAdmin;

    return (
        <ToastProvider>
            <ThemeProvider>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <AutoRefresh />
                    <AutoRefreshCountdown />
                    {!hideHeaderFooter && <Header />}
                    <main className={hideHeaderFooter ? '' : 'landing-page'} style={{ flex: 1 }}>
                        {children}
                    </main>
                    {!hideHeaderFooter && <Footer />}
                </div>
            </ThemeProvider>
        </ToastProvider>
    );
}
