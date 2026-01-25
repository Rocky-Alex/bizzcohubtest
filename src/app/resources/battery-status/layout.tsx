import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Battery Status Check | Real-Time Battery Monitor',
    description: 'Check your laptop battery status in real-time. View charge level, charging status, and battery health information.',
    keywords: ['battery status', 'battery check', 'battery health', 'laptop battery', 'charge level', 'battery monitor'],
    openGraph: {
        title: 'Battery Status Check | Bizz Co Hub',
        description: 'Monitor your laptop battery status and health with our free online tool.',
        type: 'website',
    },
};

export default function BatteryStatusLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
