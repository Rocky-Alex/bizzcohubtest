"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import CursorFollower from "./CursorFollower";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    return (
        <>
            {!isAdmin && <CursorFollower />}
            {!isAdmin && <Header />}
            <main className={!isAdmin ? "landing-page" : ""}>
                {children}
            </main>
            {!isAdmin && <Footer />}
        </>
    );
}
