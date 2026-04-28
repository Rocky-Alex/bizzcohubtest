"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import OrderList from "../invoicing/OrderList";
import CreateOrder from "../invoicing/CreateOrder";
import ComingSoon from "../shared/ComingSoon";
import { toast } from "sonner";

import { useSearchParams } from 'next/navigation';

export default function OrdersPage() {
    return (
        <Suspense fallback={<div>Loading Orders...</div>}>
            <OrdersPageContent />
        </Suspense>
    );
}

function OrdersPageContent() {
    const searchParams = useSearchParams();
    const initialView = (searchParams.get('view') as 'list' | 'create' | 'edit' | 'returns') || 'list';

    const [view, setView] = useState<'list' | 'create' | 'edit' | 'returns'>(initialView);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<any>(null);

    // Update view when URL changes
    useEffect(() => {
        const currentView = (searchParams.get('view') as 'list' | 'create' | 'edit' | 'returns') || 'list';
        setView(currentView);
    }, [searchParams]);

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
        setOrderToEdit(order);
        setView('edit');
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

    if (view === 'create' || view === 'edit') {
        return (
            <CreateOrder
                onOrderCreated={() => { setView('list'); setOrderToEdit(null); fetchOrders(); }}
                initialData={orderToEdit}
            />
        );
    }

    if (view === 'returns') {
        return <ComingSoon title="Order Returns" description="Return management is coming soon." />;
    }

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
