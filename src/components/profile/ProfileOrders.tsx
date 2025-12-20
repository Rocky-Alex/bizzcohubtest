import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import ConfirmModal from '../ui/ConfirmModal';
import './profile-orders.css';

interface OrderItem {
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    order_number: string;
    created_at: string;
    status: string;
    items: OrderItem[];
    total: number;
    payment_method: string;
}

interface ProfileOrdersProps {
    filterType: 'all' | 'returns' | 'cancelled' | 'delivered';
    user: any;
}

export default function ProfileOrders({ filterType, user }: ProfileOrdersProps) {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);

    // Modal States
    const [cancelModal, setCancelModal] = useState({ open: false, orderId: 0 });
    const [returnModal, setReturnModal] = useState({ open: false, orderId: 0 });
    const [trackModal, setTrackModal] = useState({ open: false, order: null as Order | null });

    useEffect(() => {
        if (user && user.id) {
            fetchOrders(user.id);
        }
    }, [user]);

    const fetchOrders = async (customerId: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/customer/orders?customer_id=${customerId}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            } else {
                toast.error("Failed to load orders");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Error loading orders");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelModal.orderId) return;

        try {
            const res = await fetch('/api/customer/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: cancelModal.orderId,
                    action: 'cancel',
                    customer_id: user.id
                })
            });

            if (res.ok) {
                toast.success("Order cancelled successfully");
                setOrders(prev => prev.map(o =>
                    o.id === cancelModal.orderId ? { ...o, status: 'Cancelled' } : o
                ));
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to cancel order");
            }
        } catch (error) {
            console.error("Cancel error:", error);
            toast.error("An error occurred");
        } finally {
            setCancelModal({ open: false, orderId: 0 });
        }
    };

    const handleReturnOrder = async () => {
        if (!returnModal.orderId) return;

        try {
            const res = await fetch('/api/customer/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: returnModal.orderId,
                    action: 'return',
                    customer_id: user.id
                })
            });

            if (res.ok) {
                toast.success("Return request submitted");
                setOrders(prev => prev.map(o =>
                    o.id === returnModal.orderId ? { ...o, status: 'Return Requested' } : o
                ));
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to request return");
            }
        } catch (error) {
            console.error("Return error:", error);
            toast.error("An error occurred");
        } finally {
            setReturnModal({ open: false, orderId: 0 });
        }
    };

    const filteredOrders = orders.filter(order => {
        const s = (order.status || '').toLowerCase();

        if (filterType === 'all') {
            // "All Orders" usually implies everything, or maybe exclude cancelled/returned?
            // The user wanted "separate" lists.
            // Let's assume 'all' means actual normal orders (active + delivered)
            // Or truly ALL. Let's start with truly ALL, but if 'returns' and 'cancelled' are separate tabs, maybe 'all' shouldn't duplicate them?
            // Usually 'All Orders' lists everything.
            return true;
        }

        if (filterType === 'returns') {
            return ['return requested', 'return approved', 'return received', 'returned'].includes(s);
        }

        if (filterType === 'cancelled') {
            return ['cancelled', 'refunded'].includes(s);
        }

        if (filterType === 'delivered') {
            return s === 'delivered';
        }

        return true;
    });

    if (loading) {
        return (
            <div className="profile-orders-container" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ color: '#94a3b8' }}>Loading orders...</div>
            </div>
        );
    }

    return (
        <div className="profile-orders-container">
            <h2 className="orders-title">
                {filterType === 'all' && 'All Orders'}
                {filterType === 'delivered' && 'Delivered Orders'}
                {filterType === 'returns' && 'Returns'}
                {filterType === 'cancelled' && 'Cancelled Orders'}
            </h2>

            <div className="orders-list">
                {filteredOrders.length === 0 ? (
                    <div className="empty-orders">
                        <div className="empty-icon">
                            <i className="fas fa-box-open"></i>
                        </div>
                        <h3>No orders found</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>No orders in this category.</p>
                        <Link href="/products" className="btn-action btn-track" style={{ display: 'inline-flex' }}>
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <div className="order-id-group">
                                    <span className="order-number">#{order.order_number}</span>
                                    <span className="order-date">
                                        {new Date(order.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <span className={`order-status status-${order.status.toLowerCase().replace(' ', '-')}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="order-body">
                                <div className="order-items">
                                    {order.items.slice(0, 4).map((item, idx) => (
                                        <img
                                            key={idx}
                                            src={item.image || '/placeholder.svg'}
                                            alt={item.name}
                                            className="item-preview"
                                        />
                                    ))}
                                    {order.items.length > 4 && (
                                        <div className="item-more">+{order.items.length - 4}</div>
                                    )}
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        <span className="total-label">Total Amount</span>
                                        <span className="total-amount">AED {Number(order.total).toLocaleString()}</span>
                                    </div>

                                    <div className="order-actions">
                                        <button
                                            className="btn-action btn-track"
                                            onClick={() => setTrackModal({ open: true, order })}
                                        >
                                            <i className="fas fa-map-marker-alt"></i> Track
                                        </button>

                                        {['Pending', 'Processing'].includes(order.status) && (
                                            <button
                                                className="btn-action btn-danger"
                                                onClick={() => setCancelModal({ open: true, orderId: order.id })}
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        {order.status === 'Delivered' && (
                                            <button
                                                className="btn-action btn-secondary"
                                                onClick={() => setReturnModal({ open: true, orderId: order.id })}
                                                title="Return valid within 7 days of delivery"
                                            >
                                                Return
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={cancelModal.open}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action cannot be undone."
                onConfirm={handleCancelOrder}
                onCancel={() => setCancelModal({ open: false, orderId: 0 })}
                confirmText="Yes, Cancel"
                type="danger"
            />

            <ConfirmModal
                isOpen={returnModal.open}
                title="Request Return"
                message="Are you sure you want to request a return? Our team will contact you shortly."
                onConfirm={handleReturnOrder}
                onCancel={() => setReturnModal({ open: false, orderId: 0 })}
                confirmText="Request Return"
                type="info"
            />

            {/* Tracking Modal */}
            {trackModal.open && trackModal.order && (
                <div className="custom-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setTrackModal({ open: false, order: null })}>
                    <div className="custom-modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Track Order #{trackModal.order.order_number}</h3>
                            <button onClick={() => setTrackModal({ open: false, order: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>

                        <div className="tracking-steps">
                            {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                                const statusMap: { [key: string]: number } = {
                                    'Pending': 0, 'Processing': 1, 'Shipped': 2, 'Delivered': 3, 'Cancelled': -1, 'Returned': 3
                                };
                                const currentStepIdx = statusMap[trackModal.order!.status] ?? 0;
                                const isCompleted = index <= currentStepIdx;
                                const isCurrent = index === currentStepIdx;

                                return (
                                    <div key={step} className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                                        <div className="step-icon">
                                            {isCompleted ? <i className="fas fa-check"></i> : <i className="fas fa-circle" style={{ fontSize: '0.4rem' }}></i>}
                                        </div>
                                        <span className="step-label">{step}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'left' }}>
                            <strong>Current Status:</strong> {trackModal.order.status}
                            <br />
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Updated: {new Date(trackModal.order.created_at).toLocaleString()}
                            </span>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button className="btn-action btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setTrackModal({ open: false, order: null })}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
