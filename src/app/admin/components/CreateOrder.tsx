import React, { useState, useEffect, useMemo, useRef } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import '../styles/create-order.css';
import AddCustomerForm from './AddCustomerForm';

interface Product {
    id: number;
    name: string;
    price: number | string;
    image?: string;
    description?: string;
    stock?: number;
    // Granular details
    brand?: string;
    series?: string;
    model?: string;
    processor?: string;
    generation?: string;
    ram?: string;
    ssd?: string; // storage
    graphics?: string;
    acStatus?: string; // charger
}

interface CartItem extends Product {
    quantity: number;
}

// Options extracted from AddProduct.tsx
const BRAND_OPTIONS = ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Razer', 'MSI', 'Samsung', 'Sony'];
const PROCESSOR_OPTIONS = [
    'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
    'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
    'Apple M1', 'Apple M2', 'Apple M3', 'Apple M1 Pro', 'Apple M1 Max',
    'Apple M2 Pro', 'Apple M2 Max', 'Apple M3 Pro', 'Apple M3 Max'
];
const GEN_OPTIONS = ['8th Gen', '9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen', 'M1', 'M2', 'M3'];
const RAM_OPTIONS = ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB'];
const STORAGE_OPTIONS = ['256GB', '512GB', '1TB', '2TB', '4TB', '8TB'];
const GPU_RAM_OPTIONS = ['2GB', '4GB', '6GB', '8GB', '10GB', '12GB', '16GB', '24GB'];
const DISPLAY_TYPE_OPTIONS = ['Touch', 'Non-Touch', 'Bazel Touch', 'Glass Touch'];
const CHARGER_OPTIONS = ['Original Charger', 'Compatible Charger', 'No Charger'];

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

    useEffect(() => {
        setFilteredOptions(
            options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
        );
    }, [value, options]);

    useEffect(() => {
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
        <div className="custom-combobox" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                name={name}
                value={value}
                onChange={(e) => {
                    onChange(e as any);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                autoComplete="new-password"
                className="co-input"
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul className="combobox-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '0 0 6px 6px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {filteredOptions.map((option, idx) => (
                        <li
                            key={idx}
                            onClick={() => handleSelect(option)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const CreateOrder = ({ onOrderCreated, initialData }: { onOrderCreated?: () => void, initialData?: any }) => {
    // --- State ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [orderNumber, setOrderNumber] = useState(''); // SO-Number
    const [customerName, setCustomerName] = useState(''); // Search/Input
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [productCode, setProductCode] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState('');

    // Customer Data State
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

    // Add Item Modal State
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        brand: '',
        model: '',
        series: '',
        processorName: '',
        processorGen: '',
        memorySize: '',
        storageSize: '',
        graphicsCardRam: '',
        displayType: '',
        charger: '',
        price: '',
        quantity: 1
    });

    // Product Data State
    const [existingProducts, setExistingProducts] = useState<any[]>([]);

    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'danger',
        singleButton: true,
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
    });

    // --- Init ---
    // --- Init ---
    useEffect(() => {
        if (initialData) {
            // Edit Mode
            setOrderNumber(initialData.order_number);
            setCustomerName(initialData.customer_name);
            setCustomerEmail(initialData.email || '');
            setCustomerPhone(initialData.phone || '');
            setCustomerAddress(initialData.address || '');
            setCart(initialData.items || []);
            // setOrderDate(initialData.created_at.split('T')[0]); // Optional: keep original date or today
        } else {
            // Create Mode
            // Generate pseudo-random SO number
            setOrderNumber(`SO-${Math.floor(1000 + Math.random() * 9000)}`);
        }

        fetchCustomers();
        fetchProducts();
    }, [initialData]);

    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
            const res = await fetch('/api/admin/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    useEffect(() => {
        const match = customers.find(c => c.name === customerName);
        if (match) {
            setCustomerPhone(match.phone || '');
            setCustomerEmail(match.email || '');
            // Construct address from parts if needed, or use a single field if available
            const addr = match.address || match.billing_address_1 || match.shipping_address_1 || '';
            const city = match.city ? `, ${match.city}` : '';
            const country = match.country ? `, ${match.country}` : '';
            setCustomerAddress(`${addr}${city}${country}`);
        }
    }, [customerName, customers]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products'); // Simplified fetch, adjust endpoint if needed
            if (res.ok) {
                const data = await res.json();
                setExistingProducts(data.products || []);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    // --- Computed ---

    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const tax = 0; // Removed VAT
        const shipping = 0; // Removed Shipping
        const total = subtotal + tax + shipping;
        return { subtotal, tax, shipping, total };
    }, [cart]);

    // --- Handlers ---
    const handleAddItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleConfirmAddItem = () => {
        if (!newItem.price) {
            setModal({
                isOpen: true,
                title: 'Validation Error',
                message: 'Price is required.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        const trimProcessor = (proc: string) => {
            const match = proc.match(/i\d/i);
            return match ? match[0] : proc;
        };
        const proc = trimProcessor(newItem.processorName || '');

        // Format construction
        const parts = [
            newItem.brand,
            newItem.series,
            newItem.model,
            proc,
            newItem.processorGen,
            newItem.memorySize
        ].filter(Boolean).join(' ');

        const storage = newItem.storageSize ? `/ ${newItem.storageSize}` : '';

        const extraParts = [
            newItem.graphicsCardRam,
            newItem.displayType,
            newItem.charger ? `with ${newItem.charger}` : ''
        ].filter(Boolean).join(' ');

        const fullName = `${parts} ${storage} ${extraParts}`.replace(/\s+/g, ' ').trim();

        const product: CartItem = {
            id: Date.now(),
            name: fullName,
            description: '',
            price: newItem.price,
            image: '/placeholder.svg',
            quantity: Number(newItem.quantity) || 1,
            brand: newItem.brand,
            series: newItem.series,
            model: newItem.model,
            processor: newItem.processorName,
            generation: newItem.processorGen,
            ram: newItem.memorySize,
            ssd: newItem.storageSize,
            graphics: newItem.graphicsCardRam,
            acStatus: newItem.charger
        };

        setCart(prev => [...prev, product]);

        setNewItem({
            brand: '', model: '', series: '', processorName: '', processorGen: '',
            memorySize: '', storageSize: '', graphicsCardRam: '', displayType: '', charger: '',
            price: '', quantity: 1
        });
        setIsAddItemModalOpen(false);
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleCreateCustomer = async (data: any) => {
        try {
            let avatarUrl = null;
            if (data.image) {
                const formData = new FormData();
                formData.append('file', data.image);
                formData.append('folder', 'Customers');
                formData.append('fileName', data.image.name.replace(/\s+/g, '_'));

                const uploadRes = await fetch('/api/imagekit/upload', {
                    method: 'POST',
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    avatarUrl = uploadData.url;
                }
            }

            const payload = {
                ...data,
                avatar: avatarUrl
            };

            const res = await fetch('/api/admin/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                setModal({
                    isOpen: true,
                    title: 'Success',
                    message: 'Customer created successfully!',
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setModal(prev => ({ ...prev, isOpen: false }));
                        setIsAddCustomerModalOpen(false);
                        fetchCustomers(); // Refresh list
                        if (result.customer && result.customer.name) {
                            setCustomerName(result.customer.name);
                        }
                    }
                });
            } else {
                const err = await res.json();
                setModal({
                    isOpen: true,
                    title: 'Error',
                    message: `Failed to create customer: ${err.error}`,
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error("Error creating customer:", error);
            setModal({
                isOpen: true,
                title: 'Error',
                message: "An error occurred while creating the customer.",
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleAddProductByCode = () => {
        if (!productCode) return;
        const product = existingProducts.find(p => p.productCode === productCode);
        if (product) {
            const newCartItem: CartItem = {
                id: Date.now(),
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg',
                description: product.description || '',
                stock: product.stock,
                quantity: 1,
                // Map specs
                brand: product.brand,
                series: product.specifications?.Series,
                model: product.specifications?.Model,
                processor: product.specifications?.Processor,
                generation: product.specifications?.['Processor Generation'],
                ram: product.specifications?.RAM,
                ssd: product.specifications?.Storage,
                graphics: product.specifications?.Graphics,
                acStatus: product.specifications?.['AC Status'] || 'Original Charger' // Default or fetch
            };
            setCart(prev => [...prev, newCartItem]);
            setProductCode('');
        } else {
            setModal({
                isOpen: true,
                title: 'Product Not Found',
                message: 'The product code you entered does not exist.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            setModal({
                isOpen: true,
                title: 'Cart Empty',
                message: 'Please add at least one item to the order.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }
        setIsSubmitting(true);
        try {
            // Simplified Payload
            const payload = {
                orderNumber,
                customer: { firstName: customerName.split(' ')[0] || 'Guest', lastName: customerName.split(' ')[1] || '' }, // Basic parse
                items: cart,
                dates: { order: orderDate, delivery: deliveryDate },
                totals
            };

            const method = initialData ? 'PUT' : 'POST';
            const body = initialData ? {
                id: initialData.id,
                firstName: payload.customer.firstName,
                lastName: payload.customer.lastName,
                email: customerEmail || 'manual@entry.com',
                phone: customerPhone,
                address: customerAddress,
                items: cart,
                subtotal: totals.subtotal,
                tax: totals.tax,
                shipping: totals.shipping,
                total: totals.total,
                status: initialData.status // Keep existing status
            } : {
                firstName: payload.customer.firstName,
                lastName: payload.customer.lastName,
                email: customerEmail || 'manual@entry.com', // Placeholder or add field
                phone: customerPhone,
                address: customerAddress,
                items: cart,
                subtotal: totals.subtotal,
                tax: totals.tax,
                shipping: totals.shipping,
                total: totals.total,
                status: 'Pending'
            };

            const response = await fetch('/api/admin/orders', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setModal({
                    isOpen: true,
                    title: 'Success',
                    message: initialData ? "Order Updated Successfully" : "Order Created Successfully",
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setModal(prev => ({ ...prev, isOpen: false }));
                        setCart([]);
                        setCustomerName('');
                        setCustomerPhone('');
                        setCustomerEmail('');
                        setCustomerAddress('');
                        if (onOrderCreated) onOrderCreated();
                    }
                });
            } else {
                setModal({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to save order",
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error(error);
            setModal({
                isOpen: true,
                title: 'Error',
                message: "An unexpected error occurred while saving the order.",
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="co-page-container">
            {/* Header Section */}
            <div className="co-header">
                <div>
                    <h1 className="co-title">{initialData ? 'Edit Order' : 'Create New Order'}</h1>
                    <p className="co-subtitle">{initialData ? `Editing Order #${initialData.order_number}` : 'Manually enter details to create an order for a customer.'}</p>
                </div>
                {/* SO Number Hidden */}
            </div>

            <form onSubmit={handleSubmit} className="co-form">
                {/* Top Controls: Customer & Dates */}
                <div className="co-section-grid">
                    {/* Customer Info Card */}
                    <div className="co-card customer-card">
                        <div className="card-header">
                            <h3><i className="fas fa-user"></i> Customer Details</h3>
                        </div>
                        <div className="card-body">
                            <div className="form-grid">
                                <div className="co-control-group full-width">
                                    <label>Customer Name</label>
                                    <div className="input-with-button">
                                        <SearchableDropdown
                                            name="customer_lookup_field"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            options={customers.map(c => c.name)}
                                            placeholder="Search or Enter Name..."
                                        />
                                        <button type="button" className="btn-add-customer" onClick={() => setIsAddCustomerModalOpen(true)}>Add</button>
                                    </div>
                                </div>
                                <div className="co-control-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="co-input"
                                        placeholder="Phone"
                                    />
                                </div>
                                <div className="co-control-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="co-input"
                                        placeholder="Email"
                                    />
                                </div>
                                <div className="co-control-group full-width">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        className="co-input"
                                        placeholder="Address"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Dates Card */}
                    <div className="co-card dates-card">
                        <div className="card-header">
                            <h3><i className="fas fa-calendar-alt"></i> Order Details</h3>
                        </div>
                        <div className="card-body">
                            <div className="co-dates-row">
                                <div className="co-control-group">
                                    <label>Order Date</label>
                                    <input
                                        type="date"
                                        value={orderDate}
                                        onChange={(e) => setOrderDate(e.target.value)}
                                        className="co-input"
                                    />
                                </div>
                                <div className="co-control-group">
                                    <label>Delivery Date</label>
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className="co-input"
                                        placeholder="mm/dd/yyyy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Search Bar */}
                <div className="co-product-bar">
                    <div className="co-control-group full-width">
                        <label>Add Product by Code</label>
                        <div className="input-with-button">
                            <SearchableDropdown
                                name="productCode"
                                value={productCode}
                                onChange={(e) => setProductCode(e.target.value)}
                                options={existingProducts.map(p => p.productCode || `Product-${p.id}`)}
                                placeholder="Select or Enter Product Code"
                            />
                            <button type="button" className="btn-add-customer" onClick={handleAddProductByCode}>
                                <i className="fas fa-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="co-table-container">
                    <table className="co-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th>Product</th>
                                <th>Processor</th>
                                <th>Generation</th>
                                <th>RAM</th>
                                <th>SSD</th>
                                <th>Graphics</th>
                                <th>AC Status</th>
                                <th style={{ width: '80px' }}>Qty</th>
                                <th style={{ width: '100px' }}>Price</th>
                                <th style={{ width: '80px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{String(index + 1).padStart(2, '0')}</td>
                                    <td>
                                        <div className="co-item-cell">
                                            <img src={item.image || '/placeholder.svg'} alt="" className="co-item-thumb" />
                                            <div className="co-item-info">
                                                <span className="name">{item.brand} {item.series} {item.model}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.processor}</td>
                                    <td>{item.generation}</td>
                                    <td>{item.ram}</td>
                                    <td>{item.ssd}</td>
                                    <td>{item.graphics}</td>
                                    <td>{item.acStatus}</td>
                                    <td>
                                        <div className="co-qty-control">
                                            <button type="button" onClick={() => updateQty(item.id, -1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" onClick={() => updateQty(item.id, 1)}>+</button>
                                        </div>
                                    </td>
                                    <td>AED {item.price}</td>
                                    <td>
                                        <button type="button" className="co-action-btn delete" onClick={() => removeItem(item.id)}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Add Item Trigger */}
                    <div className="co-add-row-trigger">
                        <button type="button" className="btn-add-item" onClick={() => setIsAddItemModalOpen(true)}>
                            Add Item +
                        </button>
                    </div>
                </div>

                {/* Summary & Actions - Bottom */}
                <div className="co-footer">
                    <div className="co-totals">
                        <div className="msg">
                            {/* Optional Note field could go here */}
                        </div>
                        <div className="totals-box">
                            {/* Subtotal removed */}
                            {/* Tax removed */}
                            {/* Shipping removed */}
                            <div className="t-row grand"><span>Total:</span> <span>AED {totals.total.toLocaleString()}</span></div>
                            <button
                                type="submit"
                                className="btn-submit-order"
                                disabled={isSubmitting}
                                style={{ width: '100%', marginTop: '1.5rem' }}
                            >
                                create order
                            </button>
                        </div>
                    </div>
                </div>

            </form>

            {/* --- Modal Overlay --- */}
            {isAddItemModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content add-item-modal">
                        <div className="modal-header">
                            <h3>Add Item</h3>
                            <button type="button" className="close-btn" onClick={() => setIsAddItemModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="ai-grid">
                                {/* Left Column */}
                                <div className="ai-col">
                                    <div className="ai-group">
                                        <label>Brand</label>
                                        <SearchableDropdown
                                            name="brand"
                                            value={newItem.brand}
                                            onChange={handleAddItemChange as any}
                                            options={BRAND_OPTIONS}
                                            placeholder="Brand"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Series</label>
                                        <input
                                            name="series"
                                            value={newItem.series}
                                            onChange={handleAddItemChange}
                                            className="co-input"
                                            placeholder="Series"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Model</label>
                                        <input
                                            name="model"
                                            value={newItem.model}
                                            onChange={handleAddItemChange}
                                            className="co-input"
                                            placeholder="Model"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Processor Name</label>
                                        <SearchableDropdown
                                            name="processorName"
                                            value={newItem.processorName}
                                            onChange={handleAddItemChange as any}
                                            options={PROCESSOR_OPTIONS}
                                            placeholder="Processor Name"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Processor Generation</label>
                                        <SearchableDropdown
                                            name="processorGen"
                                            value={newItem.processorGen}
                                            onChange={handleAddItemChange as any}
                                            options={GEN_OPTIONS}
                                            placeholder="Processor Generation"
                                        />
                                    </div>
                                </div>
                                {/* Right Column */}
                                <div className="ai-col">
                                    <div className="ai-group">
                                        <label>Memory Size</label>
                                        <SearchableDropdown
                                            name="memorySize"
                                            value={newItem.memorySize}
                                            onChange={handleAddItemChange as any}
                                            options={RAM_OPTIONS}
                                            placeholder="Memory Size"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Storage Size</label>
                                        <SearchableDropdown
                                            name="storageSize"
                                            value={newItem.storageSize}
                                            onChange={handleAddItemChange as any}
                                            options={STORAGE_OPTIONS}
                                            placeholder="Storage Size"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Graphics Card Ram Size</label>
                                        <SearchableDropdown
                                            name="graphicsCardRam"
                                            value={newItem.graphicsCardRam}
                                            onChange={handleAddItemChange as any}
                                            options={GPU_RAM_OPTIONS}
                                            placeholder="Graphics Card Ram Size"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Display Type</label>
                                        <SearchableDropdown
                                            name="displayType"
                                            value={newItem.displayType}
                                            onChange={handleAddItemChange as any}
                                            options={DISPLAY_TYPE_OPTIONS}
                                            placeholder="Display Type"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Charger</label>
                                        <SearchableDropdown
                                            name="charger"
                                            value={newItem.charger}
                                            onChange={handleAddItemChange as any}
                                            options={CHARGER_OPTIONS}
                                            placeholder="Charger"
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Price & Qty Row (Required for Order) */}
                            <div className="ai-footer-row">
                                <div className="ai-group" style={{ flex: 1 }}>
                                    <label>Price (AED) *</label>
                                    <input type="number" name="price" value={newItem.price} onChange={handleAddItemChange} className="co-input" placeholder="0.00" required />
                                </div>
                                <div className="ai-group" style={{ width: '100px' }}>
                                    <label>Qty</label>
                                    <input type="number" name="quantity" value={newItem.quantity} onChange={handleAddItemChange} className="co-input" min="1" />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsAddItemModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn-confirm" onClick={handleConfirmAddItem}>Add to Order</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Add Customer Modal --- */}
            {isAddCustomerModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '100%', padding: '0' }}>
                        <AddCustomerForm
                            onCancel={() => setIsAddCustomerModalOpen(false)}
                            onSubmit={handleCreateCustomer}
                        />
                    </div>
                </div>
            )}

            {/* Modal */}
            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                singleButton={modal.singleButton}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
                confirmText="OK"
            />
        </div>
    );
};

export default CreateOrder;
