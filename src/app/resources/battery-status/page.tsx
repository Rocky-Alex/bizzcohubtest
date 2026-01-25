import { Metadata } from 'next';
import BatteryStatusContent from './components/BatteryStatusContent';

export const metadata: Metadata = {
    title: 'Battery Health Check | BizzCoHub',
    description: 'Analyze your laptop battery health, cycle count, and charging status instantly using our advanced diagnostic report tool.',
    keywords: ['battery health', 'laptop battery check', 'cycle count', 'battery report', 'powercfg', 'windows battery check'],
    openGraph: {
        title: 'Battery Health Check | BizzCoHub',
        description: 'Instant battery diagnostics for Windows laptops.',
        type: 'website',
    }
};

export default function BatteryPage() {
    return <BatteryStatusContent />;
}
