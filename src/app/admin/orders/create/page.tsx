"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useRouter } from "next/navigation";

const CreateOrder = dynamic(() => import("../../components/CreateOrder"), { loading: () => <LoadingSpinner /> });

export default function CreateOrderPage() {
    const router = useRouter();

    const handleOrderCreated = () => {
        router.push('/admin/orders');
    };

    return (
        <div style={{ padding: '1rem' }}>
            <CreateOrder onOrderCreated={handleOrderCreated} />
        </div>
    );
}
