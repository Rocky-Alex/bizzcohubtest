import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trackpad Tester | Mouse & Touchpad Check',
    description: 'Free online trackpad and mouse tester. Test clicks, scrolling, and trackpad gestures to verify your pointing device works correctly.',
    keywords: ['trackpad test', 'mouse test', 'touchpad test', 'click test', 'scroll test', 'gesture test'],
    openGraph: {
        title: 'Trackpad Tester | Bizz Co Hub',
        description: 'Test your trackpad clicks, scrolling, and gestures with our free online tool.',
        type: 'website',
    },
};

export default function TrackpadTestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
