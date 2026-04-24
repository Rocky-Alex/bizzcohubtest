"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Undo2, ArrowRightCircle, ShieldAlert, BadgeCheck, ChevronDown, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import './SalesInventory.css';

export default function SalesInventory() {
    const [activeTab, setActiveTab] = useState<'out' | 'returns'>('out');
    const [salesOut, setSalesOut] = useState<any[]>([]);
    const [salesReturns, setSalesReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [expandedInvoices, setExpandedInvoices] = useState<string[]>([]);
    const [invoiceDetails, setInvoiceDetails] = useState<Record<string, any[]>>({});
    const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<any>(null);
    const [isQCModalOpen, setIsQCModalOpen] = useState(false);
    const [qcNotes, setQcNotes] = useState("");

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'out') {
                const res = await fetch('/api/bch/sales/process?grouped=true');
                const data = await res.json();
                if (data.success) {
                    setSalesOut(data.salesOut.filter((s: any) => s.status === 'Sold Out'));
                }
            } else {
                const res = await fetch('/api/bch/sales/returns/qc', { cache: 'no-store' });
                const data = await res.json();
                if (data.success) {
                    setSalesReturns(data.returns);
                }
            }
        } catch (e) {
            toast.error("Failed to load inventory.");
        } finally {
            setLoading(false);
        }
    };

    const toggleInvoice = async (invoiceNo: string) => {
        if (expandedInvoices.includes(invoiceNo)) {
            setExpandedInvoices(expandedInvoices.filter(no => no !== invoiceNo));
        } else {
            setExpandedInvoices([...expandedInvoices, invoiceNo]);
            if (!invoiceDetails[invoiceNo]) {
                setDetailsLoading(invoiceNo);
                try {
                    const res = await fetch(`/api/bch/sales/process?invoiceNo=${invoiceNo}`);
                    const data = await res.json();
                    if (data.success) {
                        setInvoiceDetails(prev => ({ ...prev, [invoiceNo]: data.salesOut }));
                    }
                } catch (e) {
                    toast.error("Failed to load invoice details");
                } finally {
                    setDetailsLoading(null);
                }
            }
        }
    };

    const handleInitiateReturn = async (sale: any, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to initiate a return for Barcode ${sale.barcode}?`)) return;
        
        setActionLoading(sale.id);
        try {
            const res = await fetch('/api/bch/sales/returns/initiate-return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salesOutId: sale.id, returnReason: 'Customer Return' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Return Initiated Successfully");
                // Refresh both current row details and the grouped list if needed
                if (sale.invoice_no) {
                    const detailRes = await fetch(`/api/bch/sales/process?invoiceNo=${sale.invoice_no}`);
                    const detailData = await detailRes.json();
                    if (detailData.success) {
                        setInvoiceDetails(prev => ({ ...prev, [sale.invoice_no]: detailData.salesOut }));
                    }
                }
                fetchData();
            } else {
                toast.error(data.error || "Failed to initiate return");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmQC = (ret: any) => {
        setSelectedReturn(ret);
        setIsQCModalOpen(true);
        setQcNotes("");
    };

    const submitQC = async (status: 'Passed' | 'Failed') => {
        if (!selectedReturn) return;
        
        setActionLoading(selectedReturn.id);
        try {
            const res = await fetch('/api/bch/sales/returns/qc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    returnId: selectedReturn.id,
                    qcStatus: status === 'Passed' ? 'Confirmed QC' : 'QC Failed',
                    notes: qcNotes,
                    restock: status === 'Passed'
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(status === 'Passed' ? "Product Restocked Successfully" : "QC Failed Recorded");
                setIsQCModalOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to process QC");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setActionLoading(null);
        }
    };


    return (
        <div className="sales-inventory-container">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="section-header"
            >
                <h2>
                    <i className="fas fa-boxes text-primary"></i>
                    Sales Inventory
                </h2>
                <p>Manage sold out products and track returns processed through the sales port</p>
            </motion.div>

            {/* Project Style Tabs */}
            <div className="dashboard-tabs">
                <nav className="tabs-nav">
                    <button
                        onClick={() => setActiveTab('out')}
                        className={`tab-btn ${activeTab === 'out' ? 'active' : ''}`}
                    >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Sales Out
                    </button>
                    <button
                        onClick={() => setActiveTab('returns')}
                        className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
                    >
                        <i className="fas fa-undo-alt mr-2"></i>
                        Sales Returns
                    </button>
                </nav>
            </div>

            <motion.div 
                layout
                className="table-container"
            >
                <div className="table-header-ui">
                    <h3>
                        <i className={`fas ${activeTab === 'out' ? 'fa-list-ul' : 'fa-history'} mr-2`}></i>
                        {activeTab === 'out' ? 'Active Sales Out Records' : 'Product Return History'}
                    </h3>
                    <button className="sync-btn" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Syncing...' : 'Refresh Data'}
                    </button>
                </div>

                <div className="data-table-wrapper">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <LoadingSpinner text="Syncing inventory records..." />
                        ) : activeTab === 'out' ? (
                            <motion.table 
                                key="out-table"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="data-table"
                            >
                                <thead>
                                    <tr>
                                        <th>Date of Sale Out</th>
                                        <th>Invoice Number</th>
                                        <th>Customer Name</th>
                                        <th style={{ textAlign: 'right' }}>Invoice Amount</th>
                                        <th style={{ textAlign: 'center' }}>Product Qty</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesOut.length > 0 ? salesOut.map((invoice) => (
                                        <React.Fragment key={invoice.invoice_no}>
                                            <tr 
                                                className={`clickable-row ${expandedInvoices.includes(invoice.invoice_no) ? 'active-row' : ''}`}
                                                onClick={() => toggleInvoice(invoice.invoice_no)}
                                            >
                                                <td>{new Date(invoice.sold_at).toLocaleDateString()}</td>
                                                <td className="order-id">{invoice.invoice_no}</td>
                                                <td>{invoice.customer_name || 'Walk-in Customer'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {invoice.total_amount ? `AED ${parseFloat(invoice.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'N/A'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="qty-badge">{invoice.product_quantity}</span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="action-btn-cell" style={{ border: 'none', background: 'none' }}>
                                                        <ChevronDown className={`chevron-icon ${expandedInvoices.includes(invoice.invoice_no) ? 'rotate-180' : ''}`} size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                            <AnimatePresence>
                                                {expandedInvoices.includes(invoice.invoice_no) && (
                                                    <tr>
                                                        <td colSpan={6} style={{ padding: 0 }}>
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="expanded-row-container"
                                                            >
                                                                {detailsLoading === invoice.invoice_no ? (
                                                                    <LoadingSpinner text="Loading details..." size={40} />
                                                                ) : (
                                                                    <div className="inner-table-wrapper">
                                                                        <table className="inner-table">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Seq</th>
                                                                                    <th>Date</th>
                                                                                    <th>Invoice No</th>
                                                                                    <th>Customer</th>
                                                                                    <th>Product Name</th>
                                                                                    <th>Generation</th>
                                                                                    <th>RAM</th>
                                                                                    <th>SSD</th>
                                                                                    <th>GPU</th>
                                                                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                                                                    <th style={{ textAlign: 'right' }}>Price</th>
                                                                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {invoiceDetails[invoice.invoice_no] && invoiceDetails[invoice.invoice_no].length > 0 ? (
                                                                                    invoiceDetails[invoice.invoice_no].map((item, index) => (
                                                                                        <tr key={item.id}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td style={{ fontSize: '0.75rem' }}>{new Date(item.sold_at).toLocaleDateString()}</td>
                                                                                            <td style={{ fontWeight: 500 }}>{item.invoice_no}</td>
                                                                                            <td>{item.display_customer_name || 'N/A'}</td>
                                                                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</td>
                                                                                            <td>{item.generation || 'N/A'}</td>
                                                                                            <td>{item.ram || 'N/A'}</td>
                                                                                            <td>{item.storage || 'N/A'}</td>
                                                                                            <td>{item.graphics || 'N/A'}</td>
                                                                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                                                                {item.price ? `AED ${parseFloat(item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'N/A'}
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'right' }}>
                                                                                                <button 
                                                                                                    onClick={(e) => handleInitiateReturn(item, e)}
                                                                                                    disabled={actionLoading === item.id}
                                                                                                    className="action-btn-cell"
                                                                                                    style={{ color: '#e67e22', border: '1px solid #f39c12', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' }}
                                                                                                >
                                                                                                    {actionLoading === item.id ? (
                                                                                                        <RefreshCw className="animate-spin w-3 h-3" />
                                                                                                    ) : (
                                                                                                        <><Undo2 className="w-3 h-3 inline mr-1" /> Return</>
                                                                                                    )}
                                                                                                </button>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                                                            {detailsLoading === invoice.invoice_no ? 'Loading details...' : 'No items found for this invoice.'}
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="empty-tab-state">
                                                <i className="fas fa-box-open empty-icon"></i>
                                                <h3>No active Sales Out records</h3>
                                                <p>Processed sales items will appear here.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </motion.table>
                        ) : (
                            <div className="table-container" style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Seq</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Date</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Invoice No</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Customer</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Product Name</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Generation</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>RAM</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>SSD</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>GPU</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Qty</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Price</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesReturns.length > 0 ? salesReturns.map((ret, index) => (
                                            <tr key={ret.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontWeight: 600, color: '#64748b' }}>{index + 1}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                    {new Date(ret.initiated_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem', color: '#0ea5e9', fontWeight: 700 }}>{ret.invoice_no}</td>
                                                <td style={{ padding: '1rem', fontWeight: 500 }}>{ret.customer_name || 'Walk-in'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{ret.product_name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{ret.barcode}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{ret.generation || '-'}</td>
                                                <td style={{ padding: '1rem' }}>{ret.ram || '-'}</td>
                                                <td style={{ padding: '1rem' }}>{ret.ssd || '-'}</td>
                                                <td style={{ padding: '1rem' }}>{ret.gpu || '-'}</td>
                                                <td style={{ padding: '1rem' }}>{ret.quantity || 1}</td>
                                                <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b' }}>
                                                    {ret.unit_price ? `${ret.unit_price}` : '-'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    {ret.qc_status === 'Pending QC' ? (
                                                        <button 
                                                            onClick={() => handleConfirmQC(ret)}
                                                            style={{ 
                                                                background: '#4f46e5', 
                                                                color: 'white', 
                                                                border: 'none', 
                                                                borderRadius: '6px', 
                                                                padding: '6px 12px', 
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                            disabled={actionLoading === ret.id}
                                                        >
                                                            <i className="fas fa-arrow-right"></i>
                                                            Send to Production
                                                        </button>
                                                    ) : (
                                                        <span style={{ 
                                                            padding: '4px 10px', 
                                                            borderRadius: '12px', 
                                                            background: '#dcfce7', 
                                                            color: '#15803d', 
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700
                                                        }}>
                                                            QC PASSED
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={12} style={{ textAlign: 'center', padding: '4rem' }}>
                                                    <i className="fas fa-history" style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '1rem', display: 'block' }}></i>
                                                    <h3 style={{ color: '#64748b' }}>No active returns</h3>
                                                    <p style={{ color: '#94a3b8' }}>Initiated returns will appear here.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* QC Inspection Modal */}
            <AnimatePresence>
                {isQCModalOpen && selectedReturn && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: 'white', borderRadius: '20px', width: '90%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                        >
                            <div style={{ padding: '1.5rem', background: '#4f46e5', color: 'white' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>QC Inspection</h2>
                                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Barcode: {selectedReturn.barcode}</p>
                            </div>
                            
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedReturn.product_name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                                        Specs: {selectedReturn.ram || '-'} / {selectedReturn.ssd || '-'} / {selectedReturn.gpu || '-'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                        Reason: {selectedReturn.return_reason}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>QC Notes</label>
                                    <textarea 
                                        value={qcNotes}
                                        onChange={(e) => setQcNotes(e.target.value)}
                                        placeholder="Enter inspection details..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '0.9rem' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        onClick={() => submitQC('Passed')}
                                        disabled={actionLoading === selectedReturn.id}
                                        style={{ flex: 1, background: '#4f46e5', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                    >
                                        <i className="fas fa-paper-plane" style={{ fontSize: '1.2rem', marginBottom: '4px' }}></i>
                                        SEND TO PRODUCTION
                                    </button>
                                    <button 
                                        onClick={() => submitQC('Failed')}
                                        disabled={actionLoading === selectedReturn.id}
                                        style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                    >
                                        <i className="fas fa-times-circle" style={{ fontSize: '1.2rem', marginBottom: '4px' }}></i>
                                        REJECT RETURN
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setIsQCModalOpen(false)}
                                    style={{ width: '100%', marginTop: '1rem', background: 'transparent', color: '#64748b', border: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
                                >
                                    Cancel Inspection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
