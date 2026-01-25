import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Connectivity Test | Network & WiFi Check',
    description: 'Free online connectivity testing tool. Check WiFi signal strength, internet status, and network interface information.',
    keywords: ['connectivity test', 'wifi test', 'network test', 'internet speed', 'wifi signal', 'network check'],
    openGraph: {
        title: 'Connectivity Test | Bizz Co Hub',
        description: 'Check your WiFi signal and network connectivity with our free online testing tool.',
        type: 'website',
    },
};

export default function ConnectivityTestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
