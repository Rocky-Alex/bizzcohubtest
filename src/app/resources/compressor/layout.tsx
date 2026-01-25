import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Image Compressor | Reduce Image Size Online',
    description: 'Free online image compressor. Reduce image file sizes without compromising quality. Optimized for web performance.',
    keywords: ['image compressor', 'compress image', 'reduce image size', 'image optimizer', 'compress photos', 'web optimization'],
    openGraph: {
        title: 'Image Compressor | Bizz Co Hub',
        description: 'Compress images without losing quality with our free online image compressor tool.',
        type: 'website',
    },
};

export default function CompressorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
