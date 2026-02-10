"use client";

import React from 'react';

export default function Packing() {
    return (
        <div style={{ padding: '1rem 2rem', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.04em' }}>Packing</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Manage packing operations.</p>
                </div>
                <div style={{
                    background: 'white', padding: '1rem 2.5rem', borderRadius: '24px',
                    border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
                    display: 'flex', alignItems: 'center', gap: '1.5rem'
                }}>
                    <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <i className="fas fa-box-open" style={{ fontSize: '1.2rem' }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Date</div>
                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <i className="fas fa-box" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#475569' }}>Packing Module Ready</h3>
                    <p>Start implementing packing features here.</p>
                </div>
            </div>
        </div>
    );
}
