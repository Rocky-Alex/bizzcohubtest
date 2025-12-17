"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCart, updateCartItemQuantity, removeFromCart, CartItem } from "@/utils/cart";
import "./styles/cart.css";

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setCartItems(getCart());

        const handleStorageChange = () => setCartItems(getCart());
        window.addEventListener('cart-updated', handleStorageChange);
        return () => window.removeEventListener('cart-updated', handleStorageChange);
    }, []);

    const updateQuantity = (id: string, currentQty: number, change: number, options: any) => {
        const newQty = currentQty + change;
        if (newQty < 1) return;
        updateCartItemQuantity(id, newQty, options);
    };

    const removeItem = (id: string, options: any) => {
        removeFromCart(id, options);
    };

    // Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% VAT
    const shipping = 15.00;
    const total = subtotal + tax + shipping;

    if (!isClient) return null; // Prevent hydration mismatch

    return (
        <div className="cart-page">
            <div className="cart-container">
                <Link href="/products" className="back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Continue Shopping
                </Link>

                <div className="cart-layout">
                    {/* Left Column */}
                    <div className="cart-left">
                        {/* Shopping Cart Card */}
                        <div className="cart-card">
                            <div className="card-header">
                                <i className="fas fa-shopping-bag"></i>
                                <h2>Shopping Cart ({cartItems.reduce((a, b) => a + b.quantity, 0)} items)</h2>
                            </div>

                            <div className="cart-items">
                                {cartItems.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="cart-item">
                                        <div className="item-image">
                                            <img src={item.image || '/placeholder.svg'} alt={item.name} />
                                        </div>

                                        <div className="item-details-col">
                                            <div className="item-details">
                                                <h3>{item.name}</h3>
                                                {/* <p className="item-artist">by BizzCoHub</p> */}
                                                <div className="item-specs">
                                                    {item.options && Object.entries(item.options).map(([key, val]) => (
                                                        <span key={key} style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>
                                                            {key.charAt(0).toUpperCase() + key.slice(1)}: {val}
                                                        </span>
                                                    ))}
                                                    {item.specs && <span style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>{item.specs}</span>}
                                                </div>
                                            </div>

                                            <div className="item-actions">
                                                <div className="quantity-control">
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.id, item.quantity, -1, item.options)}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                            <path d="M5 12h14" />
                                                        </svg>
                                                    </button>
                                                    <span className="qty-value">{item.quantity}</span>
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.id, item.quantity, 1, item.options)}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                            <path d="M12 5v14M5 12h14" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="item-price-col">
                                            <div className="price-info">
                                                <div className="item-price">AED {item.price.toLocaleString()}</div>
                                                {item.quantity > 1 && (
                                                    <div className="item-total-price">
                                                        AED {(item.price * item.quantity).toLocaleString()} total
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                className="remove-btn"
                                                onClick={() => removeItem(item.id, item.options)}
                                            >
                                                <i className="fas fa-trash-alt"></i> Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {cartItems.length === 0 && (
                                    <div className="empty-cart-message">
                                        <i className="fas fa-shopping-cart" style={{ fontSize: '4rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}></i>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Your cart is empty</p>
                                        <p style={{ marginBottom: '2rem' }}>Looks like you haven't added anything to your cart yet.</p>
                                        <Link href="/products" className="btn-gradient-animated" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, transition: 'all 0.3s' }}>
                                            <i className="fas fa-shopping-bag"></i>
                                            Start Shopping
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Special Instructions Card */}
                        <div className="cart-card">
                            <div className="card-header">
                                <i className="far fa-comment-alt"></i>
                                <h2>Special Instructions</h2>
                            </div>

                            <label className="instructions-label">Add a note to your order (optional)</label>
                            <textarea
                                className="instructions-input"
                                placeholder="Any special requests, gift messages, or packaging instructions..."
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                            ></textarea>
                            <span className="instructions-hint">
                                Examples: "Please gift wrap this item", "This is a gift for my mother", "Handle with extra care"
                            </span>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="cart-right">
                        {/* Order Summary Card */}
                        <div className="cart-card">
                            <div className="card-header">
                                <h2>Order Summary</h2>
                            </div>

                            <div className="summary-row">
                                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                                <span>AED {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="summary-row">
                                <span>Tax (5%)</span>
                                <span>AED {tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>AED {shipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="summary-row total">
                                <span>Total</span>
                                <span>AED {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <Link href="/checkout" className="checkout-btn" style={{ textDecoration: 'none' }}>
                                <i className="fas fa-lock"></i> Proceed to Checkout
                            </Link>

                            {/* Trust Badges */}
                            <div className="trust-badges">
                                <div className="trust-badge">
                                    <i className="fas fa-shield-alt"></i>
                                    <span className="trust-badge-text">Secure Payment</span>
                                </div>
                                <div className="trust-badge">
                                    <i className="fas fa-truck"></i>
                                    <span className="trust-badge-text">Fast Shipping</span>
                                </div>
                                <div className="trust-badge">
                                    <i className="fas fa-undo"></i>
                                    <span className="trust-badge-text">Easy Returns</span>
                                </div>
                                <div className="trust-badge">
                                    <i className="fas fa-headset"></i>
                                    <span className="trust-badge-text">24/7 Support</span>
                                </div>
                            </div>
                        </div>

                        {/* Quote Card */}
                        <div className="quote-card">
                            <p className="quote-text">
                                "Quality is not an act, it is a habit. We ensure every refurbished device meets the highest standards of excellence."
                            </p>
                            <p className="quote-author">— Bizz Co Hub Quality Team</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
