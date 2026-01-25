import { Metadata } from 'next';
import CartContent from './components/CartContent';

export const metadata: Metadata = {
    title: 'Shopping Cart | BizzCoHub',
    description: 'Review your selected items and proceed to secure checkout.',
};

export default function CartPage() {
    return <CartContent />;
}
