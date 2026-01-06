import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Touch Screen Test | Touchscreen Diagnostics',
    description: 'Free online touch screen testing tool. Verify touch sensitivity, detect dead zones, and test multi-touch gestures.',
    keywords: ['touch screen test', 'touchscreen test', 'touch test', 'multi-touch test', 'touch sensitivity', 'touch diagnostics'],
    openGraph: {
        title: 'Touch Screen Test | Bizz Co Hub',
        description: 'Test your touchscreen sensitivity and detect dead zones with our free online tool.',
        type: 'website',
    },
};

export default function TouchTestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
