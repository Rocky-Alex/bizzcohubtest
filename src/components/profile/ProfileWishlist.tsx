
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import './profile-wishlist.css';

interface WishlistItem {
    wishlist_id: number;
    created_at: string;
    id: string; // Product id
    name: string;
    images: string[];
    price: number;
    original_price?: number; // DB usually returns snake_case for raw queries
    originalPrice?: number;  // Just in case mapped
    type: string;
}

export default function ProfileWishlist({ user }: { user: any }) {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchWishlist();
        }
    }, [user]);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/customer/wishlist?customer_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setWishlist(data.wishlist || []);
            }
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (wishlistId: number) => {
        try {
            const res = await fetch(`/api/customer/wishlist?id=${wishlistId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Item removed from wishlist");
                setWishlist(prev => prev.filter(item => item.wishlist_id !== wishlistId));
            } else {
                toast.error("Failed to remove item");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error removing item");
        }
    };

    const calculateDiscount = (current: number, original: number) => {
        if (!original || original <= current) return null;
        const diff = original - current;
        const percent = Math.round((diff / original) * 100);
        return `${percent}% off`;
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading wishlist...</div>;
    }

    if (wishlist.length === 0) {
        return (
            <div className="empty-wishlist">
                <i className="far fa-heart" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#cbd5e1' }}></i>
                <h3>Empty Wishlist</h3>
                <p>You have no items in your wishlist. Start adding!</p>
                <Link href="/products" className="btn-browse">
                    Shop Now
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h2 className="orders-title" style={{ fontSize: '18px', fontWeight: 600, paddingBottom: '16px' }}>My Wishlist ({wishlist.length})</h2>
            <div className="wishlist-container">
                {wishlist.map(item => {
                    // Handle potential inconsistent naming or JSON data
                    const images = Array.isArray(item.images)
                        ? item.images
                        : JSON.parse((item.images as any) || '[]');

                    const imgUrl = images[0] || '/placeholder.svg';

                    // Handle db keys
                    const originalPrice = item.original_price || item.originalPrice || 0;
                    const displayPrice = Number(item.price);
                    const discount = calculateDiscount(displayPrice, originalPrice);

                    return (
                        <div key={item.wishlist_id} className="wishlist-item">
                            <div className="wishlist-image-container">
                                <img src={imgUrl} alt={item.name} className="wishlist-image" />
                            </div>

                            <div className="wishlist-details">
                                <Link href={`/products/${item.type || 'laptops'}/${item.id}`} className="wishlist-name">
                                    {item.name}
                                </Link>

                                {/* Optional: Add Rating placeholder if data exists, currently ignoring as not in basic data */}

                                <div className="wishlist-price-row">
                                    <span className="current-price">AED {displayPrice.toLocaleString()}</span>
                                    {originalPrice > displayPrice && (
                                        <>
                                            <span className="original-price">AED {Number(originalPrice).toLocaleString()}</span>
                                            <span className="discount-off">{discount}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                className="wishlist-delete-btn"
                                onClick={() => handleRemove(item.wishlist_id)}
                                title="Delete"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
