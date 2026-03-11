"use client";

import React, { useState } from 'react';
import QCStickerEditor from './components/QCStickerEditor';
import FourBySixEditor from './components/FourBySixEditor';

export default function LabelSizePage() {
    const [activeTab, setActiveTab] = useState<'qc' | '4x6'>('qc');

    return (
        <div className="label-size-page" style={{ padding: '1rem' }}>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Label Size Management</h1>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => setActiveTab('qc')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'qc' ? '3px solid #0f172a' : '3px solid transparent',
                        color: activeTab === 'qc' ? '#0f172a' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    QC Sticker
                </button>
                <button
                    onClick={() => setActiveTab('4x6')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === '4x6' ? '3px solid #0f172a' : '3px solid transparent',
                        color: activeTab === '4x6' ? '#0f172a' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    4x6 Label
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'qc' ? (
                    <section className="qc-sticker-section">
                        <QCStickerEditor settingKey="default_label" title="QC Sticker" />
                    </section>
                ) : (
                    <section className="4x6-sticker-section">
                        <FourBySixEditor settingKey="shipping_4x6" title="4x6 Label" />
                    </section>
                )}
            </div>
        </div>
    );
}
