"use client";

import { useEffect } from "react";

export default function AutoRefresh() {
    useEffect(() => {
        // Refresh the page every 30 seconds
        const interval = setInterval(() => {
            console.log("Auto-refreshing page...");
            window.location.reload();
        }, 3000000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    return null; // This component renders nothing
}
