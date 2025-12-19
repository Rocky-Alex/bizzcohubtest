"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import './orders.css';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Link from 'next/link';
import '@/components/ui/confirm-modal.css';

interface OrderItem {
    id: string; // or number depending on how it's stored in JSON
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

export default function OrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState('All');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Modal States
    const [cancelModal, setCancelModal] = useState({ open: false, orderId: 0 });
    const [returnModal, setReturnModal] = useState({ open: false, orderId: 0 });
    const [trackModal, setTrackModal] = useState({ open: false, order: null as Order | null });

    useEffect(() => {
        const storedUser = localStorage.getItem('customer_user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        fetchOrders(user.id);
    }, [router]);

    const fetchOrders = async (customerId: number) => {
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
                    customer_id: currentUser.id
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
                    customer_id: currentUser.id
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
        if (activeTab === 'All') return true;
        if (activeTab === 'Active') return ['pending', 'processing', 'shipped'].includes(s);
        if (activeTab === 'Delivered') return s === 'delivered';
        if (activeTab === 'Cancelled') return ['cancelled', 'refunded', 'return requested', 'return approved', 'return received', 'returned'].includes(s);
        return true;
    });

    if (loading) {
        return (
            <div className="orders-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Loading your orders...</div>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <div className="orders-header">
                <h1 className="orders-title">My Orders</h1>
                <p className="orders-subtitle">Track and manage your recent purchases</p>
            </div>

            {/* Tabs */}
            <div className="orders-tabs">
                {['All', 'Active', 'Delivered', 'Cancelled'].map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="orders-list">
                {filteredOrders.length === 0 ? (
                    <div className="empty-orders">
                        <div className="empty-icon">
                            <i className="fas fa-box-open"></i>
                        </div>
                        <h3>No orders found</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Looks like you haven't placed any orders in this category yet.</p>
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
                                            <i className="fas fa-map-marker-alt"></i> Track Order
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
                                            >
                                                Return Item
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
                confirmText="Yes, Cancel Order"
                type="danger"
            />

            <ConfirmModal
                isOpen={returnModal.open}
                title="Request Return"
                message="Are you sure you want to request a return for this order? Our team will contact you shortly."
                onConfirm={handleReturnOrder}
                onCancel={() => setReturnModal({ open: false, orderId: 0 })}
                confirmText="Request Return"
                type="info"
            />

            {/* Tracking Modal (Custom) */}
            {trackModal.open && trackModal.order && (
                <div className="custom-modal-overlay" onClick={() => setTrackModal({ open: false, order: null })}>
                    <div className="custom-modal-content" style={{ maxWidth: '600px', width: '95%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Track Order #{trackModal.order.order_number}</h3>
                            <button onClick={() => setTrackModal({ open: false, order: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
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
                                            {isCompleted ? <i className="fas fa-check"></i> : <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i>}
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
