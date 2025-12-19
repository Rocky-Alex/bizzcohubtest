import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "../Navigation/LayoutWrapper";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
    title: "Bizz Co Hub",
    description: "Bizz Co Hub - Laptop and computer repairing, refurbishing, wholesale and retail, accessories sales & web design services",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                />
                <link
                    rel="preconnect"
                    href="https://fonts.googleapis.com"
                />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
                <Toaster position="top-center" richColors />
            </body>
        </html>
    );
}
