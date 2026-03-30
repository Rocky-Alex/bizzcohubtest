"use client";

import React, { useState, useEffect } from "react";
import CreateOrder from "../../invoicing/CreateOrder";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function CreateOrderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const [orderToEdit, setOrderToEdit] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(!!orderId);

    useEffect(() => {
        if (orderId) {
            const fetchOrder = async () => {
                try {
                    const res = await fetch(`/api/bch/orders?id=${orderId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setOrderToEdit(data.order);
                    }
                } catch (error) {
                    console.error("Error fetching order for edit:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchOrder();
        }
    }, [orderId]);

    if (isLoading) return <LoadingSpinner fullScreen />;

    return (
        <CreateOrder
            onOrderCreated={() => {
                router.push('/bch/Order/dashboard');
            }}
            initialData={orderToEdit}
        />
    );
}
