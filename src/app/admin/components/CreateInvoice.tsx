import React, { useState, useEffect, useRef } from 'react';
import '../styles/create-invoice.css';
import ConfirmModal from './ConfirmModal';

interface CreateInvoiceProps {
    setActiveSection: (section: string) => void;
    customers?: any[]; // Allow passing customers prop
    initialData?: any; // For editing
}

interface InvoiceItem {
    id: number;
    description: string;
    qty: number;
    cost: number;
    discount: number;
    product_code?: string;
}

export default function CreateInvoice({ setActiveSection, customers = [], initialData }: CreateInvoiceProps) {
    // --- State ---
    const [isEditing, setIsEditing] = useState(false);
    const [originalId, setOriginalId] = useState<number | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    const [invoiceNo, setInvoiceNo] = useState("INV0001");
    const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Initialize/Fetch Data
    useEffect(() => {
        const loadData = async () => {
            if (initialData) {
                setIsEditing(true);
                setOriginalId(initialData.id);
                setInvoiceNo(initialData.invoice_no);
                setCreatedDate(new Date(initialData.created_date).toISOString().split('T')[0]);
                setDueDate(new Date(initialData.due_date).toISOString().split('T')[0]);
                // Set other basic fields provided they exist in initialData
                // But generally, we should fetch the latest full data to be safe and get items

                try {
                    const res = await fetch(`/api/admin/invoices/${initialData.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const inv = data.invoice;
                        const itemsData = data.items;

                        setInvoiceNo(inv.invoice_no);
                        setCreatedDate(new Date(inv.created_date).toISOString().split('T')[0]);
                        setDueDate(new Date(inv.due_date).toISOString().split('T')[0]);

                        setToDetails({
                            name: inv.customer_name || '',
                            address: inv.customer_address || '',
                            email: inv.customer_email || '',
                            phone: inv.customer_phone || ''
                        });
                        setCustomerSearch(inv.customer_name || '');

                        setPaymentType(inv.payment_type || 'Cash');
                        setAdvanceReceived(Number(inv.advance_received) || 0);
                        setTaxRate(Number(inv.tax_rate) || 0);
                        setIsTaxable(inv.is_taxable);
                        setIsDiscountable(inv.is_discountable);

                        // Map items
                        const mappedItems = itemsData.map((d: any) => ({
                            id: d.id, // Keep DB id? Or mapped id? 
                            // If I keep DB id, I need to handle new items having local IDs (numbers) vs DB ids.
                            // For simplicity, I'll map them to the shape InvoiceItem requires. 
                            // InvoiceItem.id is number.
                            description: d.description,
                            qty: Number(d.quantity),
                            cost: Number(d.unit_price),
                            discount: Number(d.discount)
                        }));
                        setItems(mappedItems.length > 0 ? mappedItems : [{ id: 1, description: "", qty: 0, cost: 0, discount: 0 }]);
                    }
                } catch (err) {
                    console.error("Error fetching invoice details for edit", err);
                }
            } else {
                // New Invoice Logic
                const fetchNextInvoiceNo = async () => {
                    try {
                        const response = await fetch('/api/admin/invoices/next-number');
                        if (response.ok) {
                            const data = await response.json();
                            if (data.nextInvoiceNo) {
                                setInvoiceNo(data.nextInvoiceNo);
                            }
                        }
                    } catch (error) {
                        console.error('Failed to fetch next invoice number:', error);
                    }
                };
                fetchNextInvoiceNo();
            }
        };
        loadData();
    }, [initialData]);

    const [customerSearch, setCustomerSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

    const searchRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
                setShowProductSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (customers) {
            if (!customerSearch) {
                setFilteredCustomers(customers);
            } else {
                const filtered = customers.filter(c =>
                    (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
                    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                );
                setFilteredCustomers(filtered);
            }
        }
    }, [customerSearch, customers]);

    const handleCustomerSelect = (customer: any) => {
        setToDetails({
            name: customer.name,
            address: `${customer.shipping_address_1 || ''} ${customer.city || ''} ${customer.state || ''} ${customer.postcode || ''}`.trim().replace(/\s+/g, ' '),
            email: customer.email || "",
            phone: customer.phone || ""
        });
        setCustomerSearch(customer.name);
        setShowSuggestions(false);
    };

    const [toDetails, setToDetails] = useState({
        name: "",
        address: "",
        email: "",
        phone: ""
    });

    const [paymentType, setPaymentType] = useState("Cash");
    const [advanceReceived, setAdvanceReceived] = useState(0);

    const [items, setItems] = useState<InvoiceItem[]>([
        { id: 1, description: "", qty: 0, cost: 0, discount: 0 }
    ]);

    const [taxRate, setTaxRate] = useState(5); // 5%
    const [isTaxable, setIsTaxable] = useState(true);
    const [isDiscountable, setIsDiscountable] = useState(true);

    const [productCodeInput, setProductCodeInput] = useState("");
    const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const productSearchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/admin/inventory/products');
                if (res.ok) {
                    const data = await res.json();
                    setInventoryProducts(data);
                }
            } catch (err) {
                console.error("Failed to load inventory products", err);
            }
        };
        fetchInventory();
    }, []);

    // --- Calculations ---
    const subTotal = items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);

    const calculateRowTotal = (item: InvoiceItem) => {
        return (item.qty * item.cost) - (isDiscountable ? item.discount : 0);
    };

    const calculateSubTotal = () => {
        return items.reduce((acc, item) => acc + calculateRowTotal(item), 0);
    };

    const calculatedSubTotal = calculateSubTotal();
    const vatAmount = isTaxable ? (calculatedSubTotal * taxRate) / 100 : 0;
    const finalTotal = calculatedSubTotal + vatAmount;
    const balanceDue = finalTotal - advanceReceived;
    // Or is "Discount" adjacent to SubTotal a global discount?
    // Image has a "Discount: [0%]" line below Sub Total.
    // Let's assume the column "Discount" is line-item discount, and there's also a global one.
    // I'll stick to a clean robust logic:
    // Row Total = (Qty * Cost).
    // Sub Total = Sum of Row Totals.
    // Less Discount (global/sum of lines).
    // Add VAT.

    // Let's match the image columns exactly for inputs, but use logical math.
    // Image Columns: Description, Qty, Cost, Discount, Total.
    // I will use: Total = (Qty * Cost) - Discount.

    const handleItemChange = (id: number, field: keyof InvoiceItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const addItem = () => {
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        setItems([...items, { id: newId, description: "", qty: 0, cost: 0, discount: 0 }]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const handleAddProductByCode = () => {
        if (!productCodeInput.trim()) return;

        const product = inventoryProducts.find(p => p.product_code === productCodeInput.trim());

        if (product) {
            const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
            // Use offer_price if available, else base_price. Ensure numbering.
            const price = product.offer_price ? Number(product.offer_price) : Number(product.base_price);

            setItems(prev => [...prev, {
                id: newId,
                description: product.product_name,
                qty: 1,
                cost: price,
                discount: 0,
                product_code: product.product_code
            }]);
            setProductCodeInput("");
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Product Not Found',
                message: `No product found with code: ${productCodeInput}`,
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleSave = async () => {
        try {
            const customer = filteredCustomers.find(c => c.name === toDetails.name);
            const payload = {
                invoiceNo,
                customerId: customer ? customer.id : null,
                customerName: toDetails.name,
                customerAddress: toDetails.address,
                customerEmail: toDetails.email,
                customerPhone: toDetails.phone,
                createdDate,
                dueDate,
                subTotal: calculatedSubTotal,
                discountTotal: totalDiscount,
                taxRate: taxRate,
                taxAmount: vatAmount,
                totalAmount: finalTotal,
                paymentType: paymentType,
                status: 'Pending',
                isTaxable,
                isDiscountable,
                advanceReceived,
                items: items.map(item => ({
                    description: item.description,
                    qty: item.qty,
                    cost: item.cost,
                    discount: item.discount,
                    product_code: item.product_code, // Pass product code for inventory update
                    total: calculateRowTotal(item)
                }))
            };

            const url = isEditing && originalId ? `/api/admin/invoices/${originalId}` : '/api/admin/invoices';
            const method = isEditing && originalId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Trigger global update
                window.dispatchEvent(new Event('dashboard-updated'));
                localStorage.setItem('dashboardLastUpdated', Date.now().toString());

                setConfirmModal({
                    isOpen: true,
                    title: 'Success',
                    message: isEditing ? 'Invoice updated successfully!' : 'Invoice created successfully!',
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        setActiveSection('invoicing-dashboard');
                    }
                });
            } else {
                const error = await response.json();
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: `Failed to ${isEditing ? 'update' : 'save'} invoice: ` + error.error,
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'An error occurred while saving the invoice.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    return (
        <div className="invoice-wrapper" style={{ padding: '2rem', background: '#f3f4f6', minHeight: '100vh' }}>
            <div className="actions-bar">
                <button className="btn-secondary" onClick={() => setActiveSection('invoicing-dashboard')}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}>{isEditing ? 'Update Invoice' : 'Save Invoice'}</button>
            </div>

            <div className="invoice-container">
                {/* Header */}
                <div className="invoice-header" style={{ position: 'relative' }}>
                    <div className="company-branding">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '40px', height: 'auto' }} />
                            <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#0c86eaff' }}>Bizz Co Hub</h1>
                        </div>
                        <p style={{ color: '#0c86eaff' }}>Professional Solutions for Modern Business</p>
                    </div>

                    {isTaxable && (
                        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '60px' }}>
                            <p style={{ color: '#0c86eaff', fontSize: '1.2rem', fontWeight: 500, margin: 0 }}>TAX : 123456789123456</p>
                        </div>
                    )}

                    <div className="invoice-right-header">
                        <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#0c86eaff', letterSpacing: '2px' }}>INVOICE</h1>
                    </div>

                </div>

                {/* Addresses */}
                <div className="invoice-addresses">


                    <div className="address-content" style={{ width: '400px' }}>
                        <div ref={searchRef} style={{ position: 'relative', marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Customer Name</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="editable-field name"
                                    placeholder="Search Customer..."
                                    value={customerSearch || toDetails.name}
                                    onChange={e => {
                                        setCustomerSearch(e.target.value);
                                        setShowSuggestions(true);
                                        setToDetails({ ...toDetails, name: e.target.value });
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onClick={() => setShowSuggestions(true)}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 2.5rem 0.6rem 0.6rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <i
                                    className="fas fa-chevron-down"
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#9ca3af',
                                        pointerEvents: 'none',
                                        fontSize: '0.8rem'
                                    }}
                                ></i>
                            </div>
                            {showSuggestions && filteredCustomers.length > 0 && (
                                <div className="customer-suggestions" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    zIndex: 10,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    marginTop: '4px'
                                }}>
                                    {filteredCustomers.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleCustomerSelect(c)}
                                            style={{
                                                padding: '0.6rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f3f4f6',
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'

                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <img
                                                    src={c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&color=fff&size=32`}
                                                    alt={c.name}
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 500, color: '#1f2937' }}>{c.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{c.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Billing Address</label>
                            <textarea
                                className="editable-field"
                                value={toDetails.address}
                                onChange={e => setToDetails({ ...toDetails, address: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    minHeight: '40px', // Reduced height as per request earlier but now keeping it flexible
                                    resize: 'vertical',
                                    fontSize: '0.9rem',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Email</label>
                                <input
                                    className="editable-field"
                                    value={toDetails.email}
                                    onChange={e => setToDetails({ ...toDetails, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Phone</label>
                                <input
                                    className="editable-field"
                                    value={toDetails.phone}
                                    onChange={e => setToDetails({ ...toDetails, phone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="invoice-meta" style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: '0.5rem' }}>Invoice No <strong style={{ color: '#0c86eaff' }}>#{invoiceNo}</strong></div>
                        <div style={{ marginBottom: '0.5rem' }}>Created Date : <input type="date" value={createdDate} onChange={e => setCreatedDate(e.target.value)} className="editable-field" style={{ width: 'auto', display: 'inline-block', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.2rem' }} /></div>
                        <div>Due Date : <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="editable-field" style={{ width: 'auto', display: 'inline-block', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.2rem' }} /></div>
                        <div style={{ marginTop: '0.5rem' }}>
                            Payment Type :
                            <select
                                value={paymentType}
                                onChange={e => setPaymentType(e.target.value)}
                                className="editable-field"
                                style={{ width: 'auto', display: 'inline-block', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.2rem', marginLeft: '0.5rem' }}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>
                    </div>



                </div>

                {/* Subject */}


                {/* Items Table */}
                <table className="invoice-items-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Job Description</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Cost</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Discount</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                            <th style={{ width: '5%' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <input
                                        value={item.description}
                                        onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                        className="editable-field"
                                    />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="number"
                                        value={item.qty}
                                        onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                                        className="editable-field"
                                        style={{ textAlign: 'center' }}
                                    />
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <input
                                        type="number"
                                        value={item.cost}
                                        onChange={e => handleItemChange(item.id, 'cost', parseFloat(e.target.value) || 0)}
                                        className="editable-field"
                                        style={{ textAlign: 'right' }}
                                    />
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <input
                                        type="number"
                                        value={item.discount}
                                        onChange={e => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                        className="editable-field"
                                        style={{ textAlign: 'right' }}
                                    />
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                    ${calculateRowTotal(item).toFixed(0)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {items.length > 1 && (
                                        <i
                                            className="fas fa-trash-alt"
                                            style={{ color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                                            onClick={() => removeItem(item.id)}
                                        ></i>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <button className="btn-add-item" style={{ marginTop: 0 }} onClick={addItem}>+ Add Item</button>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} ref={productSearchRef}>
                        <div style={{ position: 'relative' }}>
                            <input
                                placeholder="Product Code"
                                className="editable-field"
                                value={productCodeInput}
                                onChange={(e) => {
                                    setProductCodeInput(e.target.value);
                                    setShowProductSuggestions(true);
                                }}
                                onFocus={() => setShowProductSuggestions(true)}
                                style={{
                                    width: '150px',
                                    border: '1px solid #e5e7eb',
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    background: 'white'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddProductByCode();
                                        setShowProductSuggestions(false);
                                    }
                                }}
                            />
                            {showProductSuggestions && productCodeInput && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: 0,
                                    width: '300px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    marginBottom: '4px',
                                    zIndex: 50
                                }}>
                                    {inventoryProducts
                                        .filter(p => (p.product_code?.toLowerCase().includes(productCodeInput.toLowerCase()) || p.product_name?.toLowerCase().includes(productCodeInput.toLowerCase())))
                                        .slice(0, 10)
                                        .map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    setProductCodeInput(p.product_code);
                                                    setShowProductSuggestions(false);
                                                }}
                                                style={{
                                                    padding: '0.5rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            >
                                                <span style={{ fontWeight: 600, color: '#374151' }}>{p.product_code}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.product_name}</span>
                                            </div>
                                        ))}
                                    {inventoryProducts.filter(p => (p.product_code?.toLowerCase().includes(productCodeInput.toLowerCase()) || p.product_name?.toLowerCase().includes(productCodeInput.toLowerCase()))).length === 0 && (
                                        <div style={{ padding: '0.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>No matches found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                handleAddProductByCode();
                                setShowProductSuggestions(false);
                            }}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="invoice-footer-section">
                    <div className="invoice-terms">
                        <h4>Terms and Conditions</h4>
                        <p>Please pay within 7 days from the date of invoice.</p>
                        <h4>Notes</h4>
                        <p>Please quote invoice number when remitting funds.</p>
                    </div>

                    <div className="invoice-totals">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isTaxable}
                                    onChange={e => setIsTaxable(e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: '#ea580c' }}
                                />
                                Taxable
                            </label>
                        </div>
                        {(isDiscountable || isTaxable) && (
                            <div className="total-row">
                                <span>Sub Total</span>
                                <span>${calculatedSubTotal.toFixed(0)}</span>
                            </div>
                        )}
                        {isTaxable && (
                            <div className="total-row">
                                <span>VAT ({taxRate}%)</span>
                                <span>${vatAmount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="total-row final">
                            <span>Total Amount</span>
                            <span style={{ color: '#ea580c' }}>${finalTotal.toFixed(0)}</span>
                        </div>

                        <div className="total-row">
                            <span>Advance Received</span>
                            <input
                                type="number"
                                value={advanceReceived}
                                onChange={e => setAdvanceReceived(parseFloat(e.target.value) || 0)}
                                className="editable-field"
                                style={{ width: '100px', textAlign: 'right', border: '1px solid #e5e7eb' }}
                            />
                        </div>

                        <div className="total-row" style={{ fontWeight: 600, color: '#dc2626', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                            <span>Balance Due</span>
                            <span>${balanceDue.toFixed(0)}</span>
                        </div>

                        <div className="amount-in-words">
                            Amount in Words : Dollar {finalTotal} Only
                        </div>
                    </div>
                </div>

                {/* Sigs */}
                <div className="signature-section">
                    <div style={{ display: 'inline-block', textAlign: 'center' }}>

                        <span className="signature-line"></span>
                        <h5 className="manager-name">Muhammed Rishad</h5>
                        <p className="manager-title">Assistant Manager</p>
                    </div>
                </div>

                {/* Bottom Branding */}
                <div className="bottom-branding">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '32px', height: 'auto' }} />
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0c86eaff' }}>Bizz Co Hub</h3>
                    </div>
                    <div className="bank-details">
                        Professional Solutions for Modern Business
                    </div>
                </div>
            </div>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}
