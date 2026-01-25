export interface CartItem {
    id: string; // Product Code usually
    name: string;
    price: number;
    image: string;
    quantity: number;
    specs?: string;
    options?: {
        processor?: string;
        ram?: string;
        storage?: string;
        color?: string;
    };
}

const CART_KEY = 'bizzcohub_cart';

export const getCart = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveCart = (cart: CartItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Dispatch event for header updates
    window.dispatchEvent(new Event('cart-updated'));
};

export const addToCart = (item: CartItem) => {
    const cart = getCart();
    const existing = cart.find(i =>
        i.id === item.id &&
        JSON.stringify(i.options) === JSON.stringify(item.options) // Simple deep check for variants
    );

    if (existing) {
        existing.quantity += item.quantity;
    } else {
        cart.push(item);
    }
    saveCart(cart);
};

export const removeFromCart = (itemId: string, options?: any) => {
    let cart = getCart();
    // If options passed, be specific, else remove all matches of ID
    if (options) {
        cart = cart.filter(i => !(i.id === itemId && JSON.stringify(i.options) === JSON.stringify(options)));
    } else {
        cart = cart.filter(i => i.id !== itemId);
    }
    saveCart(cart);
};

export const updateCartItemQuantity = (itemId: string, quantity: number, options?: any) => {
    const cart = getCart();
    const item = cart.find(i =>
        i.id === itemId &&
        (!options || JSON.stringify(i.options) === JSON.stringify(options))
    );
    if (item) {
        item.quantity = Math.max(1, quantity); // Prevent 0
        saveCart(cart);
    }
};

export const clearCart = () => {
    saveCart([]);
};
