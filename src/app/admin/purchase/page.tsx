"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useTheme } from "@/context/ThemeContext";

const PurchaseDashboard = dynamic(() => import("./components/PurchaseDashboard/PurchaseDashboard"), { loading: () => <LoadingSpinner /> });
const ImportPurchaseLot = dynamic(() => import('./components/ImportPurchaseLot/ImportPurchaseLot'), { loading: () => <LoadingSpinner /> });
const PurchaseLotList = dynamic(() => import('./components/PurchaseLotList/PurchaseLotList'), { loading: () => <LoadingSpinner /> });
const PurchaseLotDetails = dynamic(() => import('./components/PurchaseLotDetails/PurchaseLotDetails'), { loading: () => <LoadingSpinner /> });
const ImportFullPurchase = dynamic(() => import('./components/ImportFullPurchase/ImportFullPurchase'), { loading: () => <LoadingSpinner /> });
const ComingSoon = dynamic(() => import("../shared/ComingSoon"), { loading: () => <LoadingSpinner /> });

export default function PurchasePage() {
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const section = searchParams.get('section') || 'purchase-dashboard';

    const setActiveSection = (section: string) => {
        router.push(`/admin/purchase?section=${section}`);
    };

    return (
        <div className="purchase-page-container" style={{ padding: '0.5rem' }}>
            {section === 'purchase-dashboard' && <PurchaseDashboard setActiveSection={setActiveSection} />}
            {section === 'purchase-lots-import' && <ImportPurchaseLot onCancel={() => setActiveSection('purchase-lots-list')} onSuccess={() => setActiveSection('purchase-lots-list')} />}
            {section === 'purchase-lots-list' && <PurchaseLotList onViewDetail={(id: number) => router.push(`/admin/purchase?section=purchase-lot-details&id=${id}`)} />}
            {section === 'purchase-lot-details' && <PurchaseLotDetails lotId={parseInt(searchParams.get('id') || '0')} onBack={() => setActiveSection('purchase-lots-list')} />}
            {section === 'purchase-import-full' && <ImportFullPurchase onCancel={() => setActiveSection('purchase-dashboard')} onSuccess={() => setActiveSection('purchase-lots-list')} />}
            {section === 'suppliers' && (
                <ComingSoon
                    title="Supplier Management"
                    description="View and manage your product suppliers."
                />
            )}
        </div>
    );
}
