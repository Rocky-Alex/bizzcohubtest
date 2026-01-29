"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../components/LoadingSpinner";

const ActivityLog = dynamic(() => import("../activity-log/ActivityLog"), { loading: () => <LoadingSpinner /> });

export default function ActivityLogPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <ActivityLog />
        </div>
    );
}
