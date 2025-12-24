import React, { useState } from 'react';
import '../styles/create-invoice.css'; // Reuse invoice styles
import ConfirmModal from './ConfirmModal';

interface InvoiceReturnProps {
    setActiveSection: (section: string) => void;
}

export default function InvoiceReturn({ setActiveSection }: InvoiceReturnProps) {
    const [allInvoices, setAllInvoices] = useState<any[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Re-added missing state
    const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
    const [invoice, setInvoice] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(false);

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

    React.useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch('/api/admin/invoices');
                if (res.ok) {
                    const data = await res.json();
                    setAllInvoices(data.invoices || []);
                    setFilteredInvoices(data.invoices || []);
                }
            } catch (err) {
                console.error("Failed to load invoices", err);
            }
        };
        fetchInvoices();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchInvoiceNo(val);
        setShowSuggestions(true);

        const lowerVal = val.toLowerCase();
        const filtered = allInvoices.filter(inv =>
            inv.invoice_no.toLowerCase().includes(lowerVal) ||
            (inv.customer_name && inv.customer_name.toLowerCase().includes(lowerVal))
        );
        setFilteredInvoices(filtered);
    };

    const selectInvoice = async (inv: any) => {
        setSearchInvoiceNo(inv.invoice_no);
        setShowSuggestions(false);
        await fetchInvoiceDetails(inv.invoice_no);
    };

    const fetchInvoiceDetails = async (invoiceNo: string) => {
        setIsLoading(true);
        setInvoice(null);
        setItems([]);
        setReturnQuantities({});

        try {
            // Find invoice object from local list if possible, or fetch
            let foundInvoice = allInvoices.find(i => i.invoice_no === invoiceNo);

            // If not found locally (maybe new), try API search
            if (!foundInvoice) {
                const res = await fetch(`/api/admin/invoices?invoiceNo=${invoiceNo.trim()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.invoices && data.invoices.length > 0) {
                        foundInvoice = data.invoices[0];
                    }
                }
            }

            if (foundInvoice) {
                // Step 2: Fetch details
                const detailRes = await fetch(`/api/admin/invoices/${foundInvoice.id}`);
                if (detailRes.ok) {
                    const detailData = await detailRes.json();
                    setInvoice(detailData.invoice);
                    setItems(detailData.items || []);
                } else {
                    showError("Failed to fetch invoice details.");
                }
            } else {
                showError("Invoice not found.");
            }
        } catch (err) {
            console.error(err);
            showError("An error occurred while searching.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        if (!searchInvoiceNo.trim()) return;
        fetchInvoiceDetails(searchInvoiceNo);
        setShowSuggestions(false);
    };

    const showError = (msg: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: msg,
            type: 'danger',
            singleButton: true,
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    const handleReturnQtyChange = (itemId: number, maxQty: number, val: string) => {
        const qty = parseInt(val) || 0;
        if (qty < 0) return;
        if (qty > maxQty) {
            setReturnQuantities(prev => ({ ...prev, [itemId]: maxQty }));
        } else {
            setReturnQuantities(prev => ({ ...prev, [itemId]: qty }));
        }
    };

    const handleProcessReturn = async () => {
        const itemsToReturn = items.filter(item => returnQuantities[item.id] > 0).map(item => ({
            itemId: item.id,
            productCode: item.product_code,
            qty: returnQuantities[item.id]
        }));

        if (itemsToReturn.length === 0) {
            showError("Please specify at least one item to return.");
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirm Return',
            message: `Are you sure you want to return ${itemsToReturn.length} items? This will update the inventory.`,
            type: 'info',
            onConfirm: async () => {
                try {
                    const response = await fetch('/api/admin/invoices/return', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            invoiceId: invoice.id,
                            returnedItems: itemsToReturn
                        })
                    });

                    if (response.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Success',
                            message: 'Return processed successfully and inventory updated.',
                            type: 'success',
                            singleButton: true,
                            onConfirm: () => {
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                setActiveSection('invoicing-dashboard');
                            }
                        });
                    } else {
                        const error = await response.json();
                        showError("Failed to process return: " + error.error);
                    }
                } catch (err) {
                    console.error(err);
                    showError("An error occurred processing the return.");
                }
            }
        });
    };

    return (
        <div className="invoice-return-container" style={{ padding: '2rem' }}>
            <h2>Invoice Return</h2>
            <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: '500px' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search by Customer Name or Invoice No..."
                        value={searchInvoiceNo}
                        onChange={handleInputChange}
                        onFocus={() => setShowSuggestions(true)}
                        // Delay blur to allow click on suggestion
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="editable-field"
                        style={{
                            padding: '0.6rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            flex: 1
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn-primary" onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Search'}
                    </button>
                </div>

                {showSuggestions && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        marginTop: '4px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map(inv => (
                                <div
                                    key={inv.id}
                                    onClick={() => selectInvoice(inv)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f3f4f6',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500, color: '#111827' }}>{inv.invoice_no}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{inv.customer_name}</div>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                                        {new Date(inv.created_date).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '0.75rem 1rem', color: '#6b7280', textAlign: 'center' }}>
                                No invoices found
                            </div>
                        )}
                    </div>
                )}
            </div>

            {invoice && (
                <div className="invoice-container" style={{ marginTop: '0' }}>
                    <div className="invoice-header">
                        <div className="invoice-right-header">
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#0c86eaff' }}>RETURN</h1>
                            <p>Original Invoice: #{invoice.invoice_no}</p>
                        </div>
                        <div className="invoice-meta" style={{ textAlign: 'right' }}>
                            <div>Date: {new Date(invoice.created_date).toLocaleDateString()}</div>
                            <div>Customer: <strong>{invoice.customer_name}</strong></div>
                        </div>
                    </div>

                    <table className="invoice-items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style={{ textAlign: 'center' }}>Sold Qty</th>
                                <th style={{ textAlign: 'right' }}>Unit Cost</th>
                                <th style={{ textAlign: 'center', width: '150px' }}>Return Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        {item.description}
                                        {item.product_code && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Code: {item.product_code}</div>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>${Number(item.unit_price).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.quantity}
                                            value={returnQuantities[item.id] || 0}
                                            onChange={(e) => handleReturnQtyChange(item.id, item.quantity, e.target.value)}
                                            style={{
                                                width: '80px',
                                                padding: '0.4rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '4px',
                                                textAlign: 'center'
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button className="btn-primary" onClick={handleProcessReturn} style={{ backgroundColor: '#dc2626' }}>
                            Process Return & Update Inventory
                        </button>
                    </div>
                </div>
            )}

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
