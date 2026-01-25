import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Webcam Test | Camera Diagnostics Online',
    description: 'Free online webcam testing tool. Verify camera functionality, check resolution, and capture test snapshots.',
    keywords: ['webcam test', 'camera test', 'video test', 'webcam check', 'camera diagnostics', 'test webcam online'],
    openGraph: {
        title: 'Webcam Test | Bizz Co Hub',
        description: 'Test your webcam functionality and resolution with our free online camera diagnostics tool.',
        type: 'website',
    },
};

export default function CameraTestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
