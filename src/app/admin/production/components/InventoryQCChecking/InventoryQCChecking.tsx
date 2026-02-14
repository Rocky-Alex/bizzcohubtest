import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { toast } from 'sonner';

interface QCItem {
    id: number;
    lot_id?: number | null;
    barcode?: string | null;
    sku: string | null;
    product_name: string;
    processor_gen: string | null;
    brand: string | null;
    model: string | null;
    series: string | null;
    ram: string | null;
    storage: string | null;
    graphics: string | null;
    screen_size: string | null;
    screen_resolution?: string | null;
    keyboard_type?: string | null;
    keyboard_backlit?: string | null;
    condition_status: string | null;
    status: string | null;
    created_by: string | null;
    created_at: string;
    updated_at?: string;
    updated_by?: string;
}

export default function InventoryQCChecking() {
    const [scanInput, setScanInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Edit Form State
    const [selectedItem, setSelectedItem] = useState<QCItem | null>(null);
    const [formData, setFormData] = useState<Partial<QCItem>>({});
    const [saving, setSaving] = useState(false);
    // Removed editableFields state

    const [availableGraphics, setAvailableGraphics] = useState<string[]>([]);
    const [availableScreenSizes, setAvailableScreenSizes] = useState<string[]>([]);
    const [availableScreenResolutions, setAvailableScreenResolutions] = useState<string[]>([]);
    const [availableKeyboardTypes, setAvailableKeyboardTypes] = useState<string[]>([]);
    const [availableKeyboardBacklits, setAvailableKeyboardBacklits] = useState<string[]>([]);
    const [availableRam, setAvailableRam] = useState<string[]>([]);
    const [availableStorage, setAvailableStorage] = useState<string[]>([]);
    const [availableConditions, setAvailableConditions] = useState<string[]>([]);

    useEffect(() => {
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const categories = [
                { cat: 'RAM', set: (data: any[]) => setAvailableRam(data.map(i => i.value)) },
                { cat: 'Storage', set: (data: any[]) => setAvailableStorage(data.map(i => i.value)) },
                { cat: 'Condition', set: (data: any[]) => setAvailableConditions(data.map(i => i.value)) },
                { cat: 'Graphics', set: (data: any[]) => setAvailableGraphics(data.map(i => i.value)) },
                { cat: 'Display', set: (data: any[]) => setAvailableScreenSizes(data.map(i => i.value)) },
                { cat: 'Resolution', set: (data: any[]) => setAvailableScreenResolutions(data.map(i => i.value)) },
                { cat: 'Keyboard', set: (data: any[]) => setAvailableKeyboardTypes(data.map(i => i.value)) },
                { cat: 'Backlit', set: (data: any[]) => setAvailableKeyboardBacklits(data.map(i => i.value)) }
            ];
            const categoryList = categories.map(c => c.cat).join(',');
            const res = await fetch(`/api/admin/inventory/droplists?category=${categoryList}`);
            const data = await res.json();
            if (data.success && data.categoryData) {
                categories.forEach(c => {
                    const d = data.categoryData[c.cat] || [];
                    c.set(d);
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanInput.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/inventory/qc?sku=${encodeURIComponent(scanInput.trim())}`);
            const data = await res.json();
            if (data.success && data.data && data.data.length > 0) {
                const item = data.data[0];
                setSelectedItem(item);
                setFormData({
                    ...item,
                    processor_gen: item.processor_gen || '',
                    graphics_card: item.graphics || '',
                    screen_size: item.screen_size || '',
                    screen_resolution: item.screen_resolution || '',
                    keyboard_type: item.keyboard_type || '',
                    keyboard_backlit: item.keyboard_backlit || ''
                });
                setScanInput('');
                toast.success("Item Found!");
            } else {
                toast.error("Item not found!");
                setSelectedItem(null);
            }
        } catch (e) {
            toast.error("Error searching item");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedItem) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/inventory/qc', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedItem.id,
                    ...formData,
                    updatedBy: 'Admin'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("QC Data Updated Successfully!");
                const updatedItem = { ...formData, updated_at: new Date().toISOString(), updated_by: 'Admin' } as QCItem;
                setSelectedItem({ ...selectedItem, ...updatedItem });
            } else {
                toast.error("Failed to update: " + data.error);
            }
        } catch (e) {
            toast.error("Error updating item");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, val: string) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    };

    const renderField = (label: string, fieldKey: keyof QCItem | string, isDropdown = false, options: string[] = []) => {
        const val = (formData[fieldKey as keyof typeof formData] as string) || '';

        return (
            <div style={{ marginBottom: '1rem', flex: '1 1 300px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{label}</label>
                {isDropdown ? (
                    <SearchableDropdown
                        name={fieldKey as string}
                        value={val}
                        options={options.map(o => ({ label: o, value: o }))}
                        onChange={(e) => handleChange(fieldKey as string, e.target.value)}
                        placeholder={`Select ${label}`}
                        className="modern-input"
                    />
                ) : (
                    <input
                        type="text"
                        value={val}
                        onChange={(e) => handleChange(fieldKey as string, e.target.value)}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            fontWeight: 500, color: '#1e293b'
                        }}
                    />
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Inventory QC Checking</h1>
                <p style={{ color: '#64748b' }}>Scan and verify existing inventory items.</p>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Scanner Input */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem', textAlign: 'center' }}>
                    <form onSubmit={handleScan}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, color: '#475569' }}>Scan Barcode / SKU</label>
                        <input
                            autoFocus
                            type="text"
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            placeholder="Scan QR Code or Type SKU..."
                            style={{ width: '100%', maxWidth: '500px', padding: '1rem', fontSize: '1.2rem', borderRadius: '12px', border: '2px solid #e2e8f0', textAlign: 'center' }}
                        />
                        <button type="submit" disabled={loading} style={{ marginTop: '1rem', padding: '0.8rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                            {loading ? 'Searching...' : 'Search Item'}
                        </button>
                    </form>
                </div>

                {/* Result Form */}
                {selectedItem && (
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedItem.product_name}</h2>
                                <div style={{ color: '#64748b', marginTop: '0.5rem' }}>ID: {selectedItem.id} | SKU: {selectedItem.sku || 'N/A'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Created By</div>
                                <div style={{ fontWeight: 600 }}>Admin at {new Date(selectedItem.created_at).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Last Updated By</div>
                                <div style={{ fontWeight: 600 }}>{selectedItem.updated_by || '-'} at {selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleDateString() : '-'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                            {renderField('Product Name', 'product_name')}
                            {renderField('SKU / Serial', 'sku')}
                            {renderField('Brand', 'brand')}
                            {renderField('Model', 'model')}
                            {renderField('Series', 'series')}
                            {renderField('Processor', 'processor')}
                            {renderField('Processor Gen', 'processor_gen')}
                            {renderField('RAM', 'ram', true, availableRam)}
                            {renderField('Storage', 'storage', true, availableStorage)}
                            {renderField('Graphics', 'graphics_card', true, availableGraphics)}
                            {renderField('Screen Size', 'screen_size', true, availableScreenSizes)}
                            {renderField('Screen Resolution', 'screen_resolution', true, availableScreenResolutions)}
                            {renderField('Keyboard Type', 'keyboard_type', true, availableKeyboardTypes)}
                            {renderField('Keyboard Backlit', 'keyboard_backlit', true, availableKeyboardBacklits)}
                            {renderField('Condition', 'condition_status', true, availableConditions)}
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                            <button
                                onClick={handleUpdate}
                                disabled={saving}
                                style={{ padding: '1rem 3rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                            >
                                {saving ? 'Saving...' : 'Update & Save'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
