import React, { useState, useEffect } from "react";

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
    const [formData, setFormData] = useState<any>({
        name: "",
        category: "",
        customCategory: "",
        badge: "",
        actualPrice: "",
        offerPrice: "",
        quantity: "",
        image: "",
        // Laptop specific
        processor: "",
        ram: "",
        customRam: "",
        storage: "",
        customStorage: "",
        screen: "",
        customScreen: "",
        graphics: "",
        customGraphics: "",
        graphicsStorage: "",
        customGraphicsStorage: "",
        feature: "",
        // Accessory specific
        about: "",
        features: "",
    });

    const [previewImage, setPreviewImage] = useState<string>("");

    useEffect(() => {
        if (editItem) {
            setFormData(editItem);
            setPreviewImage(editItem.image);
        } else {
            // Reset form
            setFormData({
                name: "",
                category: "",
                customCategory: "",
                badge: "",
                actualPrice: "",
                offerPrice: "",
                quantity: "",
                image: "",
                processor: "",
                ram: "",
                customRam: "",
                storage: "",
                customStorage: "",
                screen: "",
                customScreen: "",
                graphics: "",
                customGraphics: "",
                graphicsStorage: "",
                customGraphicsStorage: "",
                feature: "",
                about: "",
                features: "",
            });
            setPreviewImage("");
        }
    }, [editItem]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("⚠️ Image size must be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                setPreviewImage(result);
                setFormData((prev: any) => ({ ...prev, image: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const generateProductCode = async (category: string) => {
        try {
            const response = await fetch('/api/products');
            const type = editItem ? editItem.type : (formData.type || "laptop");
            let products: any[] = [];

            if (response.ok) {
                const data = await response.json();
                products = data.products.filter((p: any) => p.type === type);
            } else {
                // Fallback to localStorage
                const storageKey = type === "laptop" ? "bchLaptops" : "bchAccessories";
                products = JSON.parse(localStorage.getItem(storageKey) || "[]");
            }

            // Simple prefix: LP for laptops, AC for accessories
            const prefix = type === "laptop" ? "LP" : "AC";

            // Find the highest existing number for this type
            let maxNumber = 999; // Start from 1000 (999 + 1)
            products.forEach((p: any) => {
                if (p.code && p.code.startsWith(`BCH-${prefix}-`)) {
                    const match = p.code.match(/\d+$/);
                    if (match) {
                        const num = parseInt(match[0]);
                        if (num > maxNumber) maxNumber = num;
                    }
                }
            });

            // Generate next number with 4-digit padding
            const nextNumber = String(maxNumber + 1).padStart(4, "0");
            return `BCH-${prefix}-${nextNumber}`;
        } catch (error) {
            console.error('Error generating product code:', error);
            return `BCH-${Date.now()}`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const productCode = editItem ? editItem.code : await generateProductCode(formData.category);

        const newProduct = {
            code: productCode,
            name: formData.name,
            type: type,
            category: formData.category === "Custom" ? formData.customCategory : formData.category,
            brand: formData.brand || (type === "accessory" ? "N/A" : formData.category),
            price: parseFloat(formData.actualPrice),
            offer_price: parseFloat(formData.offerPrice),
            stock: parseInt(formData.quantity),
            condition: formData.badge,
            processor: type === "laptop" ? formData.processor : "N/A",
            ram: type === "laptop" ? (formData.ram === "Custom" ? formData.customRam : formData.ram) : "N/A",
            storage: type === "laptop" ? (formData.storage === "Custom" ? formData.customStorage : formData.storage) : "N/A",
            screen: type === "laptop" ? (formData.screen === "Custom" ? formData.customScreen : formData.screen) : "N/A",
            graphics: type === "laptop" ? (formData.graphics === "Custom" ? formData.customGraphics : formData.graphics) : "N/A",
            graphics_storage: type === "laptop" ? (formData.graphicsStorage === "Custom" ? formData.customGraphicsStorage : formData.graphicsStorage) : "N/A",
            feature: formData.feature || "",
            about: formData.about || "",
            features: formData.features || "",
            badge: formData.badge,
            image: formData.image,
            discount: Math.round(
                ((formData.actualPrice - formData.offerPrice) / formData.actualPrice) *
                100
            ),
            date_added: new Date().toISOString().split("T")[0],
        };

        try {
            const method = editItem ? 'PUT' : 'POST';
            const response = await fetch('/api/products', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct),
            });

            if (response.ok) {
                onSave();
            } else {
                const error = await response.json();
                alert(`⚠️ Failed to save product: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('⚠️ Failed to save product. Check console for details.');
        }
    };

    return (
        <div className="form-container">
            <h3>
                <i className="fas fa-plus-circle"></i>{" "}
                {editItem ? "Edit Product" : "Add New Product"}
            </h3>

            <form onSubmit={handleSubmit} className="product-form">
                {/* Image Upload */}
                <div className="form-group">
                    <label>Product Image *</label>
                    <div
                        className="image-upload-area"
                        onClick={() => document.getElementById("productImage")?.click()}
                    >
                        {previewImage ? (
                            <div className="image-preview" style={{ display: "block" }}>
                                <img src={previewImage} style={{ display: "block" }} />
                            </div>
                        ) : (
                            <div className="image-preview">
                                <i className="fas fa-cloud-upload-alt"></i>
                                <p>Click to upload image (Max 5MB)</p>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        id="productImage"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                    />
                </div>

                {/* Common Fields */}
                <div className="form-group">
                    <label>Product Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Product Name"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Category *</label>
                        {type === "laptop" ? (
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="Apple">Apple</option>
                                <option value="Dell">Dell</option>
                                <option value="HP">HP</option>
                                <option value="Lenovo">Lenovo</option>
                                <option value="Desktop">Desktop</option>
                                <option value="Custom">Custom (Enter Manually)</option>
                            </select>
                        ) : (
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="Keyboard">Keyboard</option>
                                <option value="Mouse">Mouse</option>
                                <option value="Headset">Headset</option>
                                <option value="Monitor">Monitor</option>
                                <option value="Cable">Cable</option>
                                <option value="Webcam">Webcam</option>
                                <option value="Speaker">Speaker</option>
                                <option value="Other">Other</option>
                                <option value="Custom">Custom (Enter Manually)</option>
                            </select>
                        )}
                    </div>
                    {formData.category === "Custom" && (
                        <div className="form-group">
                            <label>Custom Category *</label>
                            <input
                                type="text"
                                name="customCategory"
                                value={formData.customCategory}
                                onChange={handleChange}
                                required
                                placeholder={type === "laptop" ? "e.g. Asus, Acer, MSI" : "e.g. USB Hub, Docking Station"}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Badge Type *</label>
                        <select
                            name="badge"
                            value={formData.badge}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Badge Type</option>
                            <option value="Refurbished">Refurbished</option>
                            <option value="New">New</option>
                        </select>
                    </div>
                </div>

                {/* Type Specific Fields */}
                {type === "laptop" ? (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Processor *</label>
                                <input
                                    type="text"
                                    name="processor"
                                    value={formData.processor}
                                    onChange={handleChange}
                                    required
                                    placeholder="Intel Core i5"
                                />
                            </div>
                            <div className="form-group">
                                <label>RAM *</label>
                                <select
                                    name="ram"
                                    value={formData.ram}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select RAM</option>
                                    <option value="4GB">4GB</option>
                                    <option value="8GB">8GB</option>
                                    <option value="16GB">16GB</option>
                                    <option value="32GB">32GB</option>
                                    <option value="64GB">64GB</option>
                                    <option value="Custom">Custom (Enter Manually)</option>
                                </select>
                            </div>
                            {formData.ram === "Custom" && (
                                <div className="form-group">
                                    <label>Custom RAM *</label>
                                    <input
                                        type="text"
                                        name="customRam"
                                        value={formData.customRam}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. 128GB DDR5"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Storage *</label>
                                <select
                                    name="storage"
                                    value={formData.storage}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Storage</option>
                                    <option value="128GB SSD">128GB SSD</option>
                                    <option value="256GB SSD">256GB SSD</option>
                                    <option value="512GB SSD">512GB SSD</option>
                                    <option value="1TB SSD">1TB SSD</option>
                                    <option value="2TB SSD">2TB SSD</option>
                                    <option value="500GB HDD">500GB HDD</option>
                                    <option value="1TB HDD">1TB HDD</option>
                                    <option value="Custom">Custom (Enter Manually)</option>
                                </select>
                            </div>
                            {formData.storage === "Custom" && (
                                <div className="form-group">
                                    <label>Custom Storage *</label>
                                    <input
                                        type="text"
                                        name="customStorage"
                                        value={formData.customStorage}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. 4TB SSD"
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Screen *</label>
                                <select
                                    name="screen"
                                    value={formData.screen}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Screen</option>
                                    <option value='13.3" HD'>13.3" HD</option>
                                    <option value='14" Full HD'>14" Full HD</option>
                                    <option value='15.6" Full HD'>15.6" Full HD</option>
                                    <option value='15.6" 4K'>15.6" 4K</option>
                                    <option value='17" Full HD'>17" Full HD</option>
                                    <option value='24" Full HD'>24" Full HD (Desktop)</option>
                                    <option value='27" QHD'>27" QHD (Desktop)</option>
                                    <option value="Custom">Custom (Enter Manually)</option>
                                </select>
                            </div>
                            {formData.screen === "Custom" && (
                                <div className="form-group">
                                    <label>Custom Screen *</label>
                                    <input
                                        type="text"
                                        name="customScreen"
                                        value={formData.customScreen}
                                        onChange={handleChange}
                                        required
                                        placeholder='e.g. 32" 4K UHD'
                                    />
                                </div>
                            )}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Graphics (Optional)</label>
                                <select
                                    name="graphics"
                                    value={formData.graphics}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Graphics</option>
                                    <option value="Integrated">Integrated Graphics</option>
                                    <option value="NVIDIA GTX 1650">NVIDIA GTX 1650</option>
                                    <option value="NVIDIA RTX 3050">NVIDIA RTX 3050</option>
                                    <option value="NVIDIA RTX 3060">NVIDIA RTX 3060</option>
                                    <option value="NVIDIA RTX 4050">NVIDIA RTX 4050</option>
                                    <option value="NVIDIA RTX 4060">NVIDIA RTX 4060</option>
                                    <option value="AMD Radeon">AMD Radeon</option>
                                    <option value="Intel Iris Xe">Intel Iris Xe</option>
                                    <option value="Custom">Custom (Enter Manually)</option>
                                </select>
                            </div>
                            {formData.graphics === "Custom" && (
                                <div className="form-group">
                                    <label>Custom Graphics *</label>
                                    <input
                                        type="text"
                                        name="customGraphics"
                                        value={formData.customGraphics}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. NVIDIA RTX 4090"
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Graphics Storage (Optional)</label>
                                <select
                                    name="graphicsStorage"
                                    value={formData.graphicsStorage}
                                    onChange={handleChange}
                                >
                                    <option value="">Select VRAM</option>
                                    <option value="Shared">Shared Memory</option>
                                    <option value="2GB">2GB</option>
                                    <option value="4GB">4GB</option>
                                    <option value="6GB">6GB</option>
                                    <option value="8GB">8GB</option>
                                    <option value="12GB">12GB</option>
                                    <option value="16GB">16GB</option>
                                    <option value="Custom">Custom (Enter Manually)</option>
                                </select>
                            </div>
                            {formData.graphicsStorage === "Custom" && (
                                <div className="form-group">
                                    <label>Custom Graphics Storage *</label>
                                    <input
                                        type="text"
                                        name="customGraphicsStorage"
                                        value={formData.customGraphicsStorage}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. 24GB"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Additional Features</label>
                            <input
                                type="text"
                                name="feature"
                                value={formData.feature}
                                onChange={handleChange}
                                placeholder="Windows 10 Pro, Backlit Keyboard"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="form-group">
                            <label>About This Item *</label>
                            <textarea
                                name="about"
                                value={formData.about}
                                onChange={handleChange}
                                rows={3}
                                required
                                placeholder="Describe the product..."
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label>Features (Optional)</label>
                            <input
                                type="text"
                                name="features"
                                value={formData.features}
                                onChange={handleChange}
                                placeholder="Wireless, Ergonomic (comma-separated)"
                            />
                        </div>
                    </>
                )}

                {/* Pricing */}
                <div className="price-section">
                    <h4>
                        <i className="fas fa-tag"></i> Pricing & Stock
                    </h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Actual Price (AED) *</label>
                            <input
                                type="number"
                                name="actualPrice"
                                value={formData.actualPrice}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Offer Price (AED) *</label>
                            <input
                                type="number"
                                name="offerPrice"
                                value={formData.offerPrice}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Quantity in Stock *</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                            min="0"
                        />
                    </div>
                </div>

                <div className="form-buttons">
                    <button type="submit" className="btn btn-primary">
                        <i className="fas fa-save"></i> {editItem ? "Update" : "Add"} Product
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        <i className="fas fa-redo"></i> Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
