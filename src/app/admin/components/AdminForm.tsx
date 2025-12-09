import React, { useState } from "react";

interface AdminFormProps {
    title: string;
    fields: {
        name: string;
        label: string;
        type: string;
        options?: string[]; // For select inputs
    }[];
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}

export default function AdminForm({
    title,
    fields,
    onSubmit,
    onCancel,
    initialData = {}
}: AdminFormProps) {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="admin-section active">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>{title}</h2>

            <div className="dashboard-invoices-section" style={{ marginTop: 0, maxWidth: '800px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {fields.map((field) => (
                            <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: field.type === 'textarea' ? 'span 2' : 'auto' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                    {field.label}
                                </label>
                                {field.type === 'select' ? (
                                    <select
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.9rem'
                                        }}
                                        required
                                    >
                                        <option value="">Select {field.label}</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        rows={4}
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.9rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.9rem'
                                        }}
                                        required
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                background: 'white',
                                border: '1px solid #d1d5db',
                                padding: '0.6rem 1.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                color: '#374151'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                background: '#7c3aed',
                                border: 'none',
                                color: 'white',
                                padding: '0.6rem 2rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
