import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "../Navigation/LayoutWrapper";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
    title: "Bizz Co Hub",
    description: "Bizz Co Hub - Laptop and computer repairing, refurbishing, wholesale and retail, accessories sales & web design services",
};

import { Inter, Space_Grotesk, Bebas_Neue } from 'next/font/google';

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-inter',
    display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-space',
    display: 'swap',
});

const bebasNeue = Bebas_Neue({
    subsets: ['latin'],
    weight: ['400'],
    variable: '--font-bebas',
    display: 'swap',
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${bebasNeue.variable}`}>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
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
