import React, { useState } from 'react';

interface LineItem {
    description: string;
    details: string;
    unitPrice: number;
    quantity: number;
    total: number;
}

interface InvoiceFormProps {
    invoice: any;
    onUpdate: (invoice: any) => void;
    onSave: () => void;
    onCancel: () => void;
    branding: any;
}

export default function InvoiceForm({ invoice, onUpdate, onSave, onCancel, branding }: InvoiceFormProps) {
    const [autoCalculate, setAutoCalculate] = useState(true);

    const handleAutoCalculateToggle = () => {
        const newAutoCalculate = !autoCalculate;
        setAutoCalculate(newAutoCalculate);

        const subtotal = invoice.items.reduce((sum: number, item: LineItem) => sum + item.total, 0);
        let vat = 0;
        let discount = 0;

        // If turning on auto-calculate, recalculate now
        if (newAutoCalculate) {
            vat = subtotal * 0.05; // 5% VAT
            discount = subtotal * 0.0; // 0% discount
        }
        // If turning off, set both to 0
        else {
            vat = 0;
            discount = 0;
        }

        const total = subtotal + vat - discount;

        onUpdate({
            ...invoice,
            subtotal,
            vat,
            discount,
            total
        });
    };

    const updateItem = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...invoice.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate total for this item
        if (field === 'unitPrice' || field === 'quantity') {
            newItems[index].total = newItems[index].unitPrice * newItems[index].quantity;
        }

        // Recalculate invoice totals
        const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
        let vat = invoice.vat;
        let discount = invoice.discount;

        // Only auto-calculate if checkbox is enabled
        if (autoCalculate) {
            vat = subtotal * 0.05; // 5% VAT
            discount = subtotal * 0.0; // 0% discount
        }

        const total = subtotal + vat - discount;

        onUpdate({
            ...invoice,
            items: newItems,
            subtotal,
            vat,
            discount,
            total
        });
    };

    const addItem = () => {
        onUpdate({
            ...invoice,
            items: [...invoice.items, { description: "", details: "", unitPrice: 0, quantity: 1, total: 0 }]
        });
    };

    const removeItem = (index: number) => {
        if (invoice.items.length > 1) {
            const newItems = invoice.items.filter((_: any, i: number) => i !== index);
            const subtotal = newItems.reduce((sum: number, item: LineItem) => sum + item.total, 0);

            let vat = invoice.vat;
            let discount = invoice.discount;

            if (autoCalculate) {
                vat = subtotal * 0.05;
                discount = subtotal * 0.0;
            }

            const total = subtotal + vat - discount;

            onUpdate({
                ...invoice,
                items: newItems,
                subtotal,
                vat,
                discount,
                total
            });
        }
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        const symbols: { [key: string]: string } = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'AED', 'INR': '₹'
        };
        return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', width: '100%' }}>
            {/* Form Section */}
            <div style={{ background: "white", padding: "1rem", borderRadius: "5px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <h2 style={{ margin: 0, fontSize: "2rem", color: "#1f2937" }}>Create Invoice</h2>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: "#f3f4f6",
                            color: "#4b5563",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        ✕ Close
                    </button>
                </div>

                {/* Client Information */}
                <div style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                    <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#1f2937" }}>Invoice To</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
                        <div className="form-group">
                            <label>Client Name *</label>
                            <input
                                type="text"
                                value={invoice.clientName}
                                onChange={(e) => onUpdate({ ...invoice, clientName: e.target.value })}
                                placeholder="Sunlite Software Firm"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={invoice.clientWebsite || ""}
                                onChange={(e) => onUpdate({ ...invoice, clientWebsite: e.target.value })}
                                placeholder="+971 XXX XXX XXXX"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={invoice.clientEmail}
                                onChange={(e) => onUpdate({ ...invoice, clientEmail: e.target.value })}
                                placeholder="client@gmail.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Issue Date *</label>
                            <input
                                type="date"
                                value={invoice.issueDate}
                                onChange={(e) => onUpdate({ ...invoice, issueDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>Address</label>
                            <textarea
                                value={invoice.clientAddress}
                                onChange={(e) => onUpdate({ ...invoice, clientAddress: e.target.value })}
                                placeholder="Enter Address"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                    <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#1f2937" }}>Item Description</h3>
                    <div className="invoice-table">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: "30%" }}>Description</th>
                                    <th style={{ width: "30%" }}>Details</th>
                                    <th style={{ width: "15%" }}>Unit Price</th>
                                    <th style={{ width: "10%" }}>Quantity</th>
                                    <th style={{ width: "15%" }}>Total</th>
                                    <th style={{ width: "5%" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item: LineItem, index: number) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                placeholder="Enter Item"
                                                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.details}
                                                onChange={(e) => updateItem(index, 'details', e.target.value)}
                                                placeholder="Enter Item Details"
                                                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                placeholder="550"
                                                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                min="1"
                                                style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}
                                            />
                                        </td>
                                        <td style={{ textAlign: "right", fontWeight: "600" }}>
                                            ${item.total.toFixed(2)}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => removeItem(index)}
                                                disabled={invoice.items.length === 1}
                                                className="btn-remove"
                                                style={{ padding: "0.5rem" }}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        onClick={addItem}
                        style={{
                            marginTop: "1rem",
                            padding: "0.75rem 1.5rem",
                            background: branding.brandColor,
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        + Add Item
                    </button>
                </div>

                {/* Auto-Calculate Checkbox */}
                <div style={{ marginBottom: "1rem", maxWidth: "400px", marginLeft: "auto" }}>
                    <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "1rem",
                        background: "#f0f9ff",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: `2px solid ${autoCalculate ? branding.brandColor : "#e5e7eb"}`
                    }}>
                        <input
                            type="checkbox"
                            checked={autoCalculate}
                            onChange={handleAutoCalculateToggle}
                            style={{
                                width: "20px",
                                height: "20px",
                                cursor: "pointer",
                                accentColor: branding.brandColor
                            }}
                        />
                        <span style={{ fontWeight: "600", color: "#1f2937" }}>
                            Auto-calculate VAT (05%)
                        </span>
                    </label>
                </div>

                {/* Totals */}
                <div style={{ marginBottom: "2rem", maxWidth: "400px", marginLeft: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontSize: "1rem" }}>
                        <span>Sub Total:</span>
                        <strong>${invoice.subtotal.toFixed(2)}</strong>
                    </div>

                    {/* VAT */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", fontSize: "1rem" }}>
                        <span>Vat {autoCalculate && "(05%)"}:</span>
                        {autoCalculate ? (
                            <strong>${invoice.vat.toFixed(2)}</strong>
                        ) : (
                            <input
                                type="number"
                                value={invoice.vat}
                                onChange={(e) => {
                                    const vat = parseFloat(e.target.value) || 0;
                                    const total = invoice.subtotal + vat - invoice.discount;
                                    onUpdate({ ...invoice, vat, total });
                                }}
                                placeholder="0.00"
                                style={{
                                    width: "120px",
                                    padding: "0.5rem",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px",
                                    textAlign: "right",
                                    fontWeight: "600"
                                }}
                            />
                        )}
                    </div>

                    {/* Discount */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", fontSize: "1rem", color: "#e74c3c" }}>
                        <span>Discount:</span>
                        {autoCalculate ? (
                            <strong>- ${invoice.discount.toFixed(2)}</strong>
                        ) : (
                            <input
                                type="number"
                                value={invoice.discount}
                                onChange={(e) => {
                                    const discount = parseFloat(e.target.value) || 0;
                                    const total = invoice.subtotal + invoice.vat - discount;
                                    onUpdate({ ...invoice, discount, total });
                                }}
                                placeholder="0.00"
                                style={{
                                    width: "120px",
                                    padding: "0.5rem",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px",
                                    textAlign: "right",
                                    fontWeight: "600",
                                    color: "#e74c3c"
                                }}
                            />
                        )}
                    </div>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "1rem 0",
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        borderTop: "2px solid #e5e7eb",
                        marginTop: "0.5rem"
                    }}>
                        <span>Grand Total:</span>
                        <strong>${invoice.total.toFixed(2)}</strong>
                    </div>
                </div>

                {/* Payment Methods & Terms */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                    <div className="form-group">
                        <label>Payment Methods</label>
                        <textarea
                            value={invoice.paymentMethods?.join('\n') || ""}
                            onChange={(e) => onUpdate({ ...invoice, paymentMethods: e.target.value.split('\n') })}
                            rows={4}
                            placeholder="Card: Visa, MasterCard&#10;Bank Transfer: Available"
                        />
                    </div>
                    <div className="form-group">
                        <label>Terms and Conditions/Notes</label>
                        <textarea
                            value={invoice.terms}
                            onChange={(e) => onUpdate({ ...invoice, terms: e.target.value })}
                            rows={4}
                            placeholder="Payment is due within 30 days..."
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "0.875rem 2rem",
                            background: "#f3f4f6",
                            color: "#4b5563",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "1rem",
                            cursor: "pointer"
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        style={{
                            padding: "0.875rem 2rem",
                            background: `linear-gradient(135deg, ${branding.brandColor} 0%, #764ba2 100%)`,
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "1rem",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
                        }}
                    >
                        💾 Save Invoice
                    </button>
                </div>
            </div>

            {/* Live Preview Section */}
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", maxHeight: '85vh', overflowY: 'auto', position: 'sticky', top: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📄 Live Preview</span>
                </div>

                <div style={{
                    background: 'white',
                    padding: '15px 20px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    border: '1px solid #e5e7eb'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '15px' }}>
                        <div>
                            <h1 style={{ fontSize: '18px', fontWeight: '700', color: branding.brandColor, margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {branding.companyName}
                            </h1>
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>{branding.companyTagline}</div>
                            <div style={{ marginTop: '6px', fontSize: '8px', color: '#6b7280', lineHeight: '1.3' }}>
                                <p style={{ margin: '1px 0' }}>{branding.companyAddress}</p>
                                <p style={{ margin: '1px 0' }}>{branding.companyPhone}</p>
                                <p style={{ margin: '1px 0' }}>{branding.companyEmail}</p>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: '0 0 10px 0', letterSpacing: '-1px' }}>INVOICE</h1>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 2px', textAlign: 'right', fontSize: '9px' }}>
                                <div style={{ fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Invoice No</div>
                                <div style={{ fontWeight: '600', color: '#111827' }}>{invoice.invoiceNumber}</div>
                                <div style={{ fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Date</div>
                                <div style={{ fontWeight: '600', color: '#111827' }}>{invoice.issueDate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>BILL TO:</span>
                            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>{invoice.clientName || 'Client Name'}</h3>
                            <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.4' }}>
                                {invoice.clientAddress && <p style={{ margin: '1px 0' }}>{invoice.clientAddress}</p>}
                                {invoice.clientEmail && <p style={{ margin: '1px 0' }}>{invoice.clientEmail}</p>}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '9px', fontWeight: '600', color: '#9ca3af', marginBottom: '4px' }}>Payment Type :</div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827' }}>{invoice.paymentMethods && invoice.paymentMethods.length > 0 ? invoice.paymentMethods[0] : 'Cash'}</div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10px' }}>
                        <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', border: 'none' }}>Item Description</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', border: 'none' }}>Qty</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', border: 'none' }}>Price</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', border: 'none' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item: LineItem, index: number) => (
                                <tr key={index}>
                                    <td style={{ padding: '10px', borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #e5e7eb', fontSize: '11px', color: '#111827' }}>
                                        <span style={{ fontWeight: '600', display: 'block', marginBottom: '2px' }}>{item.description || 'Item'}</span>
                                        {item.details && <span style={{ fontSize: '9px', color: '#9ca3af' }}>{item.details}</span>}
                                    </td>
                                    <td style={{ padding: '10px', borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px', color: '#111827' }}>{item.quantity}</td>
                                    <td style={{ padding: '10px', borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #e5e7eb', textAlign: 'right', fontSize: '11px', color: '#111827' }}>{formatCurrency(item.unitPrice, invoice.currency)}</td>
                                    <td style={{ padding: '10px', borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #e5e7eb', textAlign: 'right', fontSize: '11px', color: '#111827', fontWeight: '600' }}>{formatCurrency(item.total, invoice.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ marginLeft: 'auto', width: '200px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#4b5563' }}>
                            <span>Subtotal</span>
                            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#4b5563' }}>
                            <span>Tax ({invoice.subtotal > 0 ? ((invoice.vat / invoice.subtotal) * 100).toFixed(0) : 0}%)</span>
                            <span>{formatCurrency(invoice.vat, invoice.currency)}</span>
                        </div>
                        {invoice.discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px', color: '#ef4444' }}>
                                <span>Discount</span>
                                <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #111827', borderBottom: '2px solid #111827', marginTop: '8px', fontWeight: '800', fontSize: '13px', color: '#111827' }}>
                            <span>Total Due</span>
                            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
