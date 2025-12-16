"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "../Footer/Footer";
import AutoRefresh from "../components/AutoRefresh/AutoRefresh";
import AutoRefreshCountdown from "../components/AutoRefresh/AutoRefreshCountdown";
import { ToastProvider } from "../context/ToastContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <ToastProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AutoRefresh />
                <AutoRefreshCountdown />
                {!isAdmin && <Header />}
                <main className={isAdmin ? '' : 'landing-page'} style={{ flex: 1 }}>
                    {children}
                </main>
                {!isAdmin && <Footer />}
            </div>
        </ToastProvider>
    );
}
