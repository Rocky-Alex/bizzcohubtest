import LandingPage from './landing-page/page';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Premium Refurbished Electronics & IT Solutions',
    description: 'Bizz Co Hub is your trusted partner for high-quality refurbished laptops, desktops, and enterprise IT services. Global bulk supply and advanced repair center.',
    keywords: ['refurbished macbooks', 'gaming laptops', 'IT solutions Dubai', 'business laptops', 'refurbished phones'],
};

export default function Home() {
    return <LandingPage />;
}