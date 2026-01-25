import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'System Specifications | View Your Device Info',
    description: 'View real-time system specifications of your device. Check CPU, RAM, storage, graphics, and other hardware information.',
    keywords: ['system specs', 'device specifications', 'hardware info', 'CPU info', 'RAM check', 'system information'],
    openGraph: {
        title: 'System Specifications | Bizz Co Hub',
        description: 'View detailed system specifications and hardware information for your device.',
        type: 'website',
    },
};

export default function SpecificationLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
