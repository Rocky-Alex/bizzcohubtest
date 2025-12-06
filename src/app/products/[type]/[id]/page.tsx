"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/utils/cart";
import "./product-detail.css";

interface Product {
    id: string;
    productCode: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    type: 'laptop' | 'accessory';
    images: string[];
    createdAt: string;
    stock: number;
    description?: string;
    specifications?: Record<string, string>;
}

// Configuration options for laptops
const processorOptions = [
    { name: 'Intel Core i5', gen: '11th Gen, 4.2GHz', price: 0, label: 'Included' },
    { name: 'Intel Core i7', gen: '11th Gen, 4.7GHz', price: 5200 },
    { name: 'Intel Core i9', gen: '11th Gen, 5.0GHz', price: 5400 },
];

const ramOptions = [
    { size: '8GB RAM', price: 0, label: 'Included' },
    { size: '16GB RAM', price: 5100 },
    { size: '32GB RAM', price: 5250 },
    { size: '64GB RAM', price: 5500 },
];

const storageOptions = [
    { size: '256GB SSD', price: 0, label: 'Included' },
    { size: '512GB SSD', price: 5150 },
    { size: '1TB SSD', price: 5300 },
    { size: '2TB SSD', price: 5600 },
];

const colorOptions = [
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Space Gray', hex: '#4A4A4A' },
    { name: 'Gold', hex: '#D4AF37' },
    { name: 'Midnight Blue', hex: '#191970' },
];

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<'specifications' | 'features' | 'reviews'>('specifications');

    // Configuration states
    const [selectedProcessor, setSelectedProcessor] = useState(0);
    const [selectedRam, setSelectedRam] = useState(0);
    const [selectedStorage, setSelectedStorage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(0);

    useEffect(() => {
        if (params.id && params.type) {
            fetchProduct();
        }
    }, [params.id, params.type]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/products?type=${params.type}`);
            const data = await response.json();

            const foundProduct = data.products?.find((p: Product) => p.id === params.id);

            if (foundProduct) {
                setProduct(foundProduct);
                const related = data.products
                    ?.filter((p: Product) => p.id !== params.id)
                    ?.slice(0, 4) || [];
                setRelatedProducts(related);
            } else {
                router.push('/products');
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching product:', error);
            setLoading(false);
        }
    };

    const calculateTotalPrice = () => {
        if (!product) return 0;
        const basePrice = product.price;
        const processorPrice = product.type === 'laptop' ? processorOptions[selectedProcessor].price : 0;
        const ramPrice = product.type === 'laptop' ? ramOptions[selectedRam].price : 0;
        const storagePrice = product.type === 'laptop' ? storageOptions[selectedStorage].price : 0;
        return basePrice + processorPrice + ramPrice + storagePrice;
    };

    const getSelectedOptions = () => {
        if (product?.type !== 'laptop') return {};
        return {
            processor: processorOptions[selectedProcessor].name,
            ram: ramOptions[selectedRam].size,
            storage: storageOptions[selectedStorage].size,
            color: colorOptions[selectedColor].name
        };
    };

    const addToCartAction = () => {
        if (!product) return;
        const finalPrice = calculateTotalPrice();

        addToCart({
            id: product.id,
            name: product.name,
            price: finalPrice,
            image: product.images[0] || '/placeholder.png',
            quantity: quantity,
            options: getSelectedOptions(),
            specs: product.type === 'accessory' ? product.description : undefined
        });
    };

    const handleAddToCart = () => {
        addToCartAction();
        alert(`Added ${quantity} x ${product?.name} to cart!`);
    };

    const handleBuyNow = () => {
        addToCartAction();
        router.push('/cart');
    };

    const handleWhatsapp = () => {
        if (!product) return;
        const options = getSelectedOptions();
        const optionsStr = Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(', ');
        const text = `Hi, I am interested in ${product.name} (Code: ${product.productCode}).
        
Price: AED ${calculateTotalPrice().toLocaleString()}
${optionsStr ? `Configuration: ${optionsStr}` : ''}`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/971567064457?text=${encodedText}`, '_blank');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading product details...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="error-container">
                <i className="fas fa-exclamation-triangle"></i>
                <h2>Product Not Found</h2>
                <p>The product you're looking for doesn't exist.</p>
                <Link href="/products" className="back-btn">
                    <i className="fas fa-arrow-left"></i> Back to Products
                </Link>
            </div>
        );
    }

    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const totalPrice = calculateTotalPrice();
    const savings = product.originalPrice ? product.originalPrice - totalPrice : 0;

    return (
        <div className="product-detail-page">
            {/* Back Button */}
            <Link href="/products" className="back-to-products">
                <i className="fas fa-arrow-left"></i> Back to Products
            </Link>

            {/* Main Product Section */}
            <div className="product-main-container">
                {/* Left: Image Gallery & Trust Info */}
                <div className="left-column">
                    <div className="product-gallery">
                        <div className="main-product-image">
                            <img
                                src={product.images[selectedImage] || '/uploads/placeholder.jpg'}
                                alt={product.name}
                            />
                            {discount > 0 && (
                                <div className="new-release-badge">New Release</div>
                            )}
                        </div>

                        {product.images.length > 1 && (
                            <div className="thumbnail-strip">
                                {product.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className={`thumbnail-item ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={image} alt={`View ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Trust Badges moved to left column bottom */}
                    <div className="trust-info desktop-only">
                        <div className="trust-item">
                            <i className="fas fa-shipping-fast"></i>
                            <div>
                                <strong>Free Shipping</strong>
                                <p>Delivery in 2-3 business days</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <i className="fas fa-shield-alt"></i>
                            <div>
                                <strong>2-Year Warranty</strong>
                                <p>Extended warranty available</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <i className="fas fa-undo"></i>
                            <div>
                                <strong>30-Day Returns</strong>
                                <p>Full refund, no questions asked</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Product Configuration */}
                <div className="product-config">
                    <h1 className="product-name">{product.name}</h1>
                    <p className="product-subtitle">High-Performance Business Laptop</p>

                    {/* Price Section */}
                    <div className="price-display">
                        <div className="current-price-large">AED {totalPrice.toLocaleString()}</div>
                        {product.originalPrice && (
                            <>
                                <div className="original-price-strike">AED {product.originalPrice.toLocaleString()}</div>
                                <div className="save-amount">Save AED {savings.toLocaleString()}</div>
                            </>
                        )}
                    </div>



                    {/* Product Description */}
                    {product.description && (
                        <p className="product-description">{product.description}</p>
                    )}

                    {/* Processor Options */}
                    {product.type === 'laptop' && (
                        <>
                            <div className="config-section">
                                <h3 className="config-title">Processor</h3>
                                <div className="option-grid">
                                    {processorOptions.map((option, index) => (
                                        <div
                                            key={index}
                                            className={`option-card ${selectedProcessor === index ? 'selected' : ''}`}
                                            onClick={() => setSelectedProcessor(index)}
                                        >
                                            <div className="option-name">{option.name}</div>
                                            <div className="option-detail">{option.gen}</div>
                                            <div className="option-price">
                                                {option.label || `+AED ${option.price}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RAM Options */}
                            <div className="config-section">
                                <h3 className="config-title">Memory (RAM)</h3>
                                <div className="option-grid-2col">
                                    {ramOptions.map((option, index) => (
                                        <div
                                            key={index}
                                            className={`option-card ${selectedRam === index ? 'selected' : ''}`}
                                            onClick={() => setSelectedRam(index)}
                                        >
                                            <div className="option-name">{option.size}</div>
                                            <div className="option-price">
                                                {option.label || `+AED ${option.price}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Storage Options */}
                            <div className="config-section">
                                <h3 className="config-title">Storage</h3>
                                <div className="option-grid-2col">
                                    {storageOptions.map((option, index) => (
                                        <div
                                            key={index}
                                            className={`option-card ${selectedStorage === index ? 'selected' : ''}`}
                                            onClick={() => setSelectedStorage(index)}
                                        >
                                            <div className="option-name">{option.size}</div>
                                            <div className="option-price">
                                                {option.label || `+AED ${option.price}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Color Options */}
                        </>
                    )}

                    {/* Color and Secondary Actions Row */}
                    <div className="color-actions-row">
                        {product.type === 'laptop' && (
                            <div className="config-section">
                                <h3 className="config-title">Color</h3>
                                <div className="color-options">
                                    {colorOptions.map((color, index) => (
                                        <div
                                            key={index}
                                            className={`color-option ${selectedColor === index ? 'selected' : ''}`}
                                            onClick={() => setSelectedColor(index)}
                                        >
                                            <div
                                                className="color-circle"
                                                style={{ backgroundColor: color.hex }}
                                            ></div>
                                            <div className="color-name">{color.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="secondary-actions">
                            <button className="wishlist-btn">
                                <i className="far fa-heart"></i>
                            </button>
                            <button className="share-btn">
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="config-section mt-4">
                        <h3 className="config-title">Quantity</h3>
                        <div className="quantity-selector-modern">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                            >
                                -
                            </button>
                            <span>{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                disabled={quantity >= product.stock}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons-grid">
                        <button
                            className="action-btn add-to-cart-btn"
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            <i className="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button
                            className="action-btn buy-now-btn"
                            onClick={handleBuyNow}
                            disabled={product.stock === 0}
                        >
                            <i className="fas fa-bolt"></i> Buy Now
                        </button>
                        <button
                            className="action-btn whatsapp-btn"
                            onClick={handleWhatsapp}
                        >
                            <i className="fab fa-whatsapp"></i> Enquire
                        </button>
                    </div>


                </div>
            </div>

            {/* Tabbed Specifications Section */}
            <div className="specs-tabs-container">
                <div className="tabs-header">
                    <button
                        className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('specifications')}
                    >
                        Specifications
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                        onClick={() => setActiveTab('features')}
                    >
                        Features
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Reviews
                    </button>
                </div>

                <div className="tabs-content">
                    {activeTab === 'specifications' && (
                        <div className="specs-grid-detailed">
                            <div className="spec-column">
                                <h4>Display</h4>
                                <div className="spec-row">
                                    <span className="spec-label">Screen Size</span>
                                    <span className="spec-value">{product.specifications?.Screen || '15.6 inches'}</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Resolution</span>
                                    <span className="spec-value">4K UHD (3840 x 2160)</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Panel Type</span>
                                    <span className="spec-value">IPS, 400 nits brightness</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Refresh Rate</span>
                                    <span className="spec-value">120Hz</span>
                                </div>
                            </div>

                            <div className="spec-column">
                                <h4>Performance</h4>
                                <div className="spec-row">
                                    <span className="spec-label">Processor</span>
                                    <span className="spec-value">{product.specifications?.Processor || processorOptions[selectedProcessor].name}</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Graphics</span>
                                    <span className="spec-value">{product.specifications?.Graphics || 'NVIDIA GeForce RTX 3060 8GB'}</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Memory</span>
                                    <span className="spec-value">{product.specifications?.RAM || ramOptions[selectedRam].size}</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Storage</span>
                                    <span className="spec-value">{product.specifications?.Storage || storageOptions[selectedStorage].size}</span>
                                </div>
                            </div>

                            <div className="spec-column">
                                <h4>Connectivity</h4>
                                <div className="spec-row">
                                    <span className="spec-label">Ports</span>
                                    <span className="spec-value">2x Thunderbolt 4, 2x USB-A 3.2, HDMI 2.1, Audio Jack</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Wireless</span>
                                    <span className="spec-value">Wi-Fi 6E, Bluetooth 5.2</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Webcam</span>
                                    <span className="spec-value">1080p HD with IR face recognition</span>
                                </div>
                            </div>

                            <div className="spec-column">
                                <h4>Battery & Dimensions</h4>
                                <div className="spec-row">
                                    <span className="spec-label">Battery Life</span>
                                    <span className="spec-value">Up to 14 hours</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Weight</span>
                                    <span className="spec-value">3.9 lbs (1.77 kg)</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Dimensions</span>
                                    <span className="spec-value">14.1 x 9.8 x 0.7 inches</span>
                                </div>
                                <div className="spec-row">
                                    <span className="spec-label">Operating System</span>
                                    <span className="spec-value">Windows 11 Pro</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className="features-content">
                            <h3>Key Features</h3>
                            <ul className="features-list">
                                <li><i className="fas fa-check-circle"></i> Premium aluminum chassis with precision engineering</li>
                                <li><i className="fas fa-check-circle"></i> Advanced thermal management for sustained performance</li>
                                <li><i className="fas fa-check-circle"></i> Backlit keyboard with customizable RGB lighting</li>
                                <li><i className="fas fa-check-circle"></i> Precision touchpad with multi-touch gestures</li>
                                <li><i className="fas fa-check-circle"></i> Dolby Atmos audio with quad speakers</li>
                                <li><i className="fas fa-check-circle"></i> Fast charging - 80% in 60 minutes</li>
                                <li><i className="fas fa-check-circle"></i> Fingerprint reader for secure login</li>
                                <li><i className="fas fa-check-circle"></i> Military-grade durability (MIL-STD-810H certified)</li>
                            </ul>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="reviews-content">
                            <h3>Customer Reviews</h3>
                            <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
