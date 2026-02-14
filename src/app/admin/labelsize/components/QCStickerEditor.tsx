"use client";

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface Position {
    x: number;
    y: number;
}

interface LabelConfig {
    unit: 'cm' | 'mm' | 'in';
    // Canvas
    width: number;
    height: number;
    borderRadius: number;
    showBorder: boolean;

    // Elements
    productNameSize: number;
    productNamePos: Position;
    productNameWidth: number; // Max width to wrap

    barcodeScale: number;
    barcodeHeight: number;
    barcodeFontSize: number;
    barcodePos: Position;
    barcodeTextPos: Position; // Independent position for text BCH-XXXX
    barcodeTextFontSize: number;

    specsFontSize: number;
    specsLineHeight: number;
    specsPos: Position;

    lotFontSize: number;
    lotPos: Position;
}

interface LabelData {
    productName: string;
    display: string;
    memory: string;
    storage: string;
    gpu: string;
    lotNumber: string;
    barcodeValue: string;
}

interface QCStickerEditorProps {
    settingKey?: string;
    title?: string;
}

export default function QCStickerEditor({ settingKey = 'default_label', title = 'QC Sticker' }: QCStickerEditorProps) {
    const printRef = useRef<HTMLDivElement>(null);

    // Default connection to 'cm'
    const [config, setConfig] = useState<LabelConfig>({
        unit: 'cm',
        width: 10,
        height: 6,
        borderRadius: 0,
        showBorder: true,

        productNameSize: 14,
        productNamePos: { x: 0.5, y: 0.5 },
        productNameWidth: 9,

        barcodeScale: 1.5,
        barcodeHeight: 40,
        barcodeFontSize: 12,
        barcodePos: { x: 0.5, y: 2.5 },
        barcodeTextPos: { x: 0.5, y: 3.8 },
        barcodeTextFontSize: 8,

        specsFontSize: 10,
        specsLineHeight: 1.4,
        specsPos: { x: 5.5, y: 2.5 },

        lotFontSize: 12,
        lotPos: { x: 5.5, y: 5.0 },
    });

    const [data, setData] = useState<LabelData>({
        productName: 'HP ELITEBOOK 850 G8 INTEL CORE I7 11TH GEN',
        display: '13.3"',
        memory: '8 GB',
        storage: '180 GB',
        gpu: '1 GB',
        lotNumber: 'MNA-01-LP-30',
        barcodeValue: 'BCH-1004'
    });

    // Load settings on mount
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/admin/label-settings?name=${settingKey}`, { cache: 'no-store' });
                const data = await res.json();
                if (data.success && data.config) {
                    // Merge DB config with current (default) state to ensure new fields like barcodeTextPos exist
                    setConfig(prev => ({
                        ...prev,
                        ...data.config,
                        unit: data.config.unit || prev.unit || 'cm'
                    }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        fetchSettings();
    }, [settingKey, title]);

    const convertValue = (val: number, from: string, to: string): number => {
        let inCm = val;
        if (from === 'mm') inCm = val / 10;
        if (from === 'in') inCm = val * 2.54;

        let result = inCm;
        if (to === 'mm') result = inCm * 10;
        if (to === 'in') result = inCm / 2.54;

        return Number(result.toFixed(2));
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newUnit = e.target.value as 'cm' | 'mm' | 'in';
        const oldUnit = config.unit;

        if (newUnit === oldUnit) return;

        const convert = (val: number) => convertValue(val, oldUnit, newUnit);

        setConfig(prev => ({
            ...prev,
            unit: newUnit,
            width: convert(prev.width),
            height: convert(prev.height),
            productNamePos: { x: convert(prev.productNamePos.x), y: convert(prev.productNamePos.y) },
            productNameWidth: convert(prev.productNameWidth),
            barcodePos: { x: convert(prev.barcodePos.x), y: convert(prev.barcodePos.y) },
            barcodeTextPos: { x: convert(prev.barcodeTextPos.x), y: convert(prev.barcodeTextPos.y) },
            specsPos: { x: convert(prev.specsPos.x), y: convert(prev.specsPos.y) },
            lotPos: { x: convert(prev.lotPos.x), y: convert(prev.lotPos.y) },
        }));
    };

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked, dataset } = e.target;
        const val = type === 'checkbox' ? checked : Number(value);

        if (dataset.group && dataset.prop) {
            // Handle nested position updates (e.g., group="productNamePos", prop="x")
            setConfig(prev => ({
                ...prev,
                [dataset.group as string]: {
                    ...(prev[dataset.group as keyof LabelConfig] as Position),
                    [dataset.prop as string]: val
                }
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                [name]: val
            }));
        }
    };

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/admin/label-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config, name: settingKey })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`${title} saved successfully!`);
            } else {
                toast.error(`Failed to save ${title}`);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving configuration');
        }
    };

    // Helper to render Position Inputs
    const renderPosInputs = (label: string, group: string, pos: Position) => (
        <div style={rowStyle}>
            <label style={labelStyle}>{label} X ({config.unit})
                <input type="number" step="0.1" data-group={group} data-prop="x" value={pos.x} onChange={handleConfigChange} style={inputStyle} />
            </label>
            <label style={labelStyle}>{label} Y ({config.unit})
                <input type="number" step="0.1" data-group={group} data-prop="y" value={pos.y} onChange={handleConfigChange} style={inputStyle} />
            </label>
        </div>
    );

    return (
        <div className="qc-sticker-editor" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', justifyContent: 'center' }}>

            {/* LEFT CONTROLS */}
            <div className="controls-left" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '85vh', overflowY: 'auto' }}>
                {/* 0. Unit Selection */}
                <div className="control-section" style={{ ...sectionStyle, padding: '0.75rem', background: '#f8fafc' }}>
                    <label style={{ ...labelStyle, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Measurement Unit</label>
                    <select value={config.unit} onChange={handleUnitChange} style={inputStyle}>
                        <option value="cm">Centimeters (cm)</option>
                        <option value="mm">Millimeters (mm)</option>
                        <option value="in">Inches (in)</option>
                    </select>
                </div>

                {/* 1. Canvas Dimensions */}
                <div className="control-section" style={sectionStyle}>
                    <h3 style={headerStyle}>Label Canvas</h3>
                    <div style={rowStyle}>
                        <label style={labelStyle}>Width ({config.unit}) <input type="number" step="0.1" name="width" value={config.width} onChange={handleConfigChange} style={inputStyle} /></label>
                        <label style={labelStyle}>Height ({config.unit}) <input type="number" step="0.1" name="height" value={config.height} onChange={handleConfigChange} style={inputStyle} /></label>
                    </div>
                    <div style={rowStyle}>
                        <label style={labelStyle}>Border Radius (px) <input type="number" name="borderRadius" value={config.borderRadius} onChange={handleConfigChange} style={inputStyle} /></label>
                        <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                            Show Border
                            <input type="checkbox" name="showBorder" checked={config.showBorder} onChange={handleConfigChange} />
                        </label>
                    </div>
                </div>

                {/* 2. Product Name */}
                <div className="control-section" style={sectionStyle}>
                    <h3 style={headerStyle}>Product Name</h3>
                    {renderPosInputs('Pos', 'productNamePos', config.productNamePos)}
                    <div style={rowStyle}>
                        <label style={labelStyle}>Font Size (pt) <input type="number" name="productNameSize" value={config.productNameSize} onChange={handleConfigChange} style={inputStyle} /></label>
                        <label style={labelStyle}>Max Width ({config.unit}) <input type="number" step="0.1" name="productNameWidth" value={config.productNameWidth} onChange={handleConfigChange} style={inputStyle} /></label>
                    </div>
                </div>

                {/* 3. QR Code */}
                <div className="control-section" style={sectionStyle}>
                    <h3 style={headerStyle}>QR Code</h3>
                    {renderPosInputs('Pos', 'barcodePos', config.barcodePos)}
                    <div style={rowStyle}>
                        <label style={labelStyle}>Size (px) <input type="number" name="barcodeHeight" value={config.barcodeHeight} onChange={handleConfigChange} style={inputStyle} /></label>
                    </div>
                </div>

                {/* 3a. QR Code Text (BCH-XXXX) */}
                <div className="control-section" style={sectionStyle}>
                    <h3 style={headerStyle}>QR Code Text</h3>
                    {renderPosInputs('Pos', 'barcodeTextPos', config.barcodeTextPos)}
                    <div style={rowStyle}>
                        <label style={labelStyle}>Font Size (pt) <input type="number" name="barcodeTextFontSize" value={config.barcodeTextFontSize} onChange={handleConfigChange} style={inputStyle} /></label>
                    </div>
                </div>


            </div>



            {/* CENTER PREVIEW AREA */}
            <div className="preview-area" style={{ flex: 1, background: '#f1f5f9', padding: '3rem', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '600px', overflow: 'auto', alignSelf: 'stretch' }}>

                {/* THE LABEL CANVAS */}
                <div
                    ref={printRef}
                    className="print-label-preview"
                    style={{
                        width: `${config.width}${config.unit}`,
                        height: `${config.height}${config.unit}`,
                        border: config.showBorder ? '1px solid #000' : 'none',
                        borderRadius: `${config.borderRadius}px`,
                        backgroundColor: 'white',
                        position: 'relative', // The absolute context
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        flexShrink: 0
                    }}
                >
                    {/* Element 1: Product Name */}
                    <div style={{
                        position: 'absolute',
                        left: `${config.productNamePos.x}${config.unit}`,
                        top: `${config.productNamePos.y}${config.unit}`,
                        width: `${config.productNameWidth}${config.unit}`,
                        fontSize: `${config.productNameSize}pt`,
                        fontWeight: 900,
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                        color: '#000',
                        wordWrap: 'break-word'
                    }}>
                        {data.productName}
                    </div>

                    {/* Element 2: QR Code */}
                    <div style={{
                        position: 'absolute',
                        left: `${config.barcodePos.x}${config.unit}`,
                        top: `${config.barcodePos.y}${config.unit}`,
                        transformOrigin: 'top left'
                    }}>
                        <div style={{ transform: 'scale(1)' }}>
                            <QRCodeSVG
                                value={data.barcodeValue}
                                size={config.barcodeHeight}
                                level={"H"}
                                includeMargin={false}
                            />
                        </div>
                    </div>

                    {/* Element 2a: Barcode Text */}
                    <div style={{
                        position: 'absolute',
                        left: `${config.barcodeTextPos.x}${config.unit}`,
                        top: `${config.barcodeTextPos.y}${config.unit}`,
                        fontSize: `${config.barcodeTextFontSize}pt`,
                        fontWeight: 700,
                        color: '#000'
                    }}>
                        {data.barcodeValue}
                    </div>

                    {/* Element 3: Specs */}
                    <div style={{
                        position: 'absolute',
                        left: `${config.specsPos.x}${config.unit}`,
                        top: `${config.specsPos.y}${config.unit}`,
                        fontSize: `${config.specsFontSize}pt`,
                        lineHeight: config.specsLineHeight,
                        fontWeight: 700,
                        color: '#000'
                    }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>DISPLAY:</span> {data.display}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>MEMORY:</span> {data.memory}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>STORAGE:</span> {data.storage}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>GPU:</span> {data.gpu}
                        </div>
                    </div>

                    {/* Element 4: Lot Number */}
                    <div style={{
                        position: 'absolute',
                        left: `${config.lotPos.x}${config.unit}`,
                        top: `${config.lotPos.y}${config.unit}`,
                        fontSize: `${config.lotFontSize}pt`,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#000'
                    }}>
                        LOT: {data.lotNumber}
                    </div>

                </div>
            </div>

            {/* RIGHT CONTROLS */}
            <div className="controls-right" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '85vh', overflowY: 'auto' }}>



                {/* 4. Specifications */}
                <div className="control-section" style={sectionStyle}>
                    <h3 style={headerStyle}>Specifications</h3>
                    {renderPosInputs('Pos', 'specsPos', config.specsPos)}
                    <div style={rowStyle}>
                        <label style={labelStyle}>Font Size (pt) <input type="number" name="specsFontSize" value={config.specsFontSize} onChange={handleConfigChange} style={inputStyle} /></label>
                        <label style={labelStyle}>Line Height <input type="number" step="0.1" name="specsLineHeight" value={config.specsLineHeight} onChange={handleConfigChange} style={inputStyle} /></label>
                    </div>
                </div>

                {/* 5. Lot Number */}
                <div className="control-section" style={sectionStyle}>
                    <h3 style={headerStyle}>Lot Number</h3>
                    {renderPosInputs('Pos', 'lotPos', config.lotPos)}
                    <div style={rowStyle}>
                        <label style={labelStyle}>Font Size (pt) <input type="number" name="lotFontSize" value={config.lotFontSize} onChange={handleConfigChange} style={inputStyle} /></label>
                    </div>
                </div>

                {/* 6. Mock Data */}
                <div className="control-section" style={sectionStyle}>
                    <h3 style={headerStyle}>Test Data</h3>
                    <input type="text" name="productName" value={data.productName} onChange={handleDataChange} placeholder="Product Name" style={fullInputStyle} />
                    <input type="text" name="barcodeValue" value={data.barcodeValue} onChange={handleDataChange} placeholder="Barcode" style={fullInputStyle} />
                    <div style={rowStyle}>
                        <input type="text" name="display" value={data.display} onChange={handleDataChange} placeholder="Display" style={inputStyle} />
                        <input type="text" name="memory" value={data.memory} onChange={handleDataChange} placeholder="Memory" style={inputStyle} />
                    </div>
                    <div style={rowStyle}>
                        <input type="text" name="storage" value={data.storage} onChange={handleDataChange} placeholder="Storage" style={inputStyle} />
                        <input type="text" name="gpu" value={data.gpu} onChange={handleDataChange} placeholder="GPU" style={inputStyle} />
                    </div>
                    <input type="text" name="lotNumber" value={data.lotNumber} onChange={handleDataChange} placeholder="Lot Number" style={fullInputStyle} />
                </div>

                <button onClick={handleSave} style={{ ...printButtonStyle, background: '#10b981' }}>
                    <i className="fas fa-save" style={{ marginRight: '8px' }}></i> Save to Database
                </button>
            </div>
        </div>
    );
}

// Styles
const sectionStyle: React.CSSProperties = {
    background: 'white',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const headerStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.5rem'
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginBottom: '0.5rem'
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
};

const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    width: '100%',
    fontWeight: 600,
    boxSizing: 'border-box'
};

const fullInputStyle: React.CSSProperties = {
    ...inputStyle,
    marginBottom: '0.75rem'
};

const printButtonStyle: React.CSSProperties = {
    padding: '1rem',
    background: '#0f172a',
    color: 'white',
    borderRadius: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    marginTop: '1rem'
};
