import React, { useState, useRef } from 'react';
import './AddProduct.css';

interface AddProductProps {
    onCancel: () => void;
    onSuccess: () => void;
    initialData?: any; // Product to edit
}

// ... existing helper components ...






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

// Helper Component for Multi-Select Dropdown
const MultiSelectDropdown = ({
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
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    React.useEffect(() => {
        if (value) {
            setSelectedItems(value.split(',').map(item => item.trim()).filter(Boolean));
        } else {
            setSelectedItems([]);
        }
    }, [value]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleItem = (option: string) => {
        let newItems;
        if (selectedItems.includes(option)) {
            newItems = selectedItems.filter(item => item !== option);
        } else {
            newItems = [...selectedItems, option];
        }
        setSelectedItems(newItems);
        onChange({ target: { name, value: newItems.join(', ') } });
    };

    return (
        <div className="custom-combobox" ref={wrapperRef}>
            <div
                className="form-group input"
                style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    minHeight: '42px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    backgroundColor: '#fff'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedItems.length > 0 ? (
                    selectedItems.map((item, idx) => (
                        <span key={idx} style={{
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {item}
                            <i
                                className="fas fa-times"
                                style={{ cursor: 'pointer', fontSize: '0.8em' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(item);
                                }}
                            ></i>
                        </span>
                    ))
                ) : (
                    <span style={{ color: '#9ca3af' }}>{placeholder || 'Select items...'}</span>
                )}
            </div>
            {isOpen && (
                <ul className="combobox-dropdown" style={{ display: 'block' }}>
                    {options.map((option, idx) => (
                        <li
                            key={idx}
                            className={`combobox-item ${selectedItems.includes(option) ? 'active' : ''}`}
                            onClick={() => toggleItem(option)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            {option}
                            {selectedItems.includes(option) && <i className="fas fa-check"></i>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default function AddProduct({ onCancel, onSuccess, initialData }: AddProductProps) {
    const [productType, setProductType] = useState<'system' | 'accessory'>(
        initialData?.type === 'accessory' ? 'accessory' : 'system'
    );

    // Form State
    const [formData, setFormData] = useState({
        // ...
        // (Retaining existing state and logic, just replacing the return block structure for Brand/Processor)

        productName: initialData?.product_name || '',
        productCode: initialData?.product_code || '',
        brand: initialData?.brand || '',
        model: initialData?.model || '',
        series: initialData?.series || '',
        category: initialData?.category || '',
        badge: initialData?.badge || '',
        conditionStatus: initialData?.condition_status || 'New',
        basePrice: initialData?.base_price || 0.00,
        offerPrice: initialData?.offer_price || 0.00,
        stockQuantity: initialData?.stock_quantity || 0,
        processorName: initialData?.processor || '',
        processorGen: initialData?.processor_gen || '',
        processorSpeed: initialData?.processor_speed || '',
        ram: initialData?.ram || '',
        ramType: initialData?.ram_type || '',
        storage: initialData?.storage || '',
        storageType: initialData?.storage_type || '',
        graphicsCard: initialData?.graphics_card || '',
        graphicsType: initialData?.graphics_card_type || '',
        graphicsStorage: initialData?.graphics_storage || '',
        screenSize: initialData?.screen_size || '',
        screenResolution: initialData?.screen_resolution || '',
        screenResolutionPixel: initialData?.screen_resolution_pixel || '',
        wirelessType: initialData?.wireless_type || '',
        operatingSystem: initialData?.operating_system || '',
        opticalDrive: initialData?.optical_drive || '',
        colors: initialData?.colors || '',
        features: initialData?.features || '',
        primaryImageUrl: initialData?.primary_image_url || ''
    });

    // Variants State
    const [ramVariants, setRamVariants] = useState<{ size: string; type: string; price: number }[]>(
        initialData?.ram_variants || []
    );
    const [storageVariants, setStorageVariants] = useState<{ size: string; type: string; price: number }[]>(
        initialData?.storage_variants || []
    );

    // Color Variants State
    const [colorVariants, setColorVariants] = useState<{ label: string; code: string }[]>(() => {
        const initialColors = initialData?.colors || '';
        try {
            if (initialColors && initialColors.trim().startsWith('[')) {
                return JSON.parse(initialColors);
            }
        } catch (e) { console.error('Error parsing colors JSON:', e); }

        // Fallback for simple string
        return initialColors ? initialColors.split(',').map((c: string, idx: number) => ({
            label: c.trim(),
            code: ['#C0C0C0', '#4A4A4A', '#000000', '#FFFFFF'][idx % 4] // Defaults
        })) : [];
    });

    // Color Variant Handlers
    const addColorVariant = () => {
        setColorVariants([...colorVariants, { label: '', code: '#000000' }]);
    };

    const updateColorVariant = (index: number, field: 'label' | 'code', value: string) => {
        const newVariants = [...colorVariants];
        newVariants[index][field] = value;

        // Auto-populate hex code for known colors
        const colorMap: Record<string, string> = {
            'Space Grey': '#535150', 'Silver': '#C0C0C0', 'Black': '#000000', 'White': '#FFFFFF',
            'Gold': '#FFD700', 'Rose Gold': '#B76E79', 'Midnight': '#191970', 'Starlight': '#F0EAD6',
            'Blue': '#0000FF', 'Red': '#FF0000', 'Green': '#008000', 'Purple': '#800080',
            'Yellow': '#FFFF00', 'Orange': '#FFA500', 'Pink': '#FFC0CB', 'Graphite': '#41424C',
            'Sierra Blue': '#9AB5CE', 'Alpine Green': '#505E44'
        };

        if (field === 'label' && colorMap[value]) {
            newVariants[index].code = colorMap[value];
        }

        setColorVariants(newVariants);
    };

    const removeColorVariant = (index: number) => {
        setColorVariants(colorVariants.filter((_, i) => i !== index));
    };

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
    const [previewUrls, setPreviewUrls] = useState<string[]>(
        initialData?.all_images_urls
            ? (Array.isArray(initialData.all_images_urls) ? initialData.all_images_urls : initialData.all_images_urls.split(','))
            : (initialData?.primary_image_url ? [initialData.primary_image_url] : [])
    );
    const [isUploading, setIsUploading] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Unified Status Modal State
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

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
        const targetUrl = previewUrls[index];
        const isNewFile = targetUrl && targetUrl.startsWith('blob:');

        if (isNewFile) {
            let blobIndex = 0;
            for (let i = 0; i < index; i++) {
                if (previewUrls[i].startsWith('blob:')) blobIndex++;
            }
            setFiles(prev => prev.filter((_, i) => i !== blobIndex));
        }

        setPreviewUrls(prev => {
            if (isNewFile) URL.revokeObjectURL(prev[index]);
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
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Upload Failed',
                        message: `Failed to upload ${file.name}`
                    });
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Upload Error',
                    message: `Error uploading ${file.name}`
                });
            }
        }
        return uploadedUrls;
    };

    const executeClear = () => {
        setFormData({
            productName: '',
            productCode: '',
            brand: '',
            model: '',
            series: '',
            category: '',
            badge: '',
            conditionStatus: 'New',
            basePrice: 0.00,
            offerPrice: 0.00,
            stockQuantity: 0,
            processorName: '',
            processorGen: '',
            processorSpeed: '',
            ram: '',
            ramType: '',
            storage: '',
            storageType: '',
            graphicsCard: '',
            graphicsType: '',
            graphicsStorage: '',
            screenSize: '',
            screenResolution: '',
            screenResolutionPixel: '',
            wirelessType: '',
            operatingSystem: '',
            opticalDrive: '',
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
            // 1. Upload Images (Only new ones)
            const newUploadedUrls = await uploadImages();

            // 2. Combine with existing images
            const existingUrls = previewUrls.filter(u => !u.startsWith('blob:'));
            const finalUrls = [...existingUrls, ...newUploadedUrls];

            // 3. Prepare Payload
            const payload = {
                ...formData,
                id: initialData?.id,
                ramVariants,
                storageVariants,
                colors: JSON.stringify(colorVariants), // Save colors as JSON
                type: productType,
                primaryImageUrl: finalUrls.length > 0 ? finalUrls[0] : formData.primaryImageUrl,
                allImagesUrls: finalUrls
            };

            // 4. Save Product (POST or PUT)
            const method = initialData ? 'PUT' : 'POST';
            const response = await fetch('/api/admin/inventory/products', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                if (initialData) {
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        title: 'Success!',
                        message: 'Product updated successfully!',
                        onConfirm: () => onSuccess()
                    });
                } else {
                    setShowSuccessModal(true);
                }
            } else {
                const error = await response.json();
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Error',
                    message: `Failed to ${initialData ? 'update' : 'create'} product: ${error.error}`
                });
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'An error occurred while saving the product.'
            });
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
                    {initialData ? 'Edit' : 'Add New'} {productType === 'system' ? 'Laptop' : 'Accessory'}
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

                {/* Product Images */}
                <div className="form-section">
                    <h3 className="form-section-title">
                        <i className="fas fa-images"></i> Product Images
                    </h3>

                    <div className="form-group">
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
                </div>

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
                            <label>Model</label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="e.g. XPS 9510"
                            />
                        </div>
                        <div className="form-group">
                            <label>Series</label>
                            <input
                                type="text"
                                name="series"
                                value={formData.series}
                                onChange={handleChange}
                                placeholder="e.g. XPS, Latitude, Legion"
                            />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <SearchableDropdown
                                name="category"
                                value={formData.category}
                                onChange={handleChange as any}
                                options={['Renewed Laptops', 'MacBook', 'Accessories', 'Gaming Laptop']}
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

                {/* Processor Section - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="fas fa-microchip"></i> Processor
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Processor Name</label>
                                    <SearchableDropdown
                                        name="processorName"
                                        value={formData.processorName}
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
                                    <label>Processor Generation</label>
                                    <input
                                        type="text"
                                        name="processorGen"
                                        value={formData.processorGen}
                                        onChange={handleChange}
                                        placeholder="e.g. 12th Gen, 13th Gen"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Processor Speed</label>
                                    <input
                                        type="text"
                                        name="processorSpeed"
                                        value={formData.processorSpeed}
                                        onChange={handleChange}
                                        placeholder="e.g. 3.5 GHz"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Memory Section - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="fas fa-memory"></i> Memory (Included)
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Memory Size</label>
                                    <SearchableDropdown
                                        name="ram"
                                        value={formData.ram}
                                        onChange={handleChange as any}
                                        options={['4GB', '8GB', '16GB', '32GB', '64GB', '128GB']}
                                        placeholder="Select RAM Size"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Memory Technology</label>
                                    <SearchableDropdown
                                        name="ramType"
                                        value={formData.ramType as string}
                                        onChange={handleChange as any}
                                        options={['DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'Unified Memory']}
                                        placeholder="Select Technology"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Storage Section - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="fas fa-hdd"></i> Storage (Included)
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Storage Size</label>
                                    <SearchableDropdown
                                        name="storage"
                                        value={formData.storage}
                                        onChange={handleChange as any}
                                        options={['256GB', '512GB', '1TB', '2TB', '4TB', '8TB']}
                                        placeholder="Select Storage Size"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Storage Technology</label>
                                    <SearchableDropdown
                                        name="storageType"
                                        value={formData.storageType as string}
                                        onChange={handleChange as any}
                                        options={['SSD', 'HDD', 'NVMe SSD', 'PCIe SSD', 'SATA SSD']}
                                        placeholder="Select Technology"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Graphics Section - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="fas fa-gamepad"></i> Graphics (GPU)
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Graphics Chipset</label>
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
                                    <label>Graphics Card Type</label>
                                    <SearchableDropdown
                                        name="graphicsType"
                                        value={formData.graphicsType as string}
                                        onChange={handleChange as any}
                                        options={['Integrated', 'Dedicated']}
                                        placeholder="e.g. Dedicated"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Graphics Card Ram Size</label>
                                    <SearchableDropdown
                                        name="graphicsStorage"
                                        value={formData.graphicsStorage}
                                        onChange={handleChange as any}
                                        options={['2GB', '4GB', '6GB', '8GB', '10GB', '12GB', '16GB', '24GB']}
                                        placeholder="Select VRAM"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Display Section - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="fas fa-desktop"></i> Display
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Display Size</label>
                                    <SearchableDropdown
                                        name="screenSize"
                                        value={formData.screenSize}
                                        onChange={handleChange as any}
                                        options={['13-inch', '14-inch', '15.6-inch', '16-inch', '17.3-inch', '24-inch (All-in-One)', '27-inch (All-in-One)']}
                                        placeholder="Select Screen Size"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Screen Resolution</label>
                                    <SearchableDropdown
                                        name="screenResolution"
                                        value={formData.screenResolution}
                                        onChange={handleChange as any}
                                        options={['HD (1366 x 768)', 'FHD (1920 x 1080)', 'QHD (2560 x 1440)', '4K UHD (3840 x 2160)', 'Retina', 'Liquid Retina', 'OLED']}
                                        placeholder="Select Resolution"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Resolution Pixel</label>
                                    <input
                                        type="text"
                                        name="screenResolutionPixel"
                                        value={formData.screenResolutionPixel}
                                        onChange={handleChange}
                                        placeholder="e.g. 1920 x 1080"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }



                {/* Connectivity & OS Section - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="grid grid-cols-2 gap-6 mb-10">
                            {/* Connectivity */}
                            <div className="form-section" style={{ marginBottom: 0 }}>
                                <h3 className="form-section-title">
                                    <i className="fas fa-wifi"></i> Connectivity
                                </h3>
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="form-group">
                                        <label>Wireless Type</label>
                                        <MultiSelectDropdown
                                            name="wirelessType"
                                            value={formData.wirelessType}
                                            onChange={handleChange as any}
                                            options={[
                                                'Wi-Fi 7', 'Wi-Fi 6E', 'Wi-Fi 6', 'Wi-Fi 5',
                                                'Bluetooth 5.4', 'Bluetooth 5.3', 'Bluetooth 5.2', 'Bluetooth 5.1', 'Bluetooth 5.0',
                                                'NFC', '5G', '4G LTE', 'Ethernet (RJ-45)'
                                            ]}
                                            placeholder="Select Wireless Types"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Operating System */}
                            <div className="form-section" style={{ marginBottom: 0 }}>
                                <h3 className="form-section-title">
                                    <i className="fab fa-windows"></i> Operating System
                                </h3>
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="form-group">
                                        <label>Operating System</label>
                                        <SearchableDropdown
                                            name="operatingSystem"
                                            value={formData.operatingSystem}
                                            onChange={handleChange as any}
                                            options={['Windows 11 Home', 'Windows 11 Pro', 'Windows 10 Home', 'Windows 10 Pro', 'macOS', 'Chrome OS', 'Linux', 'Ubuntu', 'DOS']}
                                            placeholder="Select OS"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Others Information Section - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="fas fa-list"></i> Others Information
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Condition / Grade</label>
                                    <SearchableDropdown
                                        name="conditionStatus"
                                        value={formData.conditionStatus}
                                        onChange={handleChange as any}
                                        options={['New', 'Open Box', 'Refurbished (Grade A)', 'Refurbished (Grade B)', 'Refurbished (Grade C)', 'Used']}
                                        placeholder="Select Condition/Grade"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Optical Drive Type</label>
                                    <SearchableDropdown
                                        name="opticalDrive"
                                        value={formData.opticalDrive as string} // Assuming new field string
                                        onChange={handleChange as any}
                                        options={['None', 'DVD-RW', 'Blu-ray', 'CD-ROM']}
                                        placeholder="Select Drive Type"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Specs - Only for Systems */}
                {
                    productType === 'system' && (
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="fas fa-microchip"></i> Tech Specifications
                            </h3>
                            <div className="form-grid">
                                {/* Processor, Memory, Storage, Graphics, Display, Colors moved to their own sections */}
                                <div className="form-group">
                                    <label>Other Features</label>
                                    <textarea
                                        name="features"
                                        value={formData.features}
                                        onChange={handleChange}
                                        placeholder="Enter other features or specifications..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Variants - Only for Systems */}
                {
                    productType === 'system' && (
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

                            {/* Color Variants */}
                            <div className="variant-group">
                                <h4>Color Variants</h4>

                                {colorVariants.map((variant, idx) => (
                                    <div key={idx} className="variant-input-row relative">
                                        <div className="form-group">
                                            <label>Color Name</label>

                                            <SearchableDropdown
                                                name={`colorLabel-${idx}`}
                                                value={variant.label}
                                                onChange={(e) => updateColorVariant(idx, 'label', e.target.value)}
                                                options={[
                                                    'Space Grey', 'Silver', 'Black', 'White', 'Gold', 'Rose Gold',
                                                    'Midnight', 'Starlight', 'Blue', 'Red', 'Green', 'Purple',
                                                    'Yellow', 'Orange', 'Pink', 'Graphite', 'Sierra Blue', 'Alpine Green'
                                                ]}
                                                placeholder="Select or Type Color"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Color Code</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input
                                                    type="color"
                                                    value={variant.code}
                                                    onChange={(e) => updateColorVariant(idx, 'code', e.target.value)}
                                                    style={{ width: '42px', height: '42px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={variant.code}
                                                    onChange={(e) => updateColorVariant(idx, 'code', e.target.value)}
                                                    placeholder="#000000"
                                                    style={{ flex: 1 }}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ opacity: 0 }}>
                                            <label>Placeholder</label>
                                            <input disabled />
                                        </div>
                                        <div className="form-group">
                                            <label>&nbsp;</label>
                                            <button
                                                type="button"
                                                className="variant-remove-btn"
                                                title="Remove Variant"
                                                onClick={() => removeColorVariant(idx)}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button type="button" className="add-variant-btn" onClick={addColorVariant}>
                                    <i className="fas fa-plus"></i>
                                    {colorVariants.length > 0 ? "Add Another Color" : "Add Color Variant"}
                                </button>
                            </div>
                        </div>
                    )
                }



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
                {
                    showClearConfirm && (
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
                    )
                }

                {/* Success Modal */}
                {
                    showSuccessModal && (
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
                    )
                }

                {/* Unified Status Modal (Error / Custom Success) */}
                {
                    statusModal.isOpen && (
                        <div className="modal-overlay" onClick={() => !statusModal.type.includes('error') && setStatusModal(prev => ({ ...prev, isOpen: false }))}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <div className={`modal-icon ${statusModal.type === 'success' ? 'success' : ''}`}
                                    style={statusModal.type === 'error' ? { background: '#fee2e2', color: '#ef4444' } : {}}>
                                    <i className={`fas ${statusModal.type === 'success' ? 'fa-check' : 'fa-times'}`}></i>
                                </div>
                                <h3 className="modal-title">{statusModal.title}</h3>
                                <p className="modal-message">
                                    {statusModal.message}
                                </p>
                                <div className="modal-actions">
                                    <button
                                        className={statusModal.type === 'success' ? "btn-confirm-success" : "btn-confirm-danger"}
                                        onClick={() => {
                                            setStatusModal(prev => ({ ...prev, isOpen: false }));
                                            if (statusModal.onConfirm) statusModal.onConfirm();
                                        }}
                                    >
                                        {statusModal.type === 'success' ? 'OK' : 'Close'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </form >
        </div >
    );
}
