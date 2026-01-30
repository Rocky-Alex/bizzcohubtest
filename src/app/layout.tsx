import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "../NHF/Navigation/LayoutWrapper";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bizzcohub.com'),
    title: {
        default: "Bizz Co Hub",
        template: "%s | Bizz Co Hub",
    },
    description: "Bizz Co Hub - Premier destination for laptop and computer repairing, refurbishing, wholesale and retail, accessories sales & web design services.",
    keywords: [
        "Laptop Repair",
        "Computer Repair",
        "Refurbished Laptops",
        "Computer Wholesale",
        "Computer Accessories",
        "Web Design Services",
        "Bizz Co Hub",
        "Tech Services",
        "Hardware Repair",
        "Bizz Co Hub",
        "bizzcohub",
        "bizzcohub.com",
        "bizzco",
        "amazon",
        "amazon.in",
        "amazon.com",
        "amazon.ae",
        "amazon.sa",
        "amazon.eg",
        "amazon.",
        "noon",
        "noon.com",
        "noon.ae",
        "noon.sa",
        "noon.eg",
        "noon.",
        "laptop",
        "mobile",
        "computer",
        "pc",
        "repair",
        "refurbish",
        "wholesale",
        "retail",
        "accessories",
        "web design",
        "web design services",
        "web design company",
        "web design agency"
    ],
    authors: [{ name: "Bizz Co Hub" }],
    creator: "Bizz Co Hub",
    publisher: "Bizz Co Hub",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "Bizz Co Hub",
        description: "Your one-stop solution for computer repairs, refurbished laptops, and professional web design services.",
        url: "/",
        siteName: "Bizz Co Hub",
        locale: "en_US",
        type: "website",
        images: [
            {
                url: "/icon/websiteicon.png",
                width: 800,
                height: 600,
                alt: "Bizz Co Hub Logo",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Bizz Co Hub",
        description: "Expert computer repair, premium refurbished laptops, and web design services.",
        images: ["/icon/websiteicon.png"],
        creator: "@bizzcohub",
    },
    icons: {
        icon: "/icon/favicon.png",
        shortcut: "/icon/favicon.png",
        apple: "/icon/websiteicon.png",
        other: {
            rel: "apple-touch-icon-precomposed",
            url: "/icon/websiteicon.png",
        },
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
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

import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/JsonLd';

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
                <link rel="manifest" href="/manifest.json" />
                <OrganizationJsonLd alternateName={['Bizzcohub', 'Bizzhub', 'Bizz Co Hub']} />
                <WebSiteJsonLd />
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

