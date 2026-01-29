"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../../../components/LoadingSpinner";

const PartialPaymentsList = dynamic(() => import("../../components/PartialPaymentsList"), { loading: () => <LoadingSpinner /> });

export default function PaymentsPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <PartialPaymentsList setActiveSection={(section) => console.log("Navigate to", section)} />
        </div>
    );
}
