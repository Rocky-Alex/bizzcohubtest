import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Image Background Remover | AI-Powered Free Tool',
    description: 'Free AI-powered image background remover. Instantly remove backgrounds from photos with high precision. No signup required.',
    keywords: ['background remover', 'remove background', 'AI background removal', 'transparent background', 'photo editor', 'image editing'],
    openGraph: {
        title: 'Image Background Remover | Bizz Co Hub',
        description: 'Remove image backgrounds instantly with our free AI-powered tool. High precision, no signup required.',
        type: 'website',
    },
};

export default function BgRemoverLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
