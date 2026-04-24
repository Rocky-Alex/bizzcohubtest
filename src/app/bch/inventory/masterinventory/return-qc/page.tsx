"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function ReturnQCSection() {
    const [pendingQC, setPendingQC] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchPendingQC();
    }, []);

    const fetchPendingQC = async () => {
        try {
            // Fetch returns with status 'Pending QC'
            const res = await fetch('/api/bch/sales/returns/qc?status=Pending%20QC');
            const data = await res.json();
            if (data.success) {
                setPendingQC(data.returns);
            }
        } catch (e) {
            toast.error("Failed to load QC items.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmQC = async (ret: any) => {
        if (!confirm(`Confirm QC and Restock Barcode ${ret.barcode}?`)) return;

        setActionLoading(ret.id);
        try {
            const res = await fetch('/api/bch/sales/returns/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ returnId: ret.id })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("QC Confirmed & Item Restocked");
                fetchPendingQC(); // Refresh list
            } else {
                toast.error(data.error || "Failed to confirm QC");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Master Inventory: Return QC</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Items Pending Quality Control</h2>
                </div>
                <div className="overflow-x-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading QC Items...</div>
                    ) : pendingQC.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="py-2 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300">Invoice No</th>
                                    <th className="py-2 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300">Barcode</th>
                                    <th className="py-2 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300">Specs</th>
                                    <th className="py-2 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingQC.map(item => (
                                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{item.invoice_no}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.barcode}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {item.brand} {item.model} • {item.processor} • {item.ram} • {item.storage}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button 
                                                onClick={() => handleConfirmQC(item)}
                                                disabled={actionLoading === item.id}
                                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded transition disabled:opacity-50"
                                            >
                                                {actionLoading === item.id ? 'Confirming...' : 'Confirm QC & Restock'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-gray-500">No items pending QC at this time.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
