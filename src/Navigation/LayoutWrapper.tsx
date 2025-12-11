"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "../Footer/Footer";
import AutoRefresh from "../components/AutoRefresh/AutoRefresh";
import AutoRefreshCountdown from "../components/AutoRefresh/AutoRefreshCountdown";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            <AutoRefresh />
            <AutoRefreshCountdown />
            {!isAdmin && <Header />}
            <main className={isAdmin ? '' : 'landing-page'}>
                {children}
            </main>
            {!isAdmin && <Footer />}
        </>
    );
}
