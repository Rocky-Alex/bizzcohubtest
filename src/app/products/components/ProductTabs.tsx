"use client";

import { useState } from "react";

interface ProductTabsProps {
    product: any;
    ramOptions: any[];
    selectedRam: number;
    storageOptions: any[];
    selectedStorage: number;
    colorOptions: any[];
    selectedColor: number;
    parseColorOptions: (str: string) => any[];
}

export default function ProductTabs({
    product,
    ramOptions,
    selectedRam,
    storageOptions,
    selectedStorage,
    colorOptions,
    selectedColor,
    parseColorOptions
}: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'review'>('about');

    return (
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
                                <div className="spec-table-row">
                                    <span className="spec-key">Display Type</span>
                                    <span className="spec-val">{product.specifications?.['Display Type'] || 'N/A'}</span>
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
                                    <span className="spec-val">
                                        {product?.specifications?.colors
                                            ? parseColorOptions(product.specifications.colors).map(c => c.label).join(', ')
                                            : (colorOptions[selectedColor]?.label || 'N/A')
                                        }
                                    </span>
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
    );
}
