'use client';

import React, { useState, useEffect, useRef } from 'react';
import '../styles/create-quotation.css';
import { toast } from 'sonner';
import ConfirmModal from '../shared/ConfirmModal';
import ProductInventorySelector from './ProductInventorySelector';
import { DatabaseProduct } from '@/types';
import TotalEditModal from './TotalEditModal';

interface CreateQuotationProps {
    setActiveSection: (section: string) => void;
    customers?: any[]; // Allow passing customers prop
    initialData?: any; // For editing
}

const DEFAULT_CUSTOMERS: any[] = [];

interface QuotationItem {
    id: number;
    description: string;
    qty: number;
    cost: number;
    discount: number;
    product_code?: string;
}

interface TermItem {
    id: string;
    text: string;
    checked: boolean;
}

export default function CreateQuotation({ setActiveSection, customers = DEFAULT_CUSTOMERS, initialData }: CreateQuotationProps) {
    // --- State ---
    const [isEditing, setIsEditing] = useState(false);
    const [originalId, setOriginalId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    // Total Edit State
    const [isTotalEditModalOpen, setIsTotalEditModalOpen] = useState(false);

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

    const [quotationNo, setQuotationNo] = useState("QTN2601");
    const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Move fetchNextQuotationNo to component scope to allow calling from error handler
    const fetchNextQuotationNo = async () => {
        try {
            const response = await fetch('/api/bch/quotations/next-number');
            if (response.ok) {
                const data = await response.json();
                if (data.nextQuotationNo) {
                    setQuotationNo(data.nextQuotationNo);
                }
            }
        } catch (error) {
            console.error('Failed to fetch next quotation number:', error);
        }
    };

    // Initialize/Fetch Data
    useEffect(() => {
        const loadInitialData = async () => {
            // Always fetch customers to ensure the list is fresh
            try {
                const custRes = await fetch('/api/bch/customers');
                if (custRes.ok) {
                    const custData = await custRes.json();
                    setAllCustomers(custData.customers || []);
                }
            } catch (err) {
                console.error("Failed to load customers", err);
            }

            if (initialData) {
                setIsEditing(true);
                setOriginalId(initialData.id);
                setQuotationNo(initialData.quotation_no);
                setCreatedDate(new Date(initialData.created_date).toISOString().split('T')[0]);
                setDueDate(new Date(initialData.due_date).toISOString().split('T')[0]);

                try {
                    const res = await fetch(`/api/bch/quotations/${initialData.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const inv = data.quotation;
                        const itemsData = data.items;

                        setQuotationNo(inv.quotation_no);
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
                        setShowTerms(inv.show_terms !== false);
                        const loadedNotes = inv.notes ? inv.notes.split('\n').filter((l: string) => l.trim().length > 0) : [];
                        const loadedTerms = inv.terms_and_conditions ? inv.terms_and_conditions.split('\n').filter((l: string) => l.trim().length > 0) : [];

                        // Helper to merge loaded lines with defaults or create new ones
                        const mergeWithDefaults = (loaded: string[], defaults: string[]) => {
                            const merged: TermItem[] = [];
                            // First add all loaded items as checked
                            loaded.forEach(text => {
                                const cleanText = text.replace(/^•\s*/, '');
                                merged.push({ id: Math.random().toString(36).substr(2, 9), text: cleanText, checked: true });
                            });
                            // Then add any defaults that are NOT in loaded (unchecked)
                            defaults.forEach(def => {
                                const cleanDef = def.replace(/^•\s*/, '');
                                if (!loaded.some(l => l.includes(cleanDef))) {
                                    merged.push({ id: Math.random().toString(36).substr(2, 9), text: cleanDef, checked: false });
                                }
                            });
                            return merged;
                        };

                        // If editing, try to smart merge. If no prev data, use defaults all checked.
                        // Actually, if editing, we only know what was saved. 
                        // To keep it simple: Show what was saved. Add "Add Line" button for more.
                        // But user wants "defaults" available.
                        // Let's just use the Defaults if loaded is empty, else use loaded.
                        // Wait, user might want to see the unchecked defaults too? 
                        // Let's implement basic parsing for now:

                        setTermsList(loadedTerms.length > 0 ?
                            loadedTerms.map((t: string) => ({ id: Math.random().toString(36).substr(2, 9), text: t.replace(/^•\s*/, ''), checked: true }))
                            : DEFAULT_TERMS.map(t => ({ id: Math.random().toString(36).substr(2, 9), text: t.replace(/^•\s*/, ''), checked: true }))
                        );

                        setNotesList(loadedNotes.length > 0 ?
                            loadedNotes.map((t: string) => ({ id: Math.random().toString(36).substr(2, 9), text: t.replace(/^•\s*/, ''), checked: true }))
                            : DEFAULT_NOTES.map(t => ({ id: Math.random().toString(36).substr(2, 9), text: t.replace(/^•\s*/, ''), checked: true }))
                        );

                        // Map items
                        const mappedItems = itemsData.map((item: any, idx: number) => ({
                            id: idx + 1,
                            description: item.description,
                            qty: Number(item.quantity),
                            cost: Number(item.unit_price),
                            discount: Number(item.discount),
                            product_code: item.product_code || null,
                            source: item.source || null
                        }));
                        setItems(mappedItems.length > 0 ? mappedItems : [{ id: 1, description: "", qty: 0, cost: 0, discount: 0 }]);
                    }
                } catch (err) {
                    console.error("Error fetching quotation details for edit", err);
                }
            } else {
                fetchNextQuotationNo();
            }
        };
        loadInitialData();
    }, [initialData]);

    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddData, setQuickAddData] = useState({ name: '', email: '', phone: '', address: '' });
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);

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
        const customersArray = Array.isArray(allCustomers) ? allCustomers : [];
        if (customersArray.length > 0) {
            if (!customerSearch) {
                setFilteredCustomers(customersArray);
            } else {
                const filtered = customersArray.filter(c =>
                    (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
                    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                );
                setFilteredCustomers(filtered);
            }
        } else {
            setFilteredCustomers([]);
        }
    }, [customerSearch, allCustomers]);

    const handleQuickAdd = async () => {
        if (!quickAddData.name) {
            alert("Customer name is required");
            return;
        }

        setIsSavingCustomer(true);
        try {
            const res = await fetch('/api/bch/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: quickAddData.name,
                    email: quickAddData.email,
                    phone: quickAddData.phone,
                    billingAddress1: quickAddData.address,
                    currency: 'AED', // Default
                    username: quickAddData.name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
                    password: 'Password123!', // Default password
                })
            });

            if (res.ok) {
                const newCustomer = await res.json();
                // Refresh customer list
                const custRes = await fetch('/api/bch/customers');
                if (custRes.ok) {
                    const custData = await custRes.json();
                    setAllCustomers(custData.customers || []);
                }

                // Select the new customer
                handleCustomerSelect({
                    ...quickAddData,
                    id: newCustomer.id,
                    shipping_address_1: quickAddData.address
                });
                setShowQuickAddModal(false);
                setQuickAddData({ name: '', email: '', phone: '', address: '' });
            } else {
                const err = await res.json();
                alert("Failed to save customer: " + (err.error || 'Unknown error'));
            }
        } catch (err) {
            console.error("Error saving customer:", err);
            alert("An error occurred while saving the customer");
        } finally {
            setIsSavingCustomer(false);
        }
    };

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

    const [items, setItems] = useState<QuotationItem[]>([
        { id: 1, description: "", qty: 0, cost: 0, discount: 0 }
    ]);

    const [taxRate, setTaxRate] = useState(5); // 5%
    const [isTaxable, setIsTaxable] = useState(true);
    const [isDiscountable, setIsDiscountable] = useState(true);
    const [showTerms, setShowTerms] = useState(true);

    const DEFAULT_TERMS = [
        "Please pay within 7 days from the date of quotation.",
        "Goods sold are not returnable or exchangeable.",
        "Warranty void if serial number/seal is tampered.",
        "No warranty for physical damage, liquid damage, or burn.",
        "Cheques should be inclusive of 5% VAT."
    ];
    const DEFAULT_NOTES = [
        "Please quote quotation number when remitting funds.",
        "Bank transfer details available upon request.",
        "Thank you for your business!"
    ];

    const [termsList, setTermsList] = useState<TermItem[]>(
        DEFAULT_TERMS.map((t, i) => ({ id: `def-t-${i}`, text: t, checked: true }))
    );
    const [notesList, setNotesList] = useState<TermItem[]>(
        DEFAULT_NOTES.map((t, i) => ({ id: `def-n-${i}`, text: t, checked: true }))
    );
    const [deletedTerms, setDeletedTerms] = useState<TermItem[]>([]);
    const [deletedNotes, setDeletedNotes] = useState<TermItem[]>([]);

    const [productCodeInput, setProductCodeInput] = useState("");
    const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const productSearchRef = useRef<HTMLDivElement>(null);

    // --- Product History State ---
    const [productHistory, setProductHistory] = useState<any[]>([]);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);

    // Fetch Product History when a valid product code is in the input
    useEffect(() => {
        const fetchHistory = async () => {
             if (!productCodeInput.trim()) {
                 setProductHistory([]);
                 return;
             }

             // Only fetch if it's an exact match in inventory to avoid spamming the API on every keystroke
             const exactMatch = inventoryProducts.find(p => p.product_code === productCodeInput.trim() || p.product_name === productCodeInput.trim());
             
             if (exactMatch && exactMatch.product_code) {
                 setIsFetchingHistory(true);
                 try {
                     const res = await fetch(`/api/bch/invoices/by-product/${encodeURIComponent(exactMatch.product_code)}`);
                     if (res.ok) {
                         const data = await res.json();
                         setProductHistory(data.history || []);
                     } else {
                         setProductHistory([]);
                     }
                 } catch (err) {
                     console.error("Failed to load product history", err);
                     setProductHistory([]);
                 } finally {
                     setIsFetchingHistory(false);
                 }
             } else {
                 setProductHistory([]);
             }
        };

        const debounceTimer = setTimeout(fetchHistory, 500); // 500ms debounce
        return () => clearTimeout(debounceTimer);
    }, [productCodeInput, inventoryProducts]);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/bch/inventory/qc');
                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setInventoryProducts(result.data || []);
                    }
                }
            } catch (err) {
                console.error("Failed to load inventory products", err);
            }
        };
        fetchInventory();
    }, []);

    // --- Calculations --- (Moved to end of component scope)
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

    const handleItemChange = (id: number, field: keyof QuotationItem, value: any) => {
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

        const p = inventoryProducts.find(prod => prod.product_code?.toLowerCase() === productCodeInput.trim().toLowerCase());

        if (p) {
            const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
            const itemDescription = p.product_name || '';
            const itemCost = Number(p.offer_price || p.base_price || 0);

            const newItem = {
                id: newId,
                description: itemDescription,
                qty: 1,
                cost: itemCost,
                discount: 0,
                product_code: p.product_code
            };
            setItems(prev => {
                const lastItem = prev[prev.length - 1];
                if (lastItem && !lastItem.description && !lastItem.cost) {
                    return [...prev.slice(0, -1), newItem];
                }
                return [...prev, newItem];
            });
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

    const handleSelectFromInventory = (selectedProducts: any[]) => {
        setItems((prev: any) => {
            let currentItems = [...prev];
            const lastItem = currentItems[currentItems.length - 1];
            if (lastItem && !lastItem.description && !lastItem.cost) {
                currentItems = currentItems.slice(0, -1);
            }

            let nextId = currentItems.length > 0 ? Math.max(...currentItems.map((i: any) => i.id)) + 1 : 1;

            const newItems = selectedProducts.map(p => ({
                id: nextId++,
                description: p.description || p.product_name || '',
                qty: 1,
                cost: Number(p.offer_price || p.base_price || 0),
                discount: 0,
                product_code: p.sku || p.product_code,
                source: p.source
            }));

            return [...currentItems, ...newItems];
        });
    };

    const handleProportionalTotalEdit = (targetTotal: number) => {
        const currentTotal = finalTotal;
        if (currentTotal === 0) {
            const itemsWithQty = items.filter(i => i.qty > 0);
            if (itemsWithQty.length === 0) {
                toast.error("Add items with quantity first");
                return;
            }
            const costPerItem = targetTotal / itemsWithQty.length;
            setItems(prev => prev.map(item => 
                item.qty > 0 ? { ...item, cost: costPerItem / item.qty } : item
            ));
        } else {
            const ratio = targetTotal / currentTotal;
            setItems(prev => prev.map(item => ({
                ...item,
                cost: item.cost * ratio
            })));
        }
        setIsTotalEditModalOpen(false);
        toast.success("Total cost redistributed proportionally");
    };

    // --- Calculations ---
    const calculateRowTotal = (item: QuotationItem) => {
        return (item.qty * item.cost) - (isDiscountable ? item.discount : 0);
    };

    const calculateSubTotal = () => {
        return items.reduce((acc, item) => acc + calculateRowTotal(item), 0);
    };

    const calculatedSubTotal = calculateSubTotal();
    const totalDiscount = items.reduce((sum, item) => sum + (isDiscountable ? item.discount : 0), 0);
    const vatAmount = isTaxable ? (calculatedSubTotal * taxRate) / 100 : 0;
    const finalTotal = calculatedSubTotal + vatAmount;
    const balanceDue = finalTotal - (advanceReceived || 0);

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const customer = filteredCustomers.find((c: any) => c.name === toDetails.name);
            const payload = {
                quotationNo,
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
                showTerms,
                notes: notesList.filter(t => t.checked).map(t => `• ${t.text}`).join('\n'), // Prepend bullet on save
                terms: termsList.filter(t => t.checked).map(t => `• ${t.text}`).join('\n'),
                advanceReceived,
                items: items.map((item: QuotationItem) => ({
                    description: item.description,
                    qty: item.qty,
                    cost: item.cost,
                    discount: item.discount,
                    product_code: item.product_code, 
                    source: (item as any).source,
                    total: calculateRowTotal(item)
                }))
            };

            const url = isEditing && originalId ? `/api/bch/quotations/${originalId}` : '/api/bch/quotations';
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
                    message: isEditing ? 'Quotation updated successfully!' : 'Quotation created successfully!',
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        setActiveSection('quotations-all');
                    }
                });
            } else {
                const error = await response.json();

                // Handle duplicate quotation number
                if (response.status === 409) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Quotation Number Exists',
                        message: 'The quotation number has already been used. We have updated it to the next available number. Please click "Save Quotation" again.',
                        type: 'info',
                        singleButton: true,
                        onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            fetchNextQuotationNo(); // Fetch new number
                        }
                    });
                } else {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: `Failed to ${isEditing ? 'update' : 'save'} quotation: ` + error.error,
                        type: 'danger',
                        singleButton: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        } catch (error) {
            console.error('Error saving quotation:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'An error occurred while saving the quotation.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="invoice-wrapper">
            <div className="actions-bar">
                <button className="btn-secondary" onClick={() => setActiveSection('quotations-all')} disabled={isSaving}>Cancel</button>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                    {isSaving ? 'Saving...' : (isEditing ? 'Update Quotation' : 'Save Quotation')}
                </button>
            </div>

            <div className="invoice-container">
                {/* Header Section */}
                <div className="quotation-header">
                    <div className="quotation-left-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginBottom: '0.1rem' }}>
                            <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '40px', height: 'auto' }} />
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1A2244', fontFamily: "'Square721 BT Roman', sans-serif", fontWeight: 700 }}>BIZZ CO HUB LLC</h1>
                        </div>
                        <p style={{ color: '#1A2244', margin: 0, fontSize: '0.75rem', fontWeight: 500 }}>Premium Refurbished Electronics and Professional IT Services</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.1rem' }}>
                            <div style={{ color: '#1A2244', fontSize: '0.75rem', fontWeight: 500 }}>
                                <p style={{ margin: 0 }}>Sharjah Media City, Sharjah, UAE</p>
                                <p style={{ margin: 0 }}>Ph: +971 52 714 6582 | +971 55 614 8279</p>
                            </div>
                            {isTaxable && (
                                <div style={{ marginRight: '6rem' }}>
                                    <p style={{ color: '#1A2244', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>TAX : 123456789123456</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="quotation-right-header">
                        <h1 style={{ fontSize: '2.8rem', letterSpacing: '2px' }}>PROFORMA INVOICE</h1>
                    </div>
                </div>

                {/* Meta Grid Section */}
                <div className="quotation-meta-grid">
                    {/* Left: Customer Info */}
                    <div className="quotation-left-meta">
                        <div className="meta-field-group" ref={searchRef}>
                            <label className="meta-label">Customer Name</label>
                            <div className="meta-input-wrapper">
                                <input
                                    className="editable-field"
                                    placeholder="Search Customer..."
                                    value={customerSearch || toDetails.name}
                                    onChange={e => {
                                        setCustomerSearch(e.target.value);
                                        setShowSuggestions(true);
                                        setToDetails({ ...toDetails, name: e.target.value });
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onClick={() => setShowSuggestions(true)}
                                />
                                <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}></i>
                                {showSuggestions && (
                                    <div className="customer-suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 100, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '4px' }}>
                                        <div onClick={() => { setQuickAddData(prev => ({ ...prev, name: customerSearch })); setShowQuickAddModal(true); setShowSuggestions(false); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1A2244', fontWeight: 600 }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1A224411', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-plus" style={{ fontSize: '0.7rem' }}></i></div>
                                            <span>Add New Customer</span>
                                        </div>
                                        {filteredCustomers.map(c => (
                                            <div key={c.id} onClick={() => handleCustomerSelect(c)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <img src={c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&color=fff&size=24`} alt={c.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                <div><div style={{ fontWeight: 500 }}>{c.name}</div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.email}</div></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="meta-field-group">
                            <label className="meta-label">Billing Address</label>
                            <textarea
                                className="editable-field textarea-field"
                                value={toDetails.address}
                                onChange={e => setToDetails({ ...toDetails, address: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="meta-field-group">
                                <label className="meta-label">Email</label>
                                <input
                                    className="editable-field"
                                    value={toDetails.email}
                                    onChange={e => setToDetails({ ...toDetails, email: e.target.value })}
                                />
                            </div>
                            <div className="meta-field-group">
                                <label className="meta-label">Phone</label>
                                <input
                                    className="editable-field"
                                    value={toDetails.phone}
                                    onChange={e => setToDetails({ ...toDetails, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Meta Info */}
                    <div className="quotation-right-meta" style={{ paddingLeft: '4rem' }}>
                        <div className="meta-field-group" style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: '#1A2244' }}>Invoice No <strong style={{ fontSize: '1rem' }}>#{quotationNo}</strong></div>
                        </div>

                        <div className="meta-field-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                            <label className="meta-label" style={{ marginBottom: 0 }}>Created Date :</label>
                            <input type="date" value={createdDate} onChange={e => setCreatedDate(e.target.value)} className="editable-field" style={{ width: '160px', padding: '0.4rem 0.6rem' }} />
                        </div>

                        <div className="meta-field-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                            <label className="meta-label" style={{ marginBottom: 0 }}>Due Date :</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="editable-field" style={{ width: '160px', padding: '0.4rem 0.6rem' }} />
                        </div>

                        <div className="meta-field-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                            <label className="meta-label" style={{ marginBottom: 0 }}>Payment Type :</label>
                            <select
                                value={paymentType}
                                onChange={e => setPaymentType(e.target.value)}
                                className="editable-field"
                                style={{ width: '160px', padding: '0.4rem 0.6rem' }}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Subject */}


                {/* Table Section */}
                <table className="quotation-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Job Description</th>
                            <th style={{ width: '10%' }}>Qty</th>
                            <th style={{ width: '15%' }}>Cost</th>
                            <th style={{ width: '15%' }}>Discount</th>
                            <th style={{ width: '15%' }}>Total</th>
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
                                        placeholder="Enter work details..."
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.qty}
                                        onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                                        className="editable-field"
                                        style={{ textAlign: 'center' }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.cost}
                                        onChange={e => handleItemChange(item.id, 'cost', parseFloat(e.target.value) || 0)}
                                        className="editable-field"
                                        style={{ textAlign: 'center' }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.discount}
                                        onChange={e => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                        className="editable-field"
                                        style={{ textAlign: 'center' }}
                                    />
                                </td>
                                <td style={{ fontWeight: 600, color: '#1A2244' }}>
                                    AED {calculateRowTotal(item).toFixed(0)}
                                </td>
                                <td>
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
                        <button
                            className="btn-secondary"
                            onClick={() => setIsProductModalOpen(true)}
                            title="Select from Inventory"
                            style={{ 
                                padding: '0.5rem', 
                                fontSize: '1rem', 
                                background: '#f8fafc', 
                                color: '#475569', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '38px',
                                height: '38px'
                            }}
                        >
                            <i className="fas fa-boxes"></i>
                        </button>
                    </div>
                </div>

                {/* --- Product Pricing History Table --- */}
                {(productHistory.length > 0 || isFetchingHistory) && productCodeInput.trim() && (
                    <div style={{ marginTop: '1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1A2244', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-history" style={{ color: '#6b7280' }}></i> Pricing History for {productCodeInput}
                        </h4>
                        
                        {isFetchingHistory ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                                <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }}></i> Loading history...
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                            <th style={{ padding: '0.5rem', color: '#4b5563' }}>Date</th>
                                            <th style={{ padding: '0.5rem', color: '#4b5563' }}>Invoice #</th>
                                            <th style={{ padding: '0.5rem', color: '#4b5563' }}>Customer</th>
                                            <th style={{ padding: '0.5rem', color: '#4b5563', textAlign: 'right' }}>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productHistory.map((h, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                                <td style={{ padding: '0.5rem' }}>{new Date(h.created_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.5rem' }}>#{h.invoice_no}</td>
                                                <td style={{ padding: '0.5rem' }}>{h.customer_name}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>AED {Number(h.unit_price).toFixed(0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Totals */}

                {showTerms ? (
                    <div className="quotation-footer-section">
                        <div className="quotation-terms" style={{ width: '450px' }}>
                            <h4 style={{ fontSize: '0.85rem', color: '#1A2244', fontWeight: 600, marginBottom: '0.5rem' }}>Terms and Conditions</h4>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', background: 'white', marginBottom: '1.5rem' }}>
                                {termsList.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <input type="checkbox" checked={item.checked} onChange={e => setTermsList(termsList.map(t => t.id === item.id ? { ...t, checked: e.target.checked } : t))} style={{ marginRight: '0.6rem', accentColor: '#0081f1' }} />
                                        <input value={item.text} onChange={e => setTermsList(termsList.map(t => t.id === item.id ? { ...t, text: e.target.value } : t))} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.85rem', color: '#4b5563', outline: 'none' }} />
                                        <i className="fas fa-trash" onClick={() => {
                                            if (item.text.trim() !== '') setDeletedTerms([...deletedTerms, item]);
                                            setTermsList(termsList.filter(t => t.id !== item.id));
                                        }} style={{ color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem', fontSize: '0.75rem' }}></i>
                                    </div>
                                ))}
                                <div onClick={() => setTermsList([...termsList, { id: Math.random().toString(36).substr(2, 9), text: "", checked: true }])} style={{ color: '#0081f1', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>+ Add Term</div>
                                {deletedTerms.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Recover deleted terms:</span>
                                        {deletedTerms.map(t => (
                                            <div key={t.id} onClick={() => {
                                                setTermsList([...termsList, t]);
                                                setDeletedTerms(deletedTerms.filter(dt => dt.id !== t.id));
                                            }} style={{ fontSize: '0.8rem', color: '#f59e0b', cursor: 'pointer', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <i className="fas fa-undo" style={{ fontSize: '0.7rem' }}></i> {t.text.length > 40 ? t.text.substring(0, 40) + '...' : t.text || '(Empty Term)'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <h4 style={{ fontSize: '0.85rem', color: '#1A2244', fontWeight: 600, marginBottom: '0.5rem' }}>Notes</h4>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', background: 'white' }}>
                                {notesList.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <input type="checkbox" checked={item.checked} onChange={e => setNotesList(notesList.map(t => t.id === item.id ? { ...t, checked: e.target.checked } : t))} style={{ marginRight: '0.6rem', accentColor: '#0081f1' }} />
                                        <input value={item.text} onChange={e => setNotesList(notesList.map(t => t.id === item.id ? { ...t, text: e.target.value } : t))} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.85rem', color: '#4b5563', outline: 'none' }} />
                                        <i className="fas fa-trash" onClick={() => {
                                            if (item.text.trim() !== '') setDeletedNotes([...deletedNotes, item]);
                                            setNotesList(notesList.filter(t => t.id !== item.id));
                                        }} style={{ color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem', fontSize: '0.75rem' }}></i>
                                    </div>
                                ))}
                                <div onClick={() => setNotesList([...notesList, { id: Math.random().toString(36).substr(2, 9), text: "", checked: true }])} style={{ color: '#0081f1', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>+ Add Note</div>
                                {deletedNotes.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Recover deleted notes:</span>
                                        {deletedNotes.map(t => (
                                            <div key={t.id} onClick={() => {
                                                setNotesList([...notesList, t]);
                                                setDeletedNotes(deletedNotes.filter(dt => dt.id !== t.id));
                                            }} style={{ fontSize: '0.8rem', color: '#f59e0b', cursor: 'pointer', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <i className="fas fa-undo" style={{ fontSize: '0.7rem' }}></i> {t.text.length > 40 ? t.text.substring(0, 40) + '...' : t.text || '(Empty Note)'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="quotation-totals">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: '#4b5563', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isTaxable} onChange={e => setIsTaxable(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0081f1' }} />
                                    Taxable
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: '#4b5563', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={showTerms} onChange={e => setShowTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0081f1' }} />
                                    Show Terms
                                </label>
                            </div>

                            <div className="total-row">
                                <span>Sub Total</span>
                                <span style={{ fontWeight: 600 }}>AED {calculatedSubTotal.toFixed(0)}</span>
                            </div>

                            {isTaxable && (
                                <div className="total-row">
                                    <span>VAT ({taxRate}%)</span>
                                    <span style={{ fontWeight: 600 }}>AED {vatAmount.toFixed(0)}</span>
                                </div>
                            )}

                            <div className="total-row final">
                                <span>Total Amount</span>
                                <span>AED {finalTotal.toFixed(0)}</span>
                            </div>

                            <div className="total-row" style={{ marginTop: '0.5rem' }}>
                                <span>Advance Received</span>
                                <input type="number" value={advanceReceived} onChange={e => setAdvanceReceived(parseFloat(e.target.value) || 0)} className="editable-field" style={{ width: '100px', padding: '0.3rem 0.5rem', textAlign: 'right' }} />
                            </div>

                            <div className="total-row" style={{ fontWeight: 700, color: '#dc2626', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '1rem' }}>
                                <span>Balance Due</span>
                                <span>AED {balanceDue.toFixed(0)}</span>
                            </div>

                            <div className="amount-in-words">
                                Amount in Words : {finalTotal.toFixed(0)} Dirhams Only
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="quotation-footer-section" style={{ justifyContent: 'flex-end' }}>
                        <div className="quotation-totals">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: '#4b5563', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isTaxable} onChange={e => setIsTaxable(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0081f1' }} />
                                    Taxable
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: '#4b5563', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={showTerms} onChange={e => setShowTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0081f1' }} />
                                    Show Terms
                                </label>
                            </div>

                            <div className="total-row">
                                <span>Sub Total</span>
                                <span style={{ fontWeight: 600 }}>AED {calculatedSubTotal.toFixed(0)}</span>
                            </div>

                            {isTaxable && (
                                <div className="total-row">
                                    <span>VAT ({taxRate}%)</span>
                                    <span style={{ fontWeight: 600 }}>AED {vatAmount.toFixed(0)}</span>
                                </div>
                            )}

                            <div className="total-row final">
                                <span>Total Amount</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>AED {finalTotal.toFixed(0)}</span>
                                    {isEditing && (
                                        <button 
                                            type="button" 
                                            onClick={() => setIsTotalEditModalOpen(true)}
                                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                            title="Edit Total (Redistribute Proportionally)"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="total-row" style={{ marginTop: '0.5rem' }}>
                                <span>Advance Received</span>
                                <input type="number" value={advanceReceived} onChange={e => setAdvanceReceived(parseFloat(e.target.value) || 0)} className="editable-field" style={{ width: '100px', padding: '0.3rem 0.5rem', textAlign: 'right' }} />
                            </div>

                            <div className="total-row" style={{ fontWeight: 700, color: '#dc2626', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '1rem' }}>
                                <span>Balance Due</span>
                                <span>AED {balanceDue.toFixed(0)}</span>
                            </div>

                            <div className="amount-in-words">
                                Amount in Words : {finalTotal.toFixed(0)} Dirhams Only
                            </div>
                        </div>
                    </div>
                )}

                {/* Signature Section */}
                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                        <div style={{ borderBottom: '1px solid #1A2244', marginBottom: '0.5rem' }}></div>
                        <h5 style={{ margin: 0, fontSize: '1rem', color: '#1A2244', fontWeight: 700 }}>Muhammed Rishad</h5>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Accountant</p>
                    </div>
                </div>

                {/* Bottom Branding */}
                <div className="bottom-branding">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <img src="/icon/nav-logo.png" alt="Bizzcohub" style={{ width: '28px', height: 'auto' }} />
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1A2244', fontFamily: "'Square721 BT Roman', sans-serif", fontWeight: 700 }}>BIZZ CO HUB LLC</h3>
                    </div>
                    <div className="bank-details">
                        Premium Refurbished Electronics and Professional IT Services
                    </div>
                </div>
            </div>
            <TotalEditModal
                isOpen={isTotalEditModalOpen}
                currentTotal={finalTotal}
                onClose={() => setIsTotalEditModalOpen(false)}
                onSave={handleProportionalTotalEdit}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type={confirmModal.type}
                singleButton={confirmModal.singleButton}
            />

            {/* Quick Add Customer Modal */}
            {showQuickAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#1A2244' }}>Quick Add Customer</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Full Name</label>
                            <input
                                type="text"
                                value={quickAddData.name}
                                onChange={e => setQuickAddData({ ...quickAddData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Email</label>
                            <input
                                type="email"
                                value={quickAddData.email}
                                onChange={e => setQuickAddData({ ...quickAddData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Phone</label>
                            <input
                                type="text"
                                value={quickAddData.phone}
                                onChange={e => setQuickAddData({ ...quickAddData, phone: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Address</label>
                            <textarea
                                value={quickAddData.address}
                                onChange={e => setQuickAddData({ ...quickAddData, address: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '80px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowQuickAddModal(false)}
                                style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleQuickAdd}
                                disabled={isSavingCustomer}
                                style={{
                                    flex: 1, padding: '0.75rem', border: 'none', borderRadius: '8px',
                                    background: '#1A2244', color: 'white', fontWeight: 600,
                                    opacity: isSavingCustomer ? 0.7 : 1
                                }}
                            >
                                {isSavingCustomer ? 'Saving...' : 'Add Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ProductInventorySelector 
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                products={inventoryProducts}
                onSelect={handleSelectFromInventory}
            />
        </div>
    );
}
