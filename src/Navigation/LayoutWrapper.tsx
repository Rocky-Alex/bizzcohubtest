"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "../Footer/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminLogin = pathname === '/admin/login';

    return (
        <>
            {!isAdminLogin && <Header />}
            <main className={isAdminLogin ? 'admin-login-page' : 'landing-page'}>
                {children}
            </main>
            <Footer />
        </>
    );
}
