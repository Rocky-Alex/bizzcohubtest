import { Metadata } from 'next';
import ResourcesContent from './components/ResourcesContent';

export const metadata: Metadata = {
    title: 'Developer & Tech Resources | BizzCoHub',
    description: 'Essential tools for developers, designers, and technicians. Access our suite of diagnostics including LCD Check, Battery Status, Keyboard Test, and more.',
    keywords: ['developer tools', 'tech resources', 'lcd check', 'battery status', 'keyboard test', 'image tools', 'bizzcohub resources'],
    openGraph: {
        title: 'Developer & Tech Resources | BizzCoHub',
        description: 'Comprehensive diagnostic tools and utilities for hardware testing and image processing.',
        type: 'website',
    }
};

export default function ResourcesPage() {
    return <ResourcesContent />;
}
