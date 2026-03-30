"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/app/components/LoadingSpinner";

const SaleOut = dynamic(() => import("../components/SaleOut/SaleOut"), {
    loading: () => <LoadingSpinner />
});

export default function SoldOutPage() {
    return (
        <div style={{ padding: '0.5rem' }}>
            <SaleOut />
        </div>
    );
}
