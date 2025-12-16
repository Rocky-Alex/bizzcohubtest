"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCart, clearCart, CartItem } from "@/utils/cart";
import "./styles/checkout.css";

export default function CheckoutPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
        country: "United Arab Emirates", // Default
    });

    useEffect(() => {
        setIsClient(true);
        const items = getCart();
        setCartItems(items);

        if (items.length === 0) {
            router.push('/cart');
        }
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const orderData = {
                ...formData,
                items: cartItems,
                subtotal,
                tax,
                shipping,
                total,
                paymentMethod: 'COD' // Currently hardcoded as we only have COD
            };

            const response = await fetch('/api/admin/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                clearCart();
                alert("Order placed successfully! Thank you for shopping with Bizz Co Hub.");
                router.push('/');
            } else {
                const error = await response.json();
                alert(`Failed to place order: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert("An error occurred while processing your order.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% VAT
    const shipping = 15.00;
    const total = subtotal + tax + shipping;

    if (!isClient) return null;

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <Link href="/cart" className="back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Cart
                </Link>

                <div className="checkout-layout">
                    {/* Left Column: Form */}
                    <div className="checkout-left">
                        <form id="checkout-form" onSubmit={handleSubmit}>
                            {/* Contact Info */}
                            <div className="checkout-card">
                                <div className="card-header">
                                    <i className="fas fa-user-circle"></i>
                                    <h2>Contact Information</h2>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            className="form-input"
                                            required
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            className="form-input"
                                            required
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="checkout-card">
                                <div className="card-header">
                                    <i className="fas fa-shipping-fast"></i>
                                    <h2>Shipping Address</h2>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label className="form-label">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            className="form-input"
                                            placeholder="Street address, P.O. box, etc."
                                            required
                                            value={formData.address}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className="form-input"
                                            required
                                            value={formData.city}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">ZIP / Postal Code</label>
                                        <input
                                            type="text"
                                            name="zip"
                                            className="form-input"
                                            required
                                            value={formData.zip}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="form-label">Country</label>
                                        <select
                                            name="country"
                                            className="form-input"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                        >
                                            <option value="United Arab Emirates">United Arab Emirates</option>
                                            <option value="Saudi Arabia">Saudi Arabia</option>
                                            <option value="Oman">Oman</option>
                                            <option value="Bahrain">Bahrain</option>
                                            <option value="Kuwait">Kuwait</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method (Mock) */}
                            <div className="checkout-card">
                                <div className="card-header">
                                    <i className="fas fa-credit-card"></i>
                                    <h2>Payment Method</h2>
                                </div>
                                <div className="form-group full-width">
                                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="radio" name="payment" defaultChecked />
                                            <span style={{ fontWeight: 500 }}>Cash on Delivery (COD)</span>
                                        </label>
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
                                            Pay locally upon delivery.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="checkout-right">
                        <div className="checkout-card" style={{ position: 'sticky', top: '100px' }}>
                            <div className="card-header">
                                <h2>Order Summary</h2>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
                                {cartItems.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="order-summary-item">
                                        <img src={item.image || '/placeholder.png'} alt={item.name} className="summary-img" />
                                        <div className="summary-details">
                                            <span className="summary-name">{item.name}</span>
                                            <span className="summary-qty">Qty: {item.quantity}</span>
                                        </div>
                                        <span className="summary-price">AED {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-row">
                                <span>Subtotal</span>
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

                            <button
                                type="submit"
                                form="checkout-form"
                                className="place-order-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                                ) : (
                                    <>Place Order <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></>
                                )}
                            </button>

                            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <i className="fas fa-lock" style={{ marginRight: '0.25rem' }}></i> Secure Checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
