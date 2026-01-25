import { Metadata } from 'next';
import CheckoutContent from './components/CheckoutContent';

export const metadata: Metadata = {
    title: 'Checkout | BizzCoHub',
    description: 'Securely complete your purchase at BizzCoHub. Fast shipping and secure payment options available.',
};

export default function CheckoutPage() {
    return <CheckoutContent />;
}
