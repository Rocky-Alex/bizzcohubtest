"use client";

import Link from "next/link";
import Image from "next/image";
import ProductImage from "@/components/ProductImage";
import imageKitLoader from "@/utils/imageLoader";

interface ProductCardProps {
    product: any;
    type?: string;
    priority?: boolean;
}

export default function ProductCard({ product, type, priority = false }: ProductCardProps) {
    const isDiscounted = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = isDiscounted
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
        <Link
            href={`/products/${type || product.type}/${product.id}`}
            style={{ textDecoration: 'none' }}
        >
            <div className="product-card" style={{
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
                border: '1px solid var(--border)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Product Image */}
                <div className="product-card-image-wrapper" style={{
                    width: '100%',
                    overflow: 'hidden',
                    background: '#ffffff',
                    position: 'relative'
                }}>
                    <ProductImage
                        src={product.image || product.images?.[0]}
                        alt={product.name}
                        fill
                        priority={priority}
                        className="product-image object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 250px"
                    />

                    {isDiscounted && (
                        <div style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                            width: '75px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: '20px',
                            fontWeight: '600',
                            zIndex: 10,
                            whiteSpace: 'nowrap'
                        }} className="product-card-badge">
                            {discountPercent}% OFF
                        </div>
                    )}

                    {product.stock <= 5 && product.stock > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            width: '75px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f59e0b',
                            color: 'white',
                            borderRadius: '20px',
                            fontWeight: '600',
                            zIndex: 10,
                            whiteSpace: 'nowrap'
                        }} className="product-card-badge">
                            Only {product.stock} left
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                    }}>
                        <span className="product-card-brand" style={{
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                        }}>
                            {product.brand}
                        </span>
                        <span className="product-card-code" style={{
                            color: 'var(--text-tertiary)',
                            fontWeight: '500'
                        }}>
                            {product.productCode}
                        </span>
                    </div>

                    <h3 className="product-card-title" style={{
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '12px',
                        lineHeight: '1.4',
                        flex: 1
                    }}>
                        {product.name}
                    </h3>

                    <div style={{ marginTop: 'auto' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '10px',
                            marginBottom: '12px'
                        }}>
                            <span className="product-card-price" style={{
                                fontWeight: '700',
                                color: 'var(--primary)'
                            }}>
                                AED {product.price.toLocaleString()}
                            </span>
                            {isDiscounted && (
                                <span className="product-card-price-original" style={{
                                    color: 'var(--text-tertiary)',
                                    textDecoration: 'line-through'
                                }}>
                                    AED {product.originalPrice.toLocaleString()}
                                </span>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span className="product-card-stock" style={{
                                color: product.stock > 0 ? '#10b981' : '#ef4444',
                                fontWeight: '600'
                            }}>
                                <i className={`fas fa-${product.stock > 0 ? 'check-circle' : 'times-circle'}`} style={{ marginRight: '5px' }}></i>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                            <span className="product-card-view" style={{
                                color: 'var(--primary)',
                                fontWeight: '600',
                            }}>
                                View Details →
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
