"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { toast } from "sonner";

const OrderList = dynamic(() => import("../../components/OrderList"), { loading: () => <LoadingSpinner /> });

export default function OrderReturnsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/orders');
            if (response.ok) {
                const data = await response.json();
                // Filter for returns
                const allOrders = data.orders || [];
                const returnOrders = allOrders.filter((o: any) =>
                    o.status.toLowerCase().includes('return')
                );
                setOrders(returnOrders);
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

    return (
        <div style={{ padding: '1rem' }}>
            <OrderList
                orders={orders}
                loading={isLoading}
                onRefresh={fetchOrders}
                title="Order Returns"
            />
        </div>
    );
}
