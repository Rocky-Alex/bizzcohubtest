"use client";

import React, { useState, useEffect } from "react";
import CreateInvoice from "../../invoicing/CreateInvoice";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function CreateInvoicePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('id');
    const isConversion = searchParams.get('convert') === 'true';
    
    const [dataToEdit, setDataToEdit] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(!!invoiceId || isConversion);

    useEffect(() => {
        if (invoiceId) {
            const fetchInvoice = async () => {
                try {
                    const res = await fetch(`/api/bch/invoices/${invoiceId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setDataToEdit(data.invoice);
                    }
                } catch (error) {
                    console.error("Error fetching invoice:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInvoice();
        } else if (isConversion) {
            const storedData = sessionStorage.getItem('conversion_data');
            if (storedData) {
                setDataToEdit(JSON.parse(storedData));
                sessionStorage.removeItem('conversion_data');
            }
            setIsLoading(false);
        }
    }, [invoiceId, isConversion]);

    const handleSetActiveSection = () => {
        router.push('/bch/billing/allbills');
    };

    if (isLoading) return <LoadingSpinner fullScreen />;

    return <CreateInvoice setActiveSection={handleSetActiveSection} initialData={dataToEdit} />;
}
