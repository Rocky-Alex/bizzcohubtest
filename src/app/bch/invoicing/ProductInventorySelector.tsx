'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DatabaseProduct } from '@/types';
import '../styles/product-inventory-selector.css';

interface ProductInventorySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (products: any[]) => void;
    products: DatabaseProduct[];
}

const WATTAGE_OPTIONS = ['45W', '65W', '90W', '130W', '180W', '200W', '240W'];

export default function ProductInventorySelector({ isOpen, onClose, onSelect, products }: ProductInventorySelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
    const [hasCharger, setHasCharger] = useState(false);
    const [selectedWatts, setSelectedWatts] = useState('');
    const [manualRam, setManualRam] = useState('');
    const [manualStorage, setManualStorage] = useState('');
    const [manualGraphics, setManualGraphics] = useState('');

    // Filters State
    const [filters, setFilters] = useState({
        lot_number: '',
        brand: '',
        series: '',
        model: '',
        processor: '',
        gen: '',
        ram: '',
        storage: '',
        graphics: ''
    });

    // Reset selection on open/close
    useEffect(() => {
        if (!isOpen) {
            setSelectedProductIds(new Set());
            setHasCharger(false);
            setSelectedWatts('');
            setManualRam('');
            setManualStorage('');
            setManualGraphics('');
        }
    }, [isOpen]);

    const handleToggleSelect = (id: number) => {
        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        const allFilteredIds = filteredProducts.map(p => p.id);
        const allSelected = allFilteredIds.every(id => selectedProductIds.has(id));

        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                allFilteredIds.forEach(id => next.delete(id));
            } else {
                allFilteredIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const handleAddSelected = () => {
        if (selectedProductIds.size === 0) return;

        const finalChargerStatus = hasCharger
            ? `With Charger ${selectedWatts ? `(${selectedWatts})` : ''}`
            : 'Without Charger';

        const selectedObjects = products.filter(p => selectedProductIds.has(p.id)).map(p => {
            // Construct mapping description
            const finalRam = manualRam || p.ram || '';
            const finalStorage = manualStorage || p.storage || '';
            const finalGraphics = manualGraphics || p.graphics_card || '';

            const baseInfo = [p.brand, p.series, p.model].filter(Boolean).join(' ');
            let processorInfo = [p.processor, p.processor_gen].filter(Boolean).join('-');

            // Clean up common long strings for a sleeker look
            processorInfo = processorInfo
                .replace(/Intel Core /gi, '')
                .replace(/Processor/gi, '')
                .trim();

            // Hardware Info logic: RAM/SSD/OptionalGraphics
            const specs = [finalRam, finalStorage];

            // Only add graphics if it's not "In built" or "No graphics"
            const hasDedicatedGraphics = finalGraphics &&
                !finalGraphics.toLowerCase().includes('in built') &&
                !finalGraphics.toLowerCase().includes('no graphics');

            if (hasDedicatedGraphics) {
                specs.push(`${finalGraphics} Graphics`);
            }

            const hardwareInfo = specs.filter(Boolean).join('/');

            const fullDescription = [
                baseInfo,
                processorInfo,
                hardwareInfo,
                finalChargerStatus
            ].filter(Boolean).join(' ');

            return {
                ...p,
                description: fullDescription,
                ram: finalRam,
                storage: finalStorage,
                graphics_card: finalGraphics,
                charger_status: finalChargerStatus,
                acStatus: finalChargerStatus // for compatibility with legacy components
            };
        });

        onSelect(selectedObjects);
        onClose();
    };

    // Extract Filter Options with Cascading Logic
    const filterOptions = useMemo(() => {
        const lots = new Set<string>();
        products.forEach(p => {
            const lNum = p.lot_number || (p as any).lotNumber;
            if (lNum) {
                lots.add(String(lNum).trim());
            }
        });

        // Normalize comparison helper
        const compare = (val1?: string, val2?: string) => 
            (val1 || '').trim().toLowerCase() === (val2 || '').trim().toLowerCase();

        // 2. Available Brands (Filtered by selected Lot)
        const brands = new Set<string>();
        products.filter(p => !filters.lot_number || compare(p.lot_number, filters.lot_number))
            .forEach(p => p.brand && brands.add(p.brand));

        // 3. Available Series (Filtered by Lot and Brand)
        const series = new Set<string>();
        products.filter(p => (!filters.lot_number || compare(p.lot_number, filters.lot_number)) &&
            (!filters.brand || compare(p.brand, filters.brand)))
            .forEach(p => p.series && series.add(p.series));

        // 4. Available Models (Filtered by Lot, Brand, and Series)
        const models = new Set<string>();
        products.filter(p => (!filters.lot_number || compare(p.lot_number, filters.lot_number)) &&
            (!filters.brand || compare(p.brand, filters.brand)) &&
            (!filters.series || compare(p.series, filters.series)))
            .forEach(p => p.model && models.add(p.model));

        // 5. Global specs (Showing all values without hierarchy restriction)
        const processors = new Set<string>();
        const gens = new Set<string>();
        const rams = new Set<string>();
        const storages = new Set<string>();
        const graphics = new Set<string>();

        // We use the full products list for these tags as requested
        products.forEach(p => {
            if (p.processor) processors.add(p.processor.trim());
            if (p.processor_gen) gens.add(p.processor_gen.trim());
            if (p.ram) rams.add(p.ram.trim());
            if (p.storage) storages.add(p.storage.trim());
            if (p.graphics_card) graphics.add(p.graphics_card.trim());
        });

        return {
            lots: Array.from(lots).sort(),
            brands: Array.from(brands).sort(),
            series: Array.from(series).sort(),
            models: Array.from(models).sort(),
            processors: Array.from(processors).sort(),
            gens: Array.from(gens).sort(),
            rams: Array.from(rams).sort(),
            storages: Array.from(storages).sort(),
            graphics: Array.from(graphics).sort()
        };
    }, [products, filters.lot_number, filters.brand, filters.series]);

    // Filtering Logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchLower = searchQuery.toLowerCase().trim();
            const pLot = p.lot_number || (p as any).lotNumber;
            const matchesSearch = !searchQuery ||
                p.product_name?.toLowerCase().includes(searchLower) ||
                p.product_code?.toLowerCase().includes(searchLower) ||
                p.sku?.toLowerCase().includes(searchLower) ||
                pLot?.toLowerCase().includes(searchLower) ||
                p.brand?.toLowerCase().includes(searchLower);

            const matchesLot = !filters.lot_number || (pLot || '').trim().toLowerCase() === filters.lot_number.toLowerCase();
            const matchesBrand = !filters.brand || p.brand?.trim().toLowerCase() === filters.brand.toLowerCase();
            const matchesSeries = !filters.series || p.series?.trim().toLowerCase() === filters.series.toLowerCase();
            const matchesModel = !filters.model || p.model?.trim().toLowerCase() === filters.model.toLowerCase();
            const matchesProcessor = !filters.processor || p.processor?.trim().toLowerCase() === filters.processor.toLowerCase();
            const matchesGen = !filters.gen || p.processor_gen?.trim().toLowerCase() === filters.gen.toLowerCase();
            const matchesRam = !filters.ram || p.ram?.trim().toLowerCase() === filters.ram.toLowerCase();
            const matchesStorage = !filters.storage || p.storage?.trim().toLowerCase() === filters.storage.toLowerCase();
            const matchesGraphics = !filters.graphics || p.graphics_card?.trim().toLowerCase() === filters.graphics.toLowerCase();

            return matchesSearch && matchesLot && matchesBrand && matchesSeries && matchesModel &&
                matchesProcessor && matchesGen && matchesRam && matchesStorage && matchesGraphics;
        });
    }, [products, searchQuery, filters]);

    // Manual Options (Fixed options as requested + dynamic values from filtered list)
    const manualOptions = useMemo(() => {
        // Help normalizer to prevent "8GB" vs "8 GB" duplicates
        const normalize = (val: string) => {
            if (!val) return '';
            const num = val.match(/\d+/)?.[0] || '';
            const unit = val.match(/[a-zA-Z]+/)?.[0] || '';
            if (num && unit) return `${num} ${unit.toUpperCase()}`;
            return val;
        };

        const rams = new Set(['4 GB', '8 GB', '16 GB', '32 GB'].map(normalize));
        const storages = new Set(['128 GB', '256 GB', '512 GB', '500 GB', '1 TB', '2 TB'].map(normalize));
        const graphics = new Set(['In built', 'No graphics', '1 GB', '2 GB', '4 GB', '6 GB', '8 GB', '16 GB'].map(normalize));

        // Use filtered products to add any specialized values that might exist in stock
        const pool = (filters.lot_number || filters.brand || filters.model || filters.processor || searchQuery)
            ? filteredProducts
            : products;

        pool.forEach(p => {
            if (p.ram) rams.add(normalize(p.ram.trim()));
            if (p.storage) storages.add(normalize(p.storage.trim()));
            if (p.graphics_card) graphics.add(normalize(p.graphics_card.trim()));
        });

        const sortSpecs = (arr: string[]) => {
            return arr.sort((a, b) => {
                const getVal = (s: string) => {
                    const numMatch = s.match(/\d+/);
                    if (!numMatch) return 0;
                    const num = parseInt(numMatch[0]);
                    const unit = s.toLowerCase().includes('tb') ? 1024 : 1;
                    return num * unit;
                };
                return getVal(a) - getVal(b);
            });
        };

        return {
            rams: sortSpecs(Array.from(rams)),
            storages: sortSpecs(Array.from(storages)),
            graphics: sortSpecs(Array.from(graphics))
        };
    }, [filteredProducts, products, filters.lot_number, filters.brand, filters.model, filters.processor, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="pis-modal-overlay" onClick={onClose}>
            <div className="pis-modal-container" onClick={e => e.stopPropagation()}>
                <div className="pis-header">
                    <h2><i className="fas fa-layer-group"></i> Product Inventory Selector</h2>
                    <button className="pis-close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="pis-body">
                    <div className="pis-main">
                        <div className="pis-filter-section">
                            <div className="pis-search-wrapper">
                                <div className="pis-search-input-inner">
                                    <i className="fas fa-search"></i>
                                    <input
                                        className="pis-search-input"
                                        placeholder="Search by name, code, lot or brand..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pis-filter-grid">
                                <div className="pis-filter-item">
                                    <label>Lot Number</label>
                                    <select value={filters.lot_number} onChange={e => setFilters({ ...filters, lot_number: e.target.value })}>
                                        <option value="">All Lots</option>
                                        {filterOptions.lots.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="pis-filter-item">
                                    <label>Brand</label>
                                    <select value={filters.brand} onChange={e => setFilters({ ...filters, brand: e.target.value })}>
                                        <option value="">All Brands</option>
                                        {filterOptions.brands.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="pis-filter-item">
                                    <label>Series</label>
                                    <select value={filters.series} onChange={e => setFilters({ ...filters, series: e.target.value })}>
                                        <option value="">All Series</option>
                                        {filterOptions.series.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="pis-filter-item">
                                    <label>Model</label>
                                    <select value={filters.model} onChange={e => setFilters({ ...filters, model: e.target.value })}>
                                        <option value="">All Models</option>
                                        {filterOptions.models.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="pis-filter-item">
                                    <label>Processor</label>
                                    <select value={filters.processor} onChange={e => setFilters({ ...filters, processor: e.target.value })}>
                                        <option value="">All Processors</option>
                                        {filterOptions.processors.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="pis-filter-item">
                                    <label>Generation</label>
                                    <select value={filters.gen} onChange={e => setFilters({ ...filters, gen: e.target.value })}>
                                        <option value="">All Generations</option>
                                        {filterOptions.gens.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="pis-filter-item">
                                    <label>Graphics</label>
                                    <select value={filters.graphics} onChange={e => setFilters({ ...filters, graphics: e.target.value })}>
                                        <option value="">All Graphics</option>
                                        {filterOptions.graphics.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="pis-filter-item">
                                    <button
                                        className="pis-reset-btn"
                                        onClick={() => setFilters({
                                            lot_number: '', brand: '', series: '', model: '',
                                            processor: '', gen: '', ram: '', storage: '', graphics: ''
                                        })}
                                    >
                                        <i className="fas fa-undo-alt"></i>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pis-table-container">
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))}
                                            />
                                        </th>
                                        <th>Source</th>
                                        <th>Lot Number</th>
                                        <th>Brand</th>
                                        <th>Product Name</th>
                                        <th>Specifications</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr
                                            key={`${p.id}-${p.source || 'qc'}`}
                                            className={selectedProductIds.has(p.id) ? 'selected' : ''}
                                            onClick={() => handleToggleSelect(p.id)}
                                        >
                                            <td onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProductIds.has(p.id)}
                                                    onChange={() => handleToggleSelect(p.id)}
                                                />
                                            </td>
                                            <td>
                                                <span className={`source-badge ${p.source?.toLowerCase().replace(' ', '-')}`}>
                                                    {p.source?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                {(p.lot_number || (p as any).lotNumber) ? <span className="badge lot-badge">{p.lot_number || (p as any).lotNumber}</span> : '-'}
                                            </td>
                                            <td><strong>{p.brand}</strong></td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{p.product_name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.product_code || p.sku || 'No SKU'}</div>
                                            </td>
                                            <td>
                                                <div className="item-specs-cell">
                                                    {p.processor && <span className="spec-tag-inline"><i className="fas fa-microchip"></i> {p.processor}</span>}
                                                    {p.processor_gen && <span className="spec-tag-inline">{p.processor_gen}</span>}
                                                    {p.ram && <span className="spec-tag-inline"><i className="fas fa-memory"></i> {p.ram}</span>}
                                                    {p.storage && <span className="spec-tag-inline"><i className="fas fa-hdd"></i> {p.storage}</span>}
                                                    {p.graphics_card && <span className="spec-tag-inline gpu"><i className="fas fa-video"></i> {p.graphics_card}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="price-stack">
                                                    {(p.offer_price && Number(p.offer_price) > 0) || (p.base_price && Number(p.base_price) > 0) ? (
                                                        <>
                                                            <span className="price-main">
                                                                AED {p.offer_price && Number(p.offer_price) > 0 ? p.offer_price : p.base_price}
                                                            </span>
                                                            {p.offer_price && p.base_price && Number(p.offer_price) !== Number(p.base_price) && (
                                                                <span className="price-crossed">AED {p.base_price}</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="no-price-tag">No Price Set</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`stock-badge ${Number(p.quantity) <= 0 ? 'out' : (Number(p.quantity) < 5 ? 'low' : '')}`}>
                                                    <i className={`fas ${Number(p.quantity) <= 0 ? 'fa-times-circle' : (Number(p.quantity) < 5 ? 'fa-exclamation-circle' : 'fa-check-circle')}`}></i>
                                                    {p.quantity} in stock
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={8}>
                                                <div className="pis-empty-state">
                                                    <i className="fas fa-search-minus"></i>
                                                    <p>No products match your filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="pis-footer">
                    <div className="pis-selection-preview">
                        {selectedProductIds.size > 0 ? (
                            <>
                                <div className="charger-config-container">
                                    <label className="charger-config-label">Charger Details</label>
                                    <div className="charger-toggle-group">
                                        <button
                                            className={`charger-toggle-btn ${hasCharger ? 'active' : ''}`}
                                            onClick={() => setHasCharger(true)}
                                        >
                                            <i className={`fas ${hasCharger ? 'fa-plug' : 'fa-plug'}`}></i>
                                            Included
                                        </button>
                                        <button
                                            className={`charger-toggle-btn ${!hasCharger ? 'active' : ''}`}
                                            onClick={() => setHasCharger(false)}
                                        >
                                            <i className="fas fa-times-circle"></i>
                                            None
                                        </button>
                                    </div>

                                    <select
                                        className="charger-watts-select"
                                        value={selectedWatts}
                                        onChange={e => setSelectedWatts(e.target.value)}
                                        disabled={!hasCharger}
                                    >
                                        <option value="">Wattage</option>
                                        {WATTAGE_OPTIONS.map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="charger-config-container" style={{ borderLeft: '2px solid #f1f5f9', paddingLeft: '2rem' }}>
                                    <label className="charger-config-label">Hardware Overrides</label>
                                    <div className="hardware-overrides-grid">
                                        <div className="hardware-select-wrapper">
                                            <i className="fas fa-memory"></i>
                                            <select
                                                className="charger-watts-select"
                                                value={manualRam}
                                                onChange={e => setManualRam(e.target.value)}
                                            >
                                                <option value="">RAM</option>
                                                {manualOptions.rams.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="hardware-select-wrapper">
                                            <i className="fas fa-hdd"></i>
                                            <select
                                                className="charger-watts-select"
                                                value={manualStorage}
                                                onChange={e => setManualStorage(e.target.value)}
                                            >
                                                <option value="">SSD</option>
                                                {manualOptions.storages.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="hardware-select-wrapper">
                                            <i className="fas fa-microchip"></i>
                                            <select
                                                className="charger-watts-select"
                                                value={manualGraphics}
                                                onChange={e => setManualGraphics(e.target.value)}
                                            >
                                                <option value="">GPU</option>
                                                {manualOptions.graphics.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="pis-selection-preview" style={{ opacity: 0.6, alignItems: 'center' }}>
                                <i className="fas fa-mouse-pointer" style={{ fontSize: '1.2rem', color: '#94a3b8' }}></i>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Select items to configure charger and hardware</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="pis-actions">
                        {selectedProductIds.size > 0 && (
                            <div className="pis-selection-info">
                                <div className="pis-selection-count">
                                    <i className="fas fa-check-circle"></i>
                                    {selectedProductIds.size} {selectedProductIds.size === 1 ? 'Item' : 'Items'} Selected
                                </div>
                            </div>
                        )}
                        <button className="pis-cancel-btn" onClick={onClose}>Cancel</button>
                        <button
                            className="pis-add-btn"
                            disabled={selectedProductIds.size === 0}
                            onClick={handleAddSelected}
                        >
                            <span>Add Items</span>
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
