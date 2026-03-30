"use client";

import React, { useState, useEffect, useCallback } from "react";
import OrderList from "../../invoicing/OrderList";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function OrderDashboardPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/bch/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error("Failed to fetch orders");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleEdit = (order: any) => {
        router.push(`/bch/Order/createorder?id=${order.id}`);
    };

    const handleDelete = async (order: any) => {
        if (!confirm(`Are you sure you want to delete order ${order.order_number}?`)) return;
        try {
            const res = await fetch(`/api/bch/orders?id=${order.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Order deleted");
                fetchOrders();
            }
        } catch (error) {
            toast.error("Failed to delete order");
        }
    };

    return (
        <OrderList
            orders={orders}
            loading={isLoading}
            onRefresh={fetchOrders}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    );
}
