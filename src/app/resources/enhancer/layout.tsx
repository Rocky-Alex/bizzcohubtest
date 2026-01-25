import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Image Enhancer | Upscale & Improve Quality',
    description: 'Free online image enhancer. Upscale and clarify low-resolution images using advanced restoration algorithms.',
    keywords: ['image enhancer', 'upscale image', 'image quality', 'photo enhancer', 'image restoration', 'improve image quality'],
    openGraph: {
        title: 'Image Enhancer | Bizz Co Hub',
        description: 'Upscale and enhance low-resolution images with our free online image enhancer tool.',
        type: 'website',
    },
};

export default function EnhancerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
