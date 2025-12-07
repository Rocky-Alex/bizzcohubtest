"use client";

import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <main className="landing-page">
                {children}
            </main>
            <Footer />
        </>
    );
}
