import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Developer & Tech Resources | Free Online Tools',
    description: 'Free online tools for developers, designers, and technicians. Test your laptop keyboard, LCD screen, battery, webcam, and more. Image compression and background removal tools.',
    keywords: [
        'keyboard tester',
        'LCD screen test',
        'battery status check',
        'webcam test',
        'laptop diagnostics',
        'image compressor',
        'background remover',
        'free online tools',
        'laptop quality check',
        'Bizz Co Hub tools',
    ],
    openGraph: {
        title: 'Developer & Tech Resources | Bizz Co Hub',
        description: 'Essential tools for developers, designers, and technicians. Manage your workflow with our premium suite of utilities.',
        type: 'website',
    },
};

export default function ResourcesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
