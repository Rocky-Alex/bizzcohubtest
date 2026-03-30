"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PurchaseLotList from "../../purchase/components/PurchaseLotList/PurchaseLotList";

export default function PurchaseLotPage() {
    const router = useRouter();

    return (
        <div className="purchase-page-container" style={{ padding: '0.5rem' }}>
            <PurchaseLotList 
                onViewDetail={(id: number) => router.push(`/bch/purchase?section=purchase-lot-details&id=${id}`)} 
            />
        </div>
    );
}
