import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Keyboard Tester | Test Every Key Online',
    description: 'Free online keyboard tester. Test every key on your keyboard to ensure they register correctly. Works with any keyboard layout.',
    keywords: ['keyboard tester', 'keyboard test', 'key test', 'keyboard check', 'test keyboard online', 'key registration test'],
    openGraph: {
        title: 'Keyboard Tester | Bizz Co Hub',
        description: 'Test every key on your keyboard with our free online keyboard testing tool.',
        type: 'website',
    },
};

export default function KeyboardTestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
