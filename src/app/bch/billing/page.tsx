"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyBillingPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/bch/billing/dashboard');
    }, [router]);

    return null;
}
