"use client";

import React, { useState, useEffect } from "react";
import CreateQuotation from "../../invoicing/CreateQuotation";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "../../../components/LoadingSpinner";

import { Suspense } from "react";

export default function CreateProformaPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullScreen text="Preparing Quotation Editor..." />}>
            <CreateProformaPageContent />
        </Suspense>
    );
}

function CreateProformaPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quotationId = searchParams.get('id');
    
    const [dataToEdit, setDataToEdit] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(!!quotationId);

    useEffect(() => {
        if (quotationId) {
            const fetchQuotation = async () => {
                try {
                    const res = await fetch(`/api/bch/quotations/${quotationId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setDataToEdit(data.quotation);
                    }
                } catch (error) {
                    console.error("Error fetching quotation:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchQuotation();
        }
    }, [quotationId]);

    const handleSetActiveSection = () => {
        router.push('/bch/billing/allbills');
    };

    if (isLoading) return <LoadingSpinner fullScreen />;

    return <CreateQuotation setActiveSection={handleSetActiveSection} initialData={dataToEdit} />;
}

