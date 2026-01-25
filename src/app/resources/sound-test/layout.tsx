import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Audio Diagnostics | Speaker & Microphone Test',
    description: 'Free online audio testing tool. Test speaker stereo separation and microphone input levels to verify your audio devices work correctly.',
    keywords: ['sound test', 'speaker test', 'audio test', 'microphone test', 'stereo test', 'audio diagnostics'],
    openGraph: {
        title: 'Audio Diagnostics | Bizz Co Hub',
        description: 'Test your speakers and microphone with our free online audio diagnostics tool.',
        type: 'website',
    },
};

export default function SoundTestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
