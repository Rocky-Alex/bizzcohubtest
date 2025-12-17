import React, { useState, useMemo } from 'react';
import "../styles/order-list.css";
import OrderDetailsModal from './OrderDetailsModal';

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
    created_at: string;
    items: any[];
}

interface OrderListProps {
    orders: Order[];
    loading: boolean;
    onViewDetails?: (order: Order) => void;
    onRefresh: () => void;
}

const OrderList = ({
    orders,
    loading,
    onRefresh,
    onEdit,
    onDelete
}: {
    orders: Order[],
    loading: boolean,
    onRefresh: () => void,
    onEdit?: (order: Order) => void,
    onDelete?: (order: Order) => void
}) => {
    // --- Auto Refresh Logic ---
    React.useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const setupAutoRefresh = () => {
            const enabled = localStorage.getItem('autoRefreshEnabled') === 'true';
            if (!enabled) {
                if (intervalId) clearInterval(intervalId);
                return;
            }

            const h = parseInt(localStorage.getItem('autoRefreshHours') || '0');
            const m = parseInt(localStorage.getItem('autoRefreshMinutes') || '0');
            const s = parseInt(localStorage.getItem('autoRefreshSeconds') || '0');
            const totalMs = (h * 3600 + m * 60 + s) * 1000;

            if (totalMs > 0) {
                if (intervalId) clearInterval(intervalId);
                intervalId = setInterval(() => {
                    onRefresh();
                    localStorage.setItem('lastAutoRefresh', Date.now().toString());
                }, totalMs);
            }
        };

        setupAutoRefresh();

        const handleSettingsChange = () => {
            setupAutoRefresh();
        };

        window.addEventListener('autoRefreshSettingsChanged', handleSettingsChange);
        return () => {
            window.removeEventListener('autoRefreshSettingsChanged', handleSettingsChange);
            if (intervalId) clearInterval(intervalId);
        };
    }, [onRefresh]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Computed Stats ---
    const stats = useMemo(() => {
        const total = orders.length;
        const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const pending = orders.filter(o => o.status.toLowerCase() === 'pending').length;
        const processing = orders.filter(o => o.status.toLowerCase() === 'processing').length;
        return { total, revenue, pending, processing };
    }, [orders]);

    // --- Filtering ---
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'All' || order.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            case 'processing': return 'info';
            case 'shipped': return 'info';
            default: return 'secondary';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            const response = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });

            if (response.ok) {
                // Update local state temporarily to reflect change immediately
                setSelectedOrder(prev => prev ? { ...prev, status } : null);

                // Refresh parent list
                onRefresh();
            } else {
                const errorData = await response.json();
                console.error("Status update failed:", errorData);
                alert(`Failed to update status: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error("Network error updating status:", error);
            alert("Error updating status: " + (error instanceof Error ? error.message : String(error)));
        }
    };

    return (
        <div className="admin-section active">
            <div className="section-header">
                <div>
                    <h2><i className="fas fa-shopping-cart" style={{ color: '#3b82f6' }}></i> Order Management</h2>
                    <p>Track and manage your customer orders.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <i className="fas fa-shopping-bag"></i>
                    </div>
                    <div className="stat-details">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className="fas fa-wallet"></i>
                    </div>
                    <div className="stat-details">
                        <span className="stat-value">AED {stats.revenue.toLocaleString()}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-details">
                        <span className="stat-value">{stats.pending}</span>
                        <span className="stat-label">Pending Orders</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <i className="fas fa-cog fa-spin"></i>
                    </div>
                    <div className="stat-details">
                        <span className="stat-value">{stats.processing}</span>
                        <span className="stat-label">Processing</span>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="controls-bar">
                <div className="search-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search by ID, Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    {['All', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(status => (
                        <button
                            key={status}
                            className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="table-card">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#3b82f6' }}></i>
                        <p>Loading orders data...</p>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Order No</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 600, color: '#374151' }}>
                                        #{order.order_number}
                                    </td>
                                    <td style={{ fontWeight: 600, color: '#6b7280', fontSize: '0.9rem' }}>
                                        SO-{100 + order.id}
                                    </td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {getInitials(order.customer_name)}
                                            </div>
                                            <div className="user-info">
                                                <span className="name">{order.customer_name}</span>
                                                <span className="email">{order.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                        {new Date(order.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                        <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            background: '#f3f4f6',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            color: '#4b5563'
                                        }}>
                                            {Array.isArray(order.items) ? order.items.length : 0} items
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#111827' }}>
                                        AED {Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon-soft view"
                                                title="View Details"
                                                onClick={() => handleViewOrder(order)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                className="btn-icon-soft edit"
                                                title="Edit Order"
                                                onClick={() => onEdit && onEdit(order)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-icon-soft delete"
                                                title="Delete Order"
                                                onClick={() => onDelete && onDelete(order)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                            <button
                                                className="btn-icon-soft"
                                                title="Print Invoice"
                                            >
                                                <i className="fas fa-print"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#f3f4f6',
                            borderRadius: '50%', margin: '0 auto 1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', color: '#9ca3af'
                        }}>
                            <i className="fas fa-box-open"></i>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>No orders found</h3>
                        <p style={{ color: '#6b7280' }}>Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

            <OrderDetailsModal
                isOpen={isModalOpen}
                order={selectedOrder}
                onClose={() => setIsModalOpen(false)}
                onUpdateStatus={handleUpdateStatus}
            />
        </div>
    );
};

export default OrderList;
