import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'LCD Screen Test | Dead Pixel & Display Check',
    description: 'Free online LCD screen test tool. Check for dead pixels, screen bleeding, and color accuracy on your laptop or monitor display.',
    keywords: ['LCD test', 'dead pixel test', 'screen test', 'display check', 'monitor test', 'pixel check'],
    openGraph: {
        title: 'LCD Screen Test | Bizz Co Hub',
        description: 'Check for dead pixels and display issues with our free LCD screen testing tool.',
        type: 'website',
    },
};

export default function LcdCheckLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
