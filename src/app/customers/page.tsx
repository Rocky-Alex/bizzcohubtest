"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    // Debounce could be added, doing simple fetch for now
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/customers?query=${search}`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#0b1121', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Customers</h1>
                        <p style={{ color: '#94a3b8' }}>Manage customer profiles and history.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white', width: '300px' }}
                        />
                    </div>
                </div>

                <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#334155', textAlign: 'left' }}>
                                <th style={{ padding: '16px' }}>Name</th>
                                <th style={{ padding: '16px' }}>Email</th>
                                <th style={{ padding: '16px' }}>Phone</th>
                                <th style={{ padding: '16px' }}>Address</th>
                                <th style={{ padding: '16px' }}>Joined</th>
                                <th style={{ padding: '16px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>No customers found.</td></tr>
                            ) : (
                                customers.map(c => (
                                    <tr key={c.customerId} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '16px', fontWeight: 'bold' }}>{c.name}</td>
                                        <td style={{ padding: '16px' }}>{c.email}</td>
                                        <td style={{ padding: '16px' }}>{c.phone || '-'}</td>
                                        <td style={{ padding: '16px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address || '-'}</td>
                                        <td style={{ padding: '16px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px' }}>
                                            <button style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #4ade80', borderRadius: '6px', color: '#4ade80', cursor: 'pointer' }}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
