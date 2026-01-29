"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/dashboard');
    }, [router]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
            <LoadingSpinner />
        </div>
    );
}
