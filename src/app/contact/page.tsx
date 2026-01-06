import { Metadata } from 'next';
import ContactClient from './ContactClient';
import { LocalBusinessJsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
    title: 'Contact Us',
    description: 'Get in touch with Bizz Co Hub for product inquiries, bulk wholesale orders, or technical support. Visit our Dubai HQ or contact us online.',
    keywords: ['Contact Bizz Co Hub', 'Tech Support Dubai', 'Wholesale Electronics Inquiry', 'Bizz Co Hub Address'],
    openGraph: {
        title: 'Contact Us | Bizz Co Hub',
        description: 'Get in touch with Bizz Co Hub for product inquiries, bulk wholesale orders, or technical support.',
        type: 'website',
    },
};

export default function ContactPage() {
    return (
        <>
            <LocalBusinessJsonLd />
            <ContactClient />
        </>
    );
}

