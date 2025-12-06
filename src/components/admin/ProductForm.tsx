import React, { useState, useEffect } from "react";
import "./product-form.css";

interface ProductFormProps {
    type: "laptop" | "accessory";
    editItem: any | null;
    onSave: () => void;
    onCancel: () => void;
}

export default function ProductForm({
    type,
    editItem,
    onSave,
    onCancel,
}: ProductFormProps) {
    const [activeTab, setActiveTab] = useState("basic");
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Main Form Data
    const [formData, setFormData] = useState<any>({
        name: "",
        category: "",
        badge: "New",
        price: "",
        offerPrice: "",
        stock: "",
        description: "",
        // Tech Specs (Mapped to DB columns)
        screen: "",
        resolution: "", // Merged into screen on save
        panelType: "",  // Merged into screen on save
        refreshRate: "", // Merged into screen on save
        processor: "",
        graphics: "",
        ram: "",
        storage: "",
        // Features
        shippingInfo: "",
        warrantyInfo: "",
        returnPolicy: "",
        // Collections
        images: [],
        colors: "",
    });

    // Configuration Lists (UI State)
    // In a real variant system, these would be complex objects.
    // Here we use them to build the strings for the legacy string columns or just for UI show.
    const [processorOptions, setProcessorOptions] = useState<any[]>([]);
    const [ramOptions, setRamOptions] = useState<any[]>([]);
    const [storageOptions, setStorageOptions] = useState<any[]>([]);
    const [colorOptions, setColorOptions] = useState<any[]>([]);

    // Dropdown Options State
    const [categories, setCategories] = useState(['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Razer', 'Samsung', 'LG', 'Other']);
    const [badges, setBadges] = useState(['New', 'Refurbished', 'Best Seller', 'On Sale', 'Featured']);
    const [screens, setScreens] = useState(['13.3 inches', '14 inches', '15.6 inches', '16 inches', '17.3 inches']);
    const [resolutions, setResolutions] = useState(['1920 x 1080 (FHD)', '2560 x 1440 (QHD)', '3840 x 2160 (4K UHD)', '1366 x 768 (HD)']);
    const [panelTypes, setPanelTypes] = useState(['IPS', 'OLED', 'TN', 'VA', 'Mini-LED']);
    const [refreshRates, setRefreshRates] = useState(['60Hz', '90Hz', '120Hz', '144Hz', '165Hz', '240Hz', '360Hz']);
    const [processors, setProcessors] = useState(['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2']);
    const [graphicsCards, setGraphicsCards] = useState(['Integrated Graphics', 'NVIDIA GeForce RTX 3050', 'NVIDIA GeForce RTX 3060', 'NVIDIA GeForce RTX 4050', 'NVIDIA GeForce RTX 4060']);
    const [ramSizes, setRamSizes] = useState(['8GB', '16GB', '32GB', '64GB', '128GB']);
    const [storageSizes, setStorageSizes] = useState(['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD']);
    const [shippingInfos, setShippingInfos] = useState(['Free Shipping - Delivery in 2-3 days', 'Standard Shipping - 3-5 Business Days']);
    const [warrantyInfos, setWarrantyInfos] = useState(['1-Year Standard Warranty', '2-Year Extended Warranty', '3-Year Premium Support']);
    const [returnPolicies, setReturnPolicies] = useState(['30-Day Returns', '14-Day Returns', 'No Returns']);

    useEffect(() => {
        if (editItem) {
            setFormData({
                ...editItem,
                price: editItem.price || "",
                offerPrice: editItem.offer_price || editItem.offerPrice || "",
                stock: editItem.stock || "",
                description: editItem.about || editItem.description || "",
                // Try to parse specs if they were merged? For now just direct map
                screen: editItem.screen || "",
                processor: editItem.processor || "",
                graphics: editItem.graphics || "",
                ram: editItem.ram || "",
                storage: editItem.storage || "",
                colors: editItem.colors || "",
                images: editItem.images || (editItem.image ? [editItem.image] : [])
            });

            if (editItem.images) setPreviewImages(editItem.images);
            else if (editItem.image) setPreviewImages([editItem.image]);

            // Attempt to populate lists from comma strings if basic data exists
            if (editItem.colors) {
                const cols = editItem.colors.split(',').map((c: string, i: number) => ({
                    id: `col_${i}`, label: c.trim(), value: c.trim()
                }));
                setColorOptions(cols);
            }
        }
    }, [editItem]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploadingImages(true);
        const fileArray = Array.from(files);
        const newUrls: string[] = [];

        try {
            for (const file of fileArray) {
                if (file.size > 5 * 1024 * 1024) continue; // Skip huge files

                const response = await uploadToImageKit(file);
                if (response) newUrls.push(response);
            }

            if (newUrls.length > 0) {
                const updatedImages = [...previewImages, ...newUrls].slice(0, 5);
                setPreviewImages(updatedImages);
                setFormData((prev: any) => ({ ...prev, images: updatedImages }));
            }
        } catch (error) {
            console.error(error);
            alert("Upload failed");
        } finally {
            setUploadingImages(false);
        }
    };

    const uploadToImageKit = async (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = ev.target?.result as string;
                try {
                    const res = await fetch('/api/imagekit/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file: base64, fileName: file.name, folder: 'products' })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        resolve(data.url);
                    } else resolve(null);
                } catch { resolve(null); }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async () => {
        // Construct final object
        const finalProduct = {
            ...formData,
            type,
            price: parseFloat(formData.price) || 0,
            offer_price: parseFloat(formData.offerPrice) || 0,
            stock: parseInt(formData.stock) || 0,
            // Logic to merge fields if needed, e.g. screen info
            screen: formData.screen + (formData.resolution ? `, ${formData.resolution}` : "") + (formData.refreshRate ? `, ${formData.refreshRate}` : ""),
            // Map colors from options list if changed, else use string
            colors: colorOptions.length > 0 ? colorOptions.map(c => c.label).join(', ') : formData.colors,
            // Use date if new
            date_added: editItem ? editItem.date_added : new Date().toISOString().split("T")[0],
            // Ensure Image legacy field is populated
            image: previewImages[0] || "",
            // Features field hacking for now
            feature: `${formData.shippingInfo}|${formData.warrantyInfo}|${formData.returnPolicy}`
        };

        const method = editItem ? 'PUT' : 'POST';
        const res = await fetch('/api/products', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...finalProduct, code: editItem?.code }) // Generate code in backend or generate here if new
        });

        if (res.ok) onSave();
        else alert("Failed to save product");
    };

    const renderCreatableSelect = (label: string, name: string, options: string[], setOptions: React.Dispatch<React.SetStateAction<string[]>>) => (
        <div className="form-group">
            <label>{label}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                >
                    <option value="">Select {label}</option>
                    {options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => {
                        const newVal = prompt(`Add new ${label}:`);
                        if (newVal) {
                            setOptions(prev => [...prev, newVal]);
                            setFormData((prev: any) => ({ ...prev, [name]: newVal }));
                        }
                    }}
                    className="btn-add-small"
                    title="Add Option"
                >
                    +
                </button>
            </div>
        </div>
    );

    // --- RENDER HELPERS ---

    const renderBasicInfo = () => (
        <div className="form-card">
            <h4 className="card-section-title">Basic Information</h4>
            <div className="form-group">
                <label>Product Name *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., UltraBook Pro 15"
                />
            </div>
            <div className="form-group">
                <label>Product Description *</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter detailed product description..."
                />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Base Price ($) *</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="1299.99"
                    />
                </div>
                <div className="form-group">
                    <label>Sale Price ($)</label>
                    <input
                        type="number"
                        name="offerPrice"
                        value={formData.offerPrice}
                        onChange={handleChange}
                        placeholder="1099.99"
                    />
                </div>
            </div>
            <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                />
            </div>
            <div className="form-row">
                {renderCreatableSelect("Category *", "category", categories, setCategories)}
                {renderCreatableSelect("Badge Type", "badge", badges, setBadges)}
            </div>

            <h4 className="card-section-title" style={{ marginTop: "2rem" }}>Product Images</h4>
            <div
                className="image-dropzone"
                onClick={() => document.getElementById('img-upload')?.click()}
            >
                <input
                    id="img-upload"
                    type="file"
                    multiple
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <div className="dropzone-icon">
                    <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <div className="dropzone-text">Click to upload or drag and drop</div>
                <div className="dropzone-hint">PNG, JPG up to 5MB (Recommended: 1000x1000px)</div>
            </div>
            {previewImages.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', overflowX: 'auto' }}>
                    {previewImages.map((src, i) => (
                        <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                            <img
                                src={src}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); setPreviewImages(prev => prev.filter((_, idx) => idx !== i)); }}
                                style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', border: 'none', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderConfigurations = () => (
        <div className="form-card">
            {/* Processor Config */}
            <div className="config-group">
                <div className="config-header">
                    <h4>Processor Options</h4>
                    <button type="button" className="btn-add-option" onClick={() => {
                        const label = prompt("Enter Processor Name (e.g. Intel Core i5):");
                        if (label) setProcessorOptions([...processorOptions, { label, id: label.toLowerCase().replace(/ /g, '-'), price: 0 }]);
                    }}>
                        <i className="fas fa-plus"></i> Add Processor
                    </button>
                </div>
                {processorOptions.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No options added. Will use basic spec.</p>}
                {processorOptions.map((opt, i) => (
                    <div key={i} className="config-item">
                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Label</label>
                                <input type="text" value={opt.label} readOnly />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Additional Price</label>
                                <input type="number" placeholder="0" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* RAM Config */}
            <div className="config-group">
                <div className="config-header">
                    <h4>Memory (RAM) Options</h4>
                    <button type="button" className="btn-add-option" onClick={() => {
                        const label = prompt("Enter RAM (e.g. 16GB DDR4):");
                        if (label) setRamOptions([...ramOptions, { label, id: label.toLowerCase().replace(/ /g, '-'), price: 0 }]);
                    }}>
                        <i className="fas fa-plus"></i> Add RAM
                    </button>
                </div>
                {ramOptions.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No options added. Will use basic spec.</p>}
                {ramOptions.map((opt, i) => (
                    <div key={i} className="config-item">
                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Label</label>
                                <input type="text" value={opt.label} readOnly />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Color Config */}
            <div className="config-group">
                <div className="config-header">
                    <h4>Color Options</h4>
                    <button type="button" className="btn-add-option" onClick={() => {
                        const label = prompt("Enter Color Name (e.g. Silver):");
                        if (label) setColorOptions([...colorOptions, { label, id: label.toLowerCase(), code: '#cccccc' }]);
                    }}>
                        <i className="fas fa-plus"></i> Add Color
                    </button>
                </div>
                {colorOptions.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No colors added.</p>}
                {colorOptions.map((opt, i) => (
                    <div key={i} className="config-item">
                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Label</label>
                                <input type="text" value={opt.label} onChange={(e) => {
                                    const newCols = [...colorOptions];
                                    newCols[i].label = e.target.value;
                                    setColorOptions(newCols);
                                }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Color Code</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" className="color-preview" value={opt.code || "#cccccc"} onChange={(e) => {
                                        const newCols = [...colorOptions];
                                        newCols[i].code = e.target.value;
                                        setColorOptions(newCols);
                                    }} />
                                    <input type="text" value={opt.code || ""} placeholder="#Hex" readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSpecifications = () => (
        <div className="form-card">
            <h4 className="card-section-title">Technical Specifications</h4>

            <h5 className="specs-section-title">Display</h5>
            <div className="specs-grid">
                {renderCreatableSelect("Screen Size", "screen", screens, setScreens)}
                {renderCreatableSelect("Resolution", "resolution", resolutions, setResolutions)}
                {renderCreatableSelect("Panel Type", "panelType", panelTypes, setPanelTypes)}
                {renderCreatableSelect("Refresh Rate", "refreshRate", refreshRates, setRefreshRates)}
            </div>

            <h5 className="specs-section-title">Performance</h5>
            <div className="specs-grid">
                {renderCreatableSelect("Processor", "processor", processors, setProcessors)}
                {renderCreatableSelect("Graphics", "graphics", graphicsCards, setGraphicsCards)}
                {renderCreatableSelect("Memory", "ram", ramSizes, setRamSizes)}
                {renderCreatableSelect("Storage", "storage", storageSizes, setStorageSizes)}
            </div>
        </div>
    );

    const renderFeatures = () => (
        <div className="form-card">
            <h4 className="card-section-title">Product Features & Benefits</h4>
            {renderCreatableSelect("Shipping Information", "shippingInfo", shippingInfos, setShippingInfos)}
            {renderCreatableSelect("Warranty Information", "warrantyInfo", warrantyInfos, setWarrantyInfos)}
            {renderCreatableSelect("Return Policy", "returnPolicy", returnPolicies, setReturnPolicies)}
        </div>
    );

    return (
        <div className="product-form-container">
            <div className="form-header">
                <h2>{editItem ? "Edit Product" : `Add New ${type === 'laptop' ? 'Laptop' : 'Accessory'} Product`}</h2>
                <p>Enter all product details, configurations, and specifications</p>
            </div>

            <div className="form-tabs">
                <button
                    className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    Basic Info
                </button>
                <button
                    className={`tab-btn ${activeTab === 'configurations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('configurations')}
                >
                    Configurations
                </button>
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
            </div>

            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'configurations' && renderConfigurations()}
            {activeTab === 'specifications' && renderSpecifications()}
            {activeTab === 'features' && renderFeatures()}

            <div className="form-actions">
                <button className="btn-cancel" onClick={onCancel}>Cancel</button>

                {activeTab === 'features' ? (
                    <button className="btn-save" onClick={handleSubmit}>
                        <i className="fas fa-save"></i> Save Product
                    </button>
                ) : (
                    <button className="btn-save" onClick={() => {
                        if (activeTab === 'basic') setActiveTab('configurations');
                        else if (activeTab === 'configurations') setActiveTab('specifications');
                        else if (activeTab === 'specifications') setActiveTab('features');
                    }}>
                        Next Page <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                    </button>
                )}
            </div>
        </div>
    );
}
