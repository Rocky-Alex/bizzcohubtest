import React, { useState } from 'react';
import '../styles/order-details.css';
import ConfirmModal from './ConfirmModal';

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    total: number;
    status: string;
    items: any[];
    created_at: string;
}

interface OrderDetailsModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: number, status: string) => Promise<void>;
}

export default function OrderDetailsModal({ order, isOpen, onClose, onUpdateStatus }: OrderDetailsModalProps) {
    const [updating, setUpdating] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        statusToSet: ''
    });

    if (!isOpen || !order) return null;

    const steps = ['Pending', 'Processing', 'Shipped', 'Completed'];
    const currentStepIndex = steps.indexOf(order.status) === -1 ? 0 : steps.indexOf(order.status);
    const isCancelled = order.status === 'Cancelled';

    const handleStatusClick = (status: string) => {
        if (updating || status === order.status) return;

        setConfirmModal({
            isOpen: true,
            title: status === 'Cancelled' ? 'Cancel Order' : 'Update Status',
            message: status === 'Cancelled'
                ? 'Are you sure you want to cancel this order? This action cannot be undone.'
                : `Are you sure you want to change the status to ${status}?`,
            statusToSet: status
        });
    };

    const confirmStatusUpdate = async () => {
        if (!confirmModal.statusToSet) return;
        setUpdating(true);
        await onUpdateStatus(order.id, confirmModal.statusToSet);
        setUpdating(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        <h2>
                            <i className="fas fa-file-invoice-dollar" style={{ color: '#3b82f6' }}></i>
                            Order #{order.order_number}
                        </h2>
                        <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 400 }}>
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    type={confirmModal.statusToSet === 'Cancelled' ? 'danger' : 'info'}
                    onConfirm={confirmStatusUpdate}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    confirmText={confirmModal.statusToSet === 'Cancelled' ? 'Cancel Order' : 'Update'}
                />

                {/* Body */}
                <div className="modal-body">

                    {/* Status Tracker */}
                    <div className="status-tracker">
                        <div className="progress-bar-bg"></div>
                        <div
                            className="progress-bar-fill"
                            style={{ width: isCancelled ? '0%' : `${(currentStepIndex / (steps.length - 1)) * 100}%`, background: isCancelled ? '#ef4444' : '#10b981' }}
                        ></div>

                        <div className="status-steps">
                            {steps.map((step, idx) => {
                                const isCompleted = idx < currentStepIndex && !isCancelled;
                                const isActive = idx === currentStepIndex && !isCancelled;

                                return (
                                    <div
                                        key={step}
                                        className={`status-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                        onClick={() => handleStatusClick(step)}
                                    >
                                        <div className="step-icon">
                                            {isCompleted ? <i className="fas fa-check"></i> : <i className="fas fa-circle" style={{ fontSize: '10px' }}></i>}
                                        </div>
                                        <span className="step-label">{step}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {isCancelled && (
                            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#ef4444', fontWeight: 600 }}>
                                <i className="fas fa-ban"></i> Order Cancelled
                            </div>
                        )}
                    </div>

                    {/* Check / Actions Row */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                        {!isCancelled && order.status !== 'Completed' && (
                            <button className="btn btn-primary" onClick={() => handleStatusClick(steps[currentStepIndex + 1])} disabled={currentStepIndex >= 3}>
                                Advance Status <i className="fas fa-arrow-right"></i>
                            </button>
                        )}
                        {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                            <button className="btn btn-danger" onClick={() => handleStatusClick('Cancelled')}>
                                Cancel Order
                            </button>
                        )}
                    </div>


                    {/* Two Column Layout */}
                    <div className="details-grid">
                        <div className="detail-section">
                            <h3>Customer Details</h3>
                            <div className="info-row">
                                <span className="info-label">Name:</span>
                                <span className="info-value">{order.customer_name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{order.email}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Phone:</span>
                                <span className="info-value">{order.phone}</span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3>Shipping Address</h3>
                            <div className="info-row">
                                <span className="info-label">Address:</span>
                                <span className="info-value">{order.address || '-'}</span>
                            </div>
                            {(order.city || order.country) && (
                                <div className="info-row">
                                    <span className="info-label">City/State:</span>
                                    <span className="info-value">
                                        {[order.city, order.country].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="detail-section">
                        <h3>Order Items</h3>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Processor</th>
                                    <th>Generation</th>
                                    <th>RAM</th>
                                    <th>SSD</th>
                                    <th>Graphics</th>
                                    <th>AC Status</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(order.items) && order.items.map((item: any, i: number) => {
                                    // Handle legacy "name" if granular fields aren't saved or just use 'name' if that's what we have
                                    // For new orders, we expect brand, series, model etc.
                                    // If granular fields are missing, we might only show item.name in Product col.
                                    const productName = item.brand && item.series && item.model
                                        ? `${item.brand} ${item.series} ${item.model}`
                                        : item.name;

                                    return (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <img
                                                        src={item.image || '/placeholder.svg'}
                                                        alt={productName}
                                                        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                                    />
                                                    <span style={{ fontWeight: 500 }}>{productName}</span>
                                                </div>
                                            </td>
                                            <td>{item.processor || '-'}</td>
                                            <td>{item.generation || '-'}</td>
                                            <td>{item.ram || '-'}</td>
                                            <td>{item.ssd || '-'}</td>
                                            <td>{item.graphics || '-'}</td>
                                            <td>{item.acStatus || '-'}</td>
                                            <td>{item.quantity}</td>
                                            <td>AED {item.price}</td>
                                            <td style={{ fontWeight: 600 }}>AED {(item.price * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '2rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>Total Amount</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                                AED {Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <i className="fas fa-print"></i> Print Invoice
                    </button>
                </div>

            </div>
        </div>
    );
}
