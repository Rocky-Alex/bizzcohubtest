"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "sonner";

const OrderList = dynamic(() => import("../components/OrderList"), { loading: () => <LoadingSpinner /> });

export default function OrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            } else {
                toast.error("Failed to fetch orders");
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error("Internal server error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleEdit = (order: any) => {
        // Navigate to edit page or open modal
        // For now, let's assume we navigate to a detail/edit page if available, or just log
        // Ideally: router.push(`/admin/orders/${order.id}`);
        // But based on previous monolithic structure, it might have been inline.
        // Let's implement navigation to a create/edit page if it exists or we will make one.
        // For now, we'll use a query param or just log implementation pending.
        console.log("Edit order", order);
        toast.info("Edit functionality coming soon");
    };

    const handleDelete = async (order: any) => {
        if (!confirm(`Are you sure you want to delete order #${order.order_number}?`)) return;

        try {
            const res = await fetch(`/api/admin/orders?id=${order.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Order deleted");
                fetchOrders();
                // Update dashboard stats cache if needed
                localStorage.setItem('dashboardLastUpdated', Date.now().toString());
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to delete order");
            }
        } catch (err) {
            console.error('Error deleting order:', err);
            toast.error("Error deleting order");
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <OrderList
                orders={orders}
                loading={isLoading}
                onRefresh={fetchOrders}
                onEdit={handleEdit}
                onDelete={handleDelete}
                title="All Orders"
            />
        </div>
    );
}
