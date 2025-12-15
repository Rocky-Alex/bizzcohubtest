"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/utils/cart";
import "./styles/product-detail.css";

interface Product {
    id: string;
    productCode: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    type: 'laptop' | 'accessory' | 'system';
    images: string[];
    createdAt: string;
    stock: number;
    description?: string;
    features?: string;
    specifications?: Record<string, string>;
    ramVariants?: { size: string; type: string; price: number }[];
    storageVariants?: { size: string; type: string; price: number }[];
}

interface ConfigOption {
    id?: string;
    label: string;
    price: number;
    name?: string;
    gen?: string;
    size?: string;
    type?: string;
}

interface ColorOption {
    label: string;
    code: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'about' | 'review'>('about');

    // Dynamic Configuration Options
    const [processorOptions, setProcessorOptions] = useState<ConfigOption[]>([]);
    const [ramOptions, setRamOptions] = useState<ConfigOption[]>([]);
    const [storageOptions, setStorageOptions] = useState<ConfigOption[]>([]);
    const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);

    // Configuration states
    const [selectedProcessor, setSelectedProcessor] = useState(0);
    const [selectedRam, setSelectedRam] = useState(0);
    const [selectedStorage, setSelectedStorage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(0);

    useEffect(() => {
        if (params.id && params.type) {
            fetchProduct();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, params.type]);

    const parseColorOptions = (colorString: string): ColorOption[] => {
        if (!colorString) return [];
        try {
            if (colorString.trim().startsWith('[')) {
                const parsed = JSON.parse(colorString);
                return Array.isArray(parsed) ? parsed : [];
            }
        } catch (e) { console.warn('Failed to parse colors', e); }

        return colorString.split(',').map((color, index) => ({
            label: color.trim(),
            code: ['#C0C0C0', '#4A4A4A', '#D4AF37', '#191970'][index % 4]
        }));
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/products?type=${params.type}`);
            const data = await response.json();

            // Loose comparison to handle number vs string IDs
            const foundProduct = data.products?.find((p: any) => String(p.id) === String(params.id));

            if (foundProduct) {
                setProduct(foundProduct);

                // Check if it's a system/laptop either by explicit type or by presence of Processor spec
                if (foundProduct.type === 'laptop' || foundProduct.type === 'system' || foundProduct.specifications?.Processor) {
                    // Processor
                    setProcessorOptions([{ label: foundProduct.specifications?.Processor || 'Standard Processor', price: 0 }]);

                    // RAM - Extract just size and type for cleaner display if possible
                    const baseRamStr = foundProduct.specifications?.RAM || '8GB';
                    const baseRamParts = baseRamStr.split(' ');
                    const baseRamSize = baseRamParts[0]; // e.g., 8GB

                    const baseRam = {
                        label: baseRamStr,
                        size: baseRamSize,
                        type: 'DDR4', // Assumption/Placeholder
                        price: 0
                    };

                    let ramOpts: ConfigOption[] = [baseRam];
                    if (foundProduct.ramVariants && Array.isArray(foundProduct.ramVariants)) {
                        const variantOpts = foundProduct.ramVariants.map((v: any) => ({
                            label: `${v.size} ${v.type || ''}`.trim(),
                            size: v.size,
                            type: v.type,
                            price: v.price
                        }));
                        ramOpts = [...ramOpts, ...variantOpts];
                    }
                    setRamOptions(ramOpts);

                    // Storage
                    const baseStoStr = foundProduct.specifications?.Storage || '256GB';
                    const baseStoParts = baseStoStr.split(' ');
                    const baseStoSize = baseStoParts[0];

                    const baseStorage = {
                        label: baseStoStr,
                        size: baseStoSize,
                        type: 'SSD',
                        price: 0
                    };

                    let storageOpts: ConfigOption[] = [baseStorage];
                    if (foundProduct.storageVariants && Array.isArray(foundProduct.storageVariants)) {
                        const variantOpts = foundProduct.storageVariants.map((v: any) => ({
                            label: `${v.size} ${v.type || ''}`.trim(),
                            size: v.size,
                            type: v.type,
                            price: v.price
                        }));
                        storageOpts = [...storageOpts, ...variantOpts];
                    }
                    setStorageOptions(storageOpts);

                    // Colors
                    const colors = parseColorOptions(foundProduct.specifications?.colors || '');
                    setColorOptions(colors.length > 0 ? colors : [{ label: 'Silver', code: '#C0C0C0' }, { label: 'Space Grey', code: '#4A4A4A' }]);
                }
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
        const processorPrice = processorOptions[selectedProcessor]?.price || 0;
        const ramPrice = ramOptions[selectedRam]?.price || 0;
        const storagePrice = storageOptions[selectedStorage]?.price || 0;
        return basePrice + processorPrice + ramPrice + storagePrice;
    };

    const getSelectedOptions = () => {
        // Return options if it's a configurable system
        if (product?.type !== 'laptop' && product?.type !== 'system' && !product?.specifications?.Processor) return {};
        return {
            processor: processorOptions[selectedProcessor]?.label || '',
            ram: ramOptions[selectedRam]?.label || '',
            storage: storageOptions[selectedStorage]?.label || '',
            color: colorOptions[selectedColor]?.label || ''
        };
    };

    const addToCartAction = () => {
        if (!product) return;
        addToCart({
            id: product.id,
            name: product.name,
            price: calculateTotalPrice(),
            image: product.images[0] || '/placeholder.png',
            quantity: quantity,
            options: getSelectedOptions(),
        });
    };

    const handleBuyNow = () => {
        addToCartAction();
        router.push('/cart');
    };

    const handleWhatsapp = () => {
        if (!product) return;
        const options = getSelectedOptions();
        const optionsStr = Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(', ');
        const text = `Hi, I am interested in ${product.name} (Code: ${product.productCode}). \nPrice: AED ${calculateTotalPrice().toLocaleString()} \n${optionsStr}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/971567064457?text=${encodedText}`, '_blank');
    };

    const totalPrice = calculateTotalPrice();

    if (loading || !product) {
        return <div className="loading-container"><i className="fas fa-spinner fa-spin"></i></div>;
    }

    return (
        <div className="product-detail-page">
            <div className="back-nav-container">
                <Link href="/products" className="back-to-products">
                    <i className="fas fa-arrow-left"></i> Back to Products
                </Link>
            </div>

            <div className="product-main-container">
                {/* Left Column: Gallery */}
                <div className="left-column">
                    <div className="thumbnail-strip">
                        {product.images.map((image, index) => (
                            <div
                                key={index}
                                className={`thumbnail-item ${selectedImage === index ? 'active' : ''}`}
                                onClick={() => setSelectedImage(index)}
                            >
                                <img src={image} alt={`Thumbnail ${index}`} />
                            </div>
                        ))}
                    </div>
                    <div className="main-product-image">
                        <img
                            src={product.images[selectedImage] || '/uploads/placeholder.jpg'}
                            alt={product.name}
                        />
                    </div>
                </div>

                {/* Right Column: Config */}
                <div className="product-config">
                    <div className="product-title-section">
                        <h1 className="product-name">{product.name}</h1>
                        <p className="product-subtitle">{product.brand} | {product.productCode}</p>
                    </div>

                    <div className="price-display-row">
                        <span className="price-current">AED {totalPrice.toLocaleString()}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <>
                                <span className="price-original">AED {((product.originalPrice) + (totalPrice - product.price)).toLocaleString()}</span>
                                <span className="price-save">Save AED {(product.originalPrice - product.price).toLocaleString()}</span>
                            </>
                        )}
                    </div>

                    <div className="product-summary-specs">
                        <div className="summary-row">
                            <span className="summary-label">Processor</span>
                            <span className="summary-sep">:</span>
                            <span className="summary-value">{product.specifications?.Processor || 'N/A'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Memory</span>
                            <span className="summary-sep">:</span>
                            <span className="summary-value">
                                {ramOptions[selectedRam]?.size || ramOptions[selectedRam]?.label}
                                {ramOptions[selectedRam]?.price === 0 ? ' (Included)' : ''}
                            </span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Storage</span>
                            <span className="summary-sep">:</span>
                            <span className="summary-value">
                                {storageOptions[selectedStorage]?.size || storageOptions[selectedStorage]?.label}
                                {storageOptions[selectedStorage]?.price === 0 ? ' (Included)' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Variants Row */}
                    <div className="variants-row">
                        {/* RAM Selection */}
                        {ramOptions.length > 0 && (
                            <div className="variant-section">
                                <h4 className="variant-title">Memory Variants</h4>
                                <div className="config-group">
                                    {ramOptions.map((opt, idx) => (
                                        <div
                                            key={idx}
                                            className={`variant-pill type-ram ${selectedRam === idx ? 'selected' : ''}`}
                                            onClick={() => setSelectedRam(idx)}
                                        >
                                            <span className="pill-label">{opt.size || opt.label}</span>
                                            <span className="pill-price">{opt.price > 0 ? `+${opt.price} AED` : 'Included'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Storage Selection */}
                        {storageOptions.length > 0 && (
                            <div className="variant-section">
                                <h4 className="variant-title">Storage Variants</h4>
                                <div className="config-group">
                                    {storageOptions.map((opt, idx) => (
                                        <div
                                            key={idx}
                                            className={`variant-pill type-storage ${selectedStorage === idx ? 'selected' : ''}`}
                                            onClick={() => setSelectedStorage(idx)}
                                        >
                                            <span className="pill-label">{opt.size || opt.label}</span>
                                            <span className="pill-price">{opt.price > 0 ? `+${opt.price} AED` : 'Included'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Color Selection */}
                    {/* Color & Quantity Row */}
                    <div className="color-qty-row">
                        {/* Color Selection */}
                        {colorOptions.length > 0 && (
                            <div className="option-section">
                                <span className="section-label">Color</span>
                                <div className="color-selection">
                                    {colorOptions.map((col, idx) => (
                                        <div
                                            key={idx}
                                            className={`color-circle-btn ${selectedColor === idx ? 'selected' : ''}`}
                                            style={{ backgroundColor: col.code }}
                                            title={col.label}
                                            onClick={() => setSelectedColor(idx)}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Actions Layout */}
                        <div className="option-section">
                            <span className="section-label">Quantity</span>
                            <div className="quantity-group">
                                <div className="quantity-control-pill">
                                    <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} >-</button>
                                    <span className="qty-display">{quantity}</span>
                                    <button className="qty-btn" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                                </div>

                                <div className="action-buttons">
                                    <button className="icon-btn-square" title="Add to Wishlist">
                                        <i className="far fa-heart"></i>
                                    </button>
                                    <button className="icon-btn-square" title="Share">
                                        <i className="fas fa-share-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="main-actions">
                        <button className="btn-black" onClick={addToCartAction}>
                            <i className="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button className="btn-blue" onClick={handleBuyNow}>
                            <i className="fas fa-bolt"></i> Buy Now
                        </button>
                        <button className="btn-green" onClick={handleWhatsapp}>
                            <i className="fab fa-whatsapp"></i> Enquire
                        </button>
                    </div>
                </div>
            </div>


            {/* Bottom Tabs Section */}
            <div className="tabs-container">
                <div className="tabs-nav">
                    <button
                        className={`tab-nav-btn ${activeTab === 'about' ? 'active' : ''}`}
                        onClick={() => setActiveTab('about')}
                    >
                        About this Product
                    </button>
                    <button
                        className={`tab-nav-btn ${activeTab === 'review' ? 'active' : ''}`}
                        onClick={() => setActiveTab('review')}
                    >
                        Review
                    </button>
                </div>

                <div className="tab-panel">
                    {activeTab === 'about' ? (
                        <div className="specs-table-layout">
                            {/* Left Specs Column */}
                            <div className="specs-left">
                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Basic Information</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Brand</span>
                                        <span className="spec-val">{product.brand}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Model</span>
                                        <span className="spec-val">{product.specifications?.['Model'] || product.name || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Series</span>
                                        <span className="spec-val">{product.specifications?.['Series'] || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Processor (CPU)</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Processor Name</span>
                                        <span className="spec-val">{product.specifications?.Processor || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Processor Generation</span>
                                        <span className="spec-val">{product.specifications?.['Processor Generation'] || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Processor Speed</span>
                                        <span className="spec-val">{product.specifications?.['Processor Speed'] || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Memory (RAM)</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Memory Technology</span>
                                        <span className="spec-val">{product.specifications?.['RAM Type'] || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Memory Size</span>
                                        <span className="spec-val">{ramOptions[selectedRam]?.size || product.specifications?.RAM || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Storage</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Storage Technology</span>
                                        <span className="spec-val">{product.specifications?.['Storage Type'] || 'SSD'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Storage Size</span>
                                        <span className="spec-val">{storageOptions[selectedStorage]?.size || product.specifications?.Storage || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Graphics (GPU)</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Graphics Chipset</span>
                                        <span className="spec-val">{product.specifications?.Graphics || 'Integrated'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Graphics Card Type</span>
                                        <span className="spec-val">{product.specifications?.['Graphics Type'] || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Graphics Card Ram Size</span>
                                        <span className="spec-val">{product.specifications?.['Graphics Storage'] || 'Shared'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Specs Column */}
                            <div className="specs-right">
                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Display</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Display size</span>
                                        <span className="spec-val">{product.specifications?.Screen || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Screen Resolution</span>
                                        <span className="spec-val">{product.specifications?.['Screen Resolution'] || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Resolution Pixel</span>
                                        <span className="spec-val">{product.specifications?.['Resolution Pixel'] || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Connectivity</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Wireless Type</span>
                                        <span className="spec-val">{product.specifications?.['Wireless Type'] || 'Wi-Fi & Bluetooth'}</span>
                                    </div>
                                </div>

                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Operating System</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Operating System</span>
                                        <span className="spec-val">{product.specifications?.['Operating System'] || 'Windows'}</span>
                                    </div>
                                </div>

                                <div className="spec-category-group">
                                    <h4 className="spec-category-title">Others Information</h4>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Condition/Grade</span>
                                        <span className="spec-val">{product.specifications?.Condition || 'New'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Color</span>
                                        <span className="spec-val">{product.specifications?.colors || colorOptions[selectedColor]?.label || 'N/A'}</span>
                                    </div>
                                    <div className="spec-table-row">
                                        <span className="spec-key">Optical Drive Type</span>
                                        <span className="spec-val">{product.specifications?.['Optical Drive'] || 'None'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="reviews-content">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Customer Reviews</h3>
                            <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
