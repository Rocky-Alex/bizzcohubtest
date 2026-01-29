"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../components/LoadingSpinner";

const QuickActions = dynamic(() => import("../components/QuickActions"), { loading: () => <LoadingSpinner /> });

export default function QuickActionsPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <QuickActions setActiveSection={() => { }} />
        </div>
    );
}
