"use client";

import { SiteConfig } from "@/config/site";

interface Product {
    name: string;
    code: string;
    price: number;
    offer_price: number;
    stock: number;
    image?: string;
    images?: string[];
    badge?: string;
    discount: number;
    // Laptop specific
    processor?: string;
    ram?: string;
    storage?: string;
    screen?: string;
    feature?: string;
    // Accessory specific
    about?: string;
    features?: string;
}

interface ProductCardProps {
    product: Product;
    type: "laptop" | "accessory";
}

export default function ProductCard({ product, type }: ProductCardProps) {
    const savings = product.price - product.offer_price;
    const inStock = product.stock > 0;
    const stockText = inStock ? `${product.stock} in stock` : "Out of Stock";

    const inquireWhatsApp = () => {
        let whatsappNumber = SiteConfig.contact.phone.replace(/\D/g, "");
        if (!whatsappNumber) whatsappNumber = "971567064457";

        const formattedPrice = `- Offer Price: AED ${(product.offer_price || 0).toLocaleString(
            "en-IN"
        )}`;

        const lines = [
            `Hi ${SiteConfig.siteName}!`,
            ``,
            `I'm interested in the following ${type === "laptop" ? "Laptop" : "Accessory"
            }:`,
            ``,
            `- Product Name: ${product.name}`,
            `- Product Code: ${product.code}`,
            formattedPrice,
            ``,
            `Could you please provide me with:`,
            `- Current availability`,
            `- Shipping information`,
            `- Payment options`,
            `- Any ongoing offers`,
            ``,
            `Thank you!`,
        ];

        const message = encodeURIComponent(lines.filter(Boolean).join("\n"));
        const waUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
        window.open(waUrl, "_blank");
    };

    return (
        <div className={`product-card ${inStock ? "in-stock" : "out-of-stock"}`}>
            <div className="product-image">
                <img
                    src={product.images?.[0] || product.image || '/placeholder.svg'}
                    alt={product.name}
                    loading="lazy"
                />
                {product.badge && <span className="product-badge" style={{ fontSize: '0.75rem' }}>{product.badge}</span>}
                {product.stock <= 5 && product.stock > 0 && (
                    <span className="low-stock-badge" style={{ fontSize: '0.75rem' }}>Only {product.stock} left!</span>
                )}
            </div>
            <div className="product-info">
                <h3 className="product-name" style={{ fontSize: '0.95rem' }}>{product.name}</h3>
                <p className="product-code" style={{ fontSize: '0.7rem' }}>Code: {product.code}</p>

                {/* Stock Status */}
                <div className={`stock-status ${inStock ? "in-stock" : "out-of-stock"}`} style={{ fontSize: '0.8rem' }}>
                    <i className={`fas ${inStock ? "fa-check-circle" : "fa-times-circle"}`}></i>
                    <span>{stockText}</span>
                </div>

                {/* Price Section */}
                <div className="product-price-section">
                    <div className="price-wrapper">
                        <span className="actual-price" style={{ fontSize: '0.9rem' }}>
                            AED {(product.price || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="offer-price" style={{ fontSize: '1.2rem' }}>
                            AED {(product.offer_price || 0).toLocaleString("en-IN")}
                        </span>
                    </div>
                    {product.discount > 0 && (
                        <div className="discount-savings-wrapper">
                            <span className="discount-badge-product" style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-tag"></i> {product.discount}% OFF
                            </span>
                            <span className="savings-text" style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-piggy-bank"></i>
                                Save AED {(savings || 0).toLocaleString("en-IN")}
                            </span>
                        </div>
                    )}
                </div>

                {/* Specifications */}
                {type === "laptop" ? (
                    <ul className="product-features" style={{ fontSize: '0.8rem' }}>
                        <li>
                            <i className="fas fa-microchip"></i> {product.processor}
                        </li>
                        <li>
                            <i className="fas fa-memory"></i> {product.ram}
                        </li>
                        <li>
                            <i className="fas fa-hdd"></i> {product.storage}
                        </li>
                        <li>
                            <i className="fas fa-desktop"></i> {product.screen}
                        </li>
                        {product.feature && (
                            <li>
                                <i className="fas fa-star"></i> {product.feature}
                            </li>
                        )}
                    </ul>
                ) : (
                    <>
                        {product.about && (
                            <div className="product-about">
                                <h4 style={{ fontSize: '0.85rem' }}>
                                    <i className="fas fa-info-circle"></i> About this item:
                                </h4>
                                <p style={{ fontSize: '0.8rem' }}>{product.about}</p>
                            </div>
                        )}
                        {product.features && (
                            <ul className="product-features" style={{ fontSize: '0.8rem' }}>
                                {product.features.split(",").map((f, i) => (
                                    <li key={i}>
                                        <i className="fas fa-check"></i> {f.trim()}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {/* Action Button */}
                {inStock ? (
                    <button className="btn-whatsapp" onClick={inquireWhatsApp} style={{ fontSize: '0.9rem' }}>
                        <i className="fab fa-whatsapp"></i> Inquire on WhatsApp
                    </button>
                ) : (
                    <button className="btn-out-of-stock" disabled style={{ fontSize: '0.9rem' }}>
                        <i className="fas fa-ban"></i> Out of Stock
                    </button>
                )}
            </div>
        </div>
    );
}
