"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/utils/cart";
import { toast } from 'sonner';
import { SiteConfig } from "@/config/site";
import ProductGallery from "./ProductGallery";
import ProductTabs from "./ProductTabs";

interface ProductDetailContentProps {
    product: any;
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

export default function ProductDetailContent({ product }: ProductDetailContentProps) {
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [isInWishlist, setIsInWishlist] = useState(false);

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

    const parseColorOptions = (colorString: string): ColorOption[] => {
        if (!colorString) return [];
        try {
            // New Format: JSON String of objects [{label, code, price}]
            if (colorString.trim().startsWith('[')) {
                const parsed = JSON.parse(colorString);
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
                    return parsed.map((p: any) => ({
                        label: p.label || p.color || 'Unknown', // Fallback for various legacy formats
                        code: p.code || '#000000'
                    }));
                }
                // Fallback for simple string array
                return Array.isArray(parsed) ? parsed.map((c, i) => ({
                    label: c,
                    code: ['#C0C0C0', '#4A4A4A', '#D4AF37', '#191970'][i % 4]
                })) : [];
            }
        } catch (e) { console.warn('Failed to parse colors', e); }

        // Fallback: Comma separated string
        return colorString.split(',').map((color: string, index: number) => ({
            label: color.trim(),
            code: ['#C0C0C0', '#4A4A4A', '#D4AF37', '#191970'][index % 4]
        }));
    };

    useEffect(() => {
        if (product) {
            checkWishlistStatus();

            // Setup Options
            if (product.type === 'laptop' || product.type === 'system' || product.specifications?.Processor) {
                // Processor
                setProcessorOptions([{ label: product.specifications?.Processor || 'Standard Processor', price: 0 }]);

                // RAM
                const baseRamStr = product.specifications?.RAM || '8GB';
                const baseRamSize = baseRamStr.split(' ')[0];
                const baseRam = { label: baseRamStr, size: baseRamSize, type: 'DDR4', price: 0 };
                let ramOpts: ConfigOption[] = [baseRam];

                let pRamVariants = product.ramVariants;
                if (typeof pRamVariants === 'string') {
                    try { pRamVariants = JSON.parse(pRamVariants); } catch (e) { pRamVariants = []; }
                }

                if (pRamVariants && Array.isArray(pRamVariants)) {
                    const variantOpts = pRamVariants.map((v: any) => ({
                        label: `${v.size} ${v.type || ''}`.trim(),
                        size: v.size,
                        type: v.type,
                        price: v.price
                    }));
                    ramOpts = [...ramOpts, ...variantOpts];
                }
                setRamOptions(ramOpts);

                // Storage
                const baseStoStr = product.specifications?.Storage || '256GB';
                const baseStoSize = baseStoStr.split(' ')[0];
                const baseStorage = { label: baseStoStr, size: baseStoSize, type: 'SSD', price: 0 };
                let storageOpts: ConfigOption[] = [baseStorage];

                let pStorageVariants = product.storageVariants;
                if (typeof pStorageVariants === 'string') {
                    try { pStorageVariants = JSON.parse(pStorageVariants); } catch (e) { pStorageVariants = []; }
                }

                if (pStorageVariants && Array.isArray(pStorageVariants)) {
                    const variantOpts = pStorageVariants.map((v: any) => ({
                        label: `${v.size} ${v.type || ''}`.trim(),
                        size: v.size,
                        type: v.type,
                        price: v.price
                    }));
                    storageOpts = [...storageOpts, ...variantOpts];
                }
                setStorageOptions(storageOpts);

                // Colors
                const colors = parseColorOptions(product.specifications?.colors || '');
                setColorOptions(colors);
            }
        }
    }, [product]);

    const checkWishlistStatus = async () => {
        const storedUser = localStorage.getItem('customer_user');
        if (!storedUser) return;
        try {
            const user = JSON.parse(storedUser);
            const res = await fetch(`/api/customer/wishlist?customer_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                const exists = data.wishlist.some((item: any) => String(item.id) === String(product.id));
                setIsInWishlist(exists);
            }
        } catch (e) {
            console.error("Failed to check wishlist status", e);
        }
    };

    const calculateTotalPrice = () => {
        const basePrice = product.price;
        const processorPrice = processorOptions[selectedProcessor]?.price || 0;
        const ramPrice = ramOptions[selectedRam]?.price || 0;
        const storagePrice = storageOptions[selectedStorage]?.price || 0;
        return basePrice + processorPrice + ramPrice + storagePrice;
    };

    const getSelectedOptions = () => {
        if (product?.type !== 'laptop' && product?.type !== 'system' && !product?.specifications?.Processor) return {};
        return {
            processor: processorOptions[selectedProcessor]?.label || '',
            ram: ramOptions[selectedRam]?.label || '',
            storage: storageOptions[selectedStorage]?.label || '',
            color: colorOptions[selectedColor]?.label || ''
        };
    };

    const addToCartAction = () => {
        addToCart({
            id: product.id,
            name: product.name,
            price: calculateTotalPrice(),
            image: product.image || product.images[0] || '/placeholder.svg',
            quantity: quantity,
            options: getSelectedOptions(),
        });
        toast.success(`${product.name} added to cart!`);
    };

    const handleBuyNow = () => {
        addToCartAction();
        router.push('/cart');
    };

    const handleWhatsapp = () => {
        const options = getSelectedOptions();
        const optionsStr = Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(', ');
        const text = `Hi, I am interested in ${product.name} (Code: ${product.productCode}). \nPrice: AED ${calculateTotalPrice().toLocaleString()} \n${optionsStr}`;
        const encodedText = encodeURIComponent(text);
        const phone = SiteConfig.contact.phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };

    const handleAddToWishlist = async () => {
        const storedUser = localStorage.getItem('customer_user');
        if (!storedUser) {
            toast.error("Please login to manage wishlist");
            router.push('/login');
            return;
        }

        const user = JSON.parse(storedUser);

        try {
            if (isInWishlist) {
                const res = await fetch(`/api/customer/wishlist?customer_id=${user.id}&product_id=${product.id}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    toast.success("Removed from wishlist");
                    setIsInWishlist(false);
                } else {
                    toast.error("Failed to remove from wishlist");
                }
            } else {
                const res = await fetch('/api/customer/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_id: user.id,
                        product_id: product.id
                    })
                });
                if (res.ok) {
                    toast.success(`${product.name} added to wishlist!`);
                    setIsInWishlist(true);
                } else {
                    const data = await res.json();
                    if (data.message === "Product already in wishlist") {
                        setIsInWishlist(true);
                        toast.info("Already in wishlist");
                    }
                }
            }
        } catch (error) {
            console.error("Wishlist error", error);
            toast.error(isInWishlist ? "Failed to remove" : "Failed to add");
        }
    };

    const totalPrice = calculateTotalPrice();

    return (
        <>
            <div className="product-main-container">
                <ProductGallery images={product.images} name={product.name} />

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
                                {ramOptions[selectedRam]?.size || ramOptions[selectedRam]?.label || 'N/A'}
                                {ramOptions[selectedRam]?.price === 0 ? ' (Included)' : ''}
                            </span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Storage</span>
                            <span className="summary-sep">:</span>
                            <span className="summary-value">
                                {storageOptions[selectedStorage]?.size || storageOptions[selectedStorage]?.label || 'N/A'}
                                {storageOptions[selectedStorage]?.price === 0 ? ' (Included)' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="variants-row">
                        {ramOptions.length > 1 && (
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

                        {storageOptions.length > 1 && (
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

                    <div className="color-qty-row">
                        {colorOptions.length > 0 && (
                            <div className="option-section">
                                <span className="section-label">Color <span style={{ fontWeight: 400, color: '#666', marginLeft: '5px' }}>{colorOptions[selectedColor]?.label}</span></span>
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

                        <div className="option-section">
                            <span className="section-label">Quantity</span>
                            <div className="quantity-group">
                                <div className="quantity-control-pill">
                                    <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} >-</button>
                                    <span className="qty-display">{quantity}</span>
                                    <button className="qty-btn" onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}>+</button>
                                </div>

                                <div className="action-buttons">
                                    <button
                                        className="icon-btn-square"
                                        title={isInWishlist ? "Already in Wishlist" : "Add to Wishlist"}
                                        onClick={handleAddToWishlist}
                                    >
                                        <i className={`fa-heart ${isInWishlist ? 'fas' : 'far'}`} style={{ color: isInWishlist ? 'black' : 'inherit' }}></i>
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

            <ProductTabs
                product={product}
                ramOptions={ramOptions}
                selectedRam={selectedRam}
                storageOptions={storageOptions}
                selectedStorage={selectedStorage}
                colorOptions={colorOptions}
                selectedColor={selectedColor}
                parseColorOptions={parseColorOptions}
            />
        </>
    );
}
