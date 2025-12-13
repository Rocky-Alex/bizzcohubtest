import React, { useState, useRef } from 'react';
import './AddProduct.css';

interface AddProductProps {
    onCancel: () => void;
    onSuccess: () => void;
}

// Helper Component for Searchable Dropdown
const SearchableDropdown = ({
    name,
    value,
    onChange,
    options,
    placeholder
}: {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: string[];
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setFilteredOptions(
            options.filter(opt =>
                opt.toLowerCase().includes(value.toLowerCase())
            )
        );
    }, [value, options]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange({ target: { name, value: option } });
        setIsOpen(false);
    };

    return (
        <div className="custom-combobox" ref={wrapperRef}>
            <input
                type="text"
                name={name}
                value={value}
                onChange={(e) => {
                    onChange(e);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                autoComplete="off"
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul className="combobox-dropdown">
                    {filteredOptions.map((option, idx) => (
                        <li
                            key={idx}
                            className="combobox-item"
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default function AddProduct({ onCancel, onSuccess }: AddProductProps) {
    const [productType, setProductType] = useState<'system' | 'accessory'>('system');

    // Form State
    const [formData, setFormData] = useState({
        // ...
        // (Retaining existing state and logic, just replacing the return block structure for Brand/Processor)

        productName: '',
        productCode: '',
        brand: '',
        category: '',
        badge: '',
        conditionStatus: 'New',
        basePrice: 0.00,
        offerPrice: 0.00,
        stockQuantity: 0,
        processor: '',
        ram: '',
        storage: '',
        graphicsCard: '',
        graphicsStorage: '',
        screenSize: '',
        colors: '',
        features: '',
        primaryImageUrl: ''
    });

    // Variants State
    const [ramVariants, setRamVariants] = useState<{ size: string; type: string; price: number }[]>([]);
    const [storageVariants, setStorageVariants] = useState<{ size: string; type: string; price: number }[]>([]);

    // RAM Variant Handlers
    const addRamVariant = () => {
        setRamVariants([...ramVariants, { size: '', type: '', price: 0 }]);
    };

    const updateRamVariant = (index: number, field: string, value: any) => {
        const newVariants = [...ramVariants];
        // @ts-ignore
        newVariants[index][field] = value;
        setRamVariants(newVariants);
    };

    const removeRamVariant = (index: number) => {
        setRamVariants(ramVariants.filter((_, i) => i !== index));
    };

    // Storage Variant Handlers
    const addStorageVariant = () => {
        setStorageVariants([...storageVariants, { size: '', type: '', price: 0 }]);
    };

    const updateStorageVariant = (index: number, field: string, value: any) => {
        const newVariants = [...storageVariants];
        // @ts-ignore
        newVariants[index][field] = value;
        setStorageVariants(newVariants);
    };

    const removeStorageVariant = (index: number) => {
        setStorageVariants(storageVariants.filter((_, i) => i !== index));
    };

    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['basePrice', 'offerPrice', 'stockQuantity'].includes(name) ? parseFloat(value) || 0 : value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            // Revoke object URL to avoid memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadImages = async () => {
        const uploadedUrls: string[] = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'Products');
            formData.append('fileName', file.name.replace(/\s+/g, '_'));

            try {
                const response = await fetch('/api/imagekit/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    uploadedUrls.push(data.url);
                } else {
                    console.error('Failed to upload image:', file.name);
                    alert(`Failed to upload ${file.name}`);
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert(`Error uploading ${file.name}`);
            }
        }
        return uploadedUrls;
    };

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const executeClear = () => {
        setFormData({
            productName: '',
            productCode: '',
            brand: '',
            category: '',
            badge: '',
            conditionStatus: 'New',
            basePrice: 0.00,
            offerPrice: 0.00,
            stockQuantity: 0,
            processor: '',
            ram: '',
            storage: '',
            graphicsCard: '',
            graphicsStorage: '',
            screenSize: '',
            colors: '',
            features: '',
            primaryImageUrl: ''
        });
        setFiles([]);
        setPreviewUrls([]);
        setRamVariants([]);
        setStorageVariants([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setProductType('system');
        setShowClearConfirm(false); // Close modal
    };

    const requestClear = () => {
        setShowClearConfirm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            // 1. Upload Images First
            const uploadedImageUrls = await uploadImages();

            // If user selected files but upload failed completely, warn them
            if (files.length > 0 && uploadedImageUrls.length === 0) {
                setIsUploading(false);
                alert('Failed to upload images. Please try again.');
                return;
            }

            // 2. Prepare Payload
            const payload = {
                ...formData,
                ramVariants,
                storageVariants,
                primaryImageUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : formData.primaryImageUrl,
                allImagesUrls: uploadedImageUrls // Send all URLs to API
            };

            // 3. Save Product
            const response = await fetch('/api/admin/inventory/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowSuccessModal(true);
                // onSuccess will be called when user closes modal
            } else {
                const error = await response.json();
                alert('Failed to create product: ' + error.error);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            alert('An error occurred while creating the product.');
        } finally {
            setIsUploading(false);
        }
    };

    // Cleanup URLs on unmount
    React.useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    return (
        <div className="add-product-container">
            <div className="add-product-header">
                <h2>
                    <i className={productType === 'system' ? "fas fa-laptop" : "fas fa-headphones"}></i>
                    {productType === 'system' ? 'Add New Laptop' : 'Add New Accessory'}
                </h2>
                <div className="product-type-toggle">
                    <button
                        type="button"
                        className={`type-btn ${productType === 'system' ? 'active' : ''}`}
                        onClick={() => setProductType('system')}
                    >
                        Laptop
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${productType === 'accessory' ? 'active' : ''}`}
                        onClick={() => setProductType('accessory')}
                    >
                        Accessory
                    </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    <i className="fas fa-times"></i> Close
                </button>
            </div>

            <form onSubmit={handleSubmit}>

                {/* Basic Info */}
                <div className="form-section">
                    <h3 className="form-section-title">
                        <i className="fas fa-info-circle"></i> Basic Information
                    </h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Product Name *</label>
                            <input
                                type="text"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Dell XPS 15"
                            />
                        </div>
                        {/* Product Code is auto-generated on server */}
                        <div className="form-group">
                            <label>Brand</label>
                            <SearchableDropdown
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange as any}
                                options={['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Razer', 'MSI', 'Samsung', 'Sony']}
                                placeholder="e.g. Dell, HP, Apple"
                            />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <SearchableDropdown
                                name="category"
                                value={formData.category}
                                onChange={handleChange as any}
                                options={['Laptop', 'Mac', 'Gaming Laptop', 'Accessories', 'Monitor', 'Component']}
                                placeholder="Select Category"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Stock */}
                <div className="form-section">
                    <h3 className="form-section-title">
                        <i className="fas fa-tag"></i> Pricing & Inventory
                    </h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Base Price (AED)</label>
                            <div className="input-with-icon">
                                <span className="currency-symbol">AED</span>
                                <input
                                    type="number"
                                    name="basePrice"
                                    value={formData.basePrice}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Offer Price (AED)</label>
                            <div className="input-with-icon">
                                <span className="currency-symbol">AED</span>
                                <input
                                    type="number"
                                    name="offerPrice"
                                    value={formData.offerPrice}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Discount %</label>
                            <input
                                type="text"
                                disabled
                                value={formData.basePrice > 0 ? Math.round(((formData.basePrice - formData.offerPrice) / formData.basePrice) * 100) + '%' : '0%'}
                                className="bg-gray-100"
                            />
                        </div>
                        <div className="form-group">
                            <label>Stock Quantity</label>
                            <input
                                type="number"
                                name="stockQuantity"
                                value={formData.stockQuantity}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Condition</label>
                            <SearchableDropdown
                                name="conditionStatus"
                                value={formData.conditionStatus}
                                onChange={handleChange as any}
                                options={['New', 'Refurbished', 'Used']}
                                placeholder="Select Condition"
                            />
                        </div>
                        <div className="form-group">
                            <label>Badge</label>
                            <SearchableDropdown
                                name="badge"
                                value={formData.badge}
                                onChange={handleChange as any}
                                options={['Best Seller', 'New Arrival', 'Limited Offer']}
                                placeholder="Select Badge"
                            />
                        </div>
                    </div>
                </div>

                {/* Specs - Only for Systems */}
                {productType === 'system' && (
                    <div className="form-section">
                        <h3 className="form-section-title">
                            <i className="fas fa-microchip"></i> Tech Specifications
                        </h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Processor</label>
                                <SearchableDropdown
                                    name="processor"
                                    value={formData.processor}
                                    onChange={handleChange as any}
                                    options={[
                                        'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
                                        'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
                                        'Apple M1', 'Apple M2', 'Apple M3', 'Apple M1 Pro', 'Apple M1 Max',
                                        'Apple M2 Pro', 'Apple M2 Max', 'Apple M3 Pro', 'Apple M3 Max'
                                    ]}
                                    placeholder="e.g. Intel Core i7"
                                />
                            </div>
                            <div className="form-group">
                                <label>RAM (Included)</label>
                                <SearchableDropdown
                                    name="ram"
                                    value={formData.ram}
                                    onChange={handleChange as any}
                                    options={['4GB', '8GB', '16GB', '32GB', '64GB', '128GB']}
                                    placeholder="Select RAM"
                                />
                            </div>
                            <div className="form-group">
                                <label>Storage (Included)</label>
                                <SearchableDropdown
                                    name="storage"
                                    value={formData.storage}
                                    onChange={handleChange as any}
                                    options={['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '4TB SSD', '1TB HDD']}
                                    placeholder="Select Storage"
                                />
                            </div>
                            <div className="form-group">
                                <label>Graphics Card Name (Optional)</label>
                                <SearchableDropdown
                                    name="graphicsCard"
                                    value={formData.graphicsCard}
                                    onChange={handleChange as any}
                                    options={[
                                        'Integrated Graphics',
                                        'Shared Graphics',
                                        'Intel Iris Xe Graphics',
                                        'Intel UHD Graphics',
                                        'NVIDIA GeForce RTX 2050',
                                        'NVIDIA GeForce RTX 3050',
                                        'NVIDIA GeForce RTX 3060',
                                        'NVIDIA GeForce RTX 4050',
                                        'NVIDIA GeForce RTX 4060',
                                        'NVIDIA GeForce RTX 4070',
                                        'NVIDIA GeForce RTX 4080',
                                        'NVIDIA GeForce RTX 4090'
                                    ]}
                                    placeholder="e.g. NVIDIA RTX 3050"
                                />
                            </div>
                            <div className="form-group">
                                <label>Graphics Memory (Optional)</label>
                                <SearchableDropdown
                                    name="graphicsStorage"
                                    value={formData.graphicsStorage}
                                    onChange={handleChange as any}
                                    options={['2GB', '4GB', '6GB', '8GB', '10GB', '12GB', '16GB', '24GB']}
                                    placeholder="Select VRAM"
                                />
                            </div>
                            <div className="form-group">
                                <label>Screen Size</label>
                                <SearchableDropdown
                                    name="screenSize"
                                    value={formData.screenSize}
                                    onChange={handleChange as any}
                                    options={['13-inch', '14-inch', '15.6-inch', '16-inch', '17.3-inch', '24-inch (All-in-One)', '27-inch (All-in-One)']}
                                    placeholder="Select Screen Size"
                                />
                            </div>
                            <div className="form-group">
                                <label>Colors</label>
                                <input
                                    type="text"
                                    name="colors"
                                    value={formData.colors}
                                    onChange={handleChange}
                                    placeholder="e.g. Silver, Space Grey"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Variants - Only for Systems */}
                {productType === 'system' && (
                    <div className="form-section">
                        <h3 className="form-section-title">
                            <i className="fas fa-layer-group"></i> Configuration Variants
                        </h3>

                        {/* RAM Variants */}
                        <div className="variant-group">
                            <h4>RAM Variants</h4>

                            {ramVariants.map((variant, idx) => (
                                <div key={idx} className="variant-input-row relative">
                                    <div className="form-group">
                                        <label>RAM Size</label>
                                        <SearchableDropdown
                                            name={`ramSize-${idx}`}
                                            value={variant.size}
                                            onChange={(e) => updateRamVariant(idx, 'size', e.target.value)}
                                            options={['4GB', '8GB', '16GB', '32GB', '64GB', '128GB']}
                                            placeholder="Size"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>RAM Type</label>
                                        <SearchableDropdown
                                            name={`ramType-${idx}`}
                                            value={variant.type}
                                            onChange={(e) => updateRamVariant(idx, 'type', e.target.value)}
                                            options={['DDR4', 'DDR5', 'LPDDR4', 'LPDDR4X', 'LPDDR5', 'LPDDR5X', 'Unified Memory']}
                                            placeholder="Type"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Variant Price (AED)</label>
                                        <input
                                            type="number"
                                            value={variant.price || ''}
                                            onChange={(e) => updateRamVariant(idx, 'price', parseFloat(e.target.value))}
                                            placeholder="Price"
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>&nbsp;</label>
                                        <button
                                            type="button"
                                            className="variant-remove-btn"
                                            title="Remove Variant"
                                            onClick={() => removeRamVariant(idx)}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button type="button" className="add-variant-btn" onClick={addRamVariant}>
                                <i className="fas fa-plus"></i>
                                {ramVariants.length > 0 ? "Add Another RAM Variant" : "Add RAM Variant"}
                            </button>
                        </div>

                        {/* Storage Variants */}
                        <div className="variant-group">
                            <h4>Storage Variants</h4>

                            {storageVariants.map((variant, idx) => (
                                <div key={idx} className="variant-input-row relative">
                                    <div className="form-group">
                                        <label>Storage Size</label>
                                        <SearchableDropdown
                                            name={`storageSize-${idx}`}
                                            value={variant.size}
                                            onChange={(e) => updateStorageVariant(idx, 'size', e.target.value)}
                                            options={['256GB', '512GB', '1TB', '2TB', '4TB', '8TB']}
                                            placeholder="Size"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Storage Type</label>
                                        <SearchableDropdown
                                            name={`storageType-${idx}`}
                                            value={variant.type}
                                            onChange={(e) => updateStorageVariant(idx, 'type', e.target.value)}
                                            options={['SSD', 'HDD', 'NVMe SSD', 'M.2 SSD', 'SATA SSD']}
                                            placeholder="Type"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Variant Price (AED)</label>
                                        <input
                                            type="number"
                                            value={variant.price || ''}
                                            onChange={(e) => updateStorageVariant(idx, 'price', parseFloat(e.target.value))}
                                            placeholder="Price"
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>&nbsp;</label>
                                        <button
                                            type="button"
                                            className="variant-remove-btn"
                                            title="Remove Variant"
                                            onClick={() => removeStorageVariant(idx)}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button type="button" className="add-variant-btn" onClick={addStorageVariant}>
                                <i className="fas fa-plus"></i>
                                {storageVariants.length > 0 ? "Add Another Storage Variant" : "Add Storage Variant"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Media Upload */}
                <div className="form-section">
                    <h3 className="form-section-title">
                        <i className="fas fa-images"></i> Media & Details
                    </h3>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Product Images (First Image is Primary)</label>
                        <div
                            className="image-upload-area"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <i className="fas fa-cloud-upload-alt"></i>
                            <p>Click to upload images</p>
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Supports .jpg, .png, .webp</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                        />

                        {previewUrls.length > 0 && (
                            <div className="image-previews">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="image-preview-card">
                                        <img src={url} alt={`Preview ${index}`} />
                                        {index === 0 && <span className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-br-md z-10 font-medium">Main</span>}
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeFile(index)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Key Features / Description</label>
                        <textarea
                            name="features"
                            value={formData.features}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Detailed description of the product..."
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-clear" onClick={requestClear}>
                        <i className="fas fa-trash-alt"></i> Clear Form
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                        ) : (
                            <><i className="fas fa-save"></i> Save Product</>
                        )}
                    </button>
                </div>

                {/* Custom Confirmation Modal */}
                {showClearConfirm && (
                    <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-icon">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3 className="modal-title">Clear Form?</h3>
                            <p className="modal-message">
                                Are you sure you want to clear all data? This action cannot be undone.
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="btn-cancel-modal"
                                    onClick={() => setShowClearConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-confirm-danger"
                                    onClick={executeClear}
                                >
                                    Yes, Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-icon success">
                                <i className="fas fa-check"></i>
                            </div>
                            <h3 className="modal-title">Success!</h3>
                            <p className="modal-message">
                                Product has been created successfully.
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="btn-confirm-success"
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        onSuccess();
                                    }}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
