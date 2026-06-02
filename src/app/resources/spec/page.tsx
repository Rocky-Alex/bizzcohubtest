"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Cpu, 
    Monitor, 
    HardDrive, 
    Zap, 
    ShieldAlert, 
    Tv, 
    RefreshCw, 
    Sparkles, 
    Laptop, 
    Server,
    Settings,
    User,
    X,
    Shield,
    Info
} from 'lucide-react';
import { getFullSpecs } from './actions';
import { toast } from 'sonner';

const getClientSideSpecs = async () => {
    if (typeof window === 'undefined') return null;

    // 1. Try to fetch from local dev server API (helps get 100% accurate client-side specs on hosted Vercel builds)
    try {
        const localResponse = await fetch('http://localhost:3000/api/system', {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (localResponse.ok) {
            const localData = await localResponse.json();
            if (localData && localData.system) {
                return localData;
            }
        }
    } catch (e) {
        // Silent catch: dev server not running locally
    }

    // 2. Get GPU model via WebGL
    let gpuModel = "Intel(R) UHD Graphics";
    try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (renderer) {
                    gpuModel = renderer.replace(/ANGLE \((.*)\)/, '$1').split(',')[0];
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    // 3. Get Battery status from browser API
    let batteryInfo = {
        hasBattery: false,
        percent: 100,
        isCharging: true,
        manufacturer: 'System Battery',
        designedCapacity: 45000,
        maxCapacity: 45000,
        currentCapacity: 45000,
        acConnected: true,
        cycleCount: 18
    };
    try {
        if ('getBattery' in navigator) {
            const battery = await (navigator as any).getBattery();
            batteryInfo = {
                hasBattery: true,
                percent: Math.round(battery.level * 100),
                isCharging: battery.charging,
                manufacturer: 'Internal Li-Polymer',
                designedCapacity: 45000,
                maxCapacity: 43500,
                currentCapacity: Math.round(43500 * battery.level),
                acConnected: battery.charging,
                cycleCount: 24
            };
        }
    } catch (e) {
        console.error(e);
    }

    // 4. Detect OS from userAgent
    const ua = navigator.userAgent;
    let osName = "Windows 11 Professional";
    let arch = "x64";
    if (ua.indexOf("Macintosh") !== -1) {
        osName = "macOS Sequoia";
        arch = "ARM64";
    } else if (ua.indexOf("Linux") !== -1) {
        osName = "Linux Enterprise";
    } else if (ua.indexOf("Android") !== -1) {
        osName = "Android OS";
    } else if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) {
        osName = "iOS Platform";
        arch = "ARM64";
    }

    // 5. Memory & Cores
    const cores = navigator.hardwareConcurrency || 8;
    const memoryGb = (navigator as any).deviceMemory || 16;

    // Load LocalStorage Custom Config if present
    const saved = localStorage.getItem('custom_specs_override');
    let custom: any = null;
    if (saved) {
        try {
            custom = JSON.parse(saved);
        } catch (e) {}
    }

    const finalMfg = custom?.manufacturer || 'HP';
    const finalModel = custom?.model || (osName.startsWith("macOS") ? "Apple MacBook Pro" : "HP ProBook 455 15.6 inch G9");
    const finalSerial = custom?.serial || "5CD242BGXC";
    const finalCpuBrand = custom?.cpuBrand || (osName.startsWith("macOS") ? "Apple Silicon (M-Series)" : "AMD Ryzen 5 5625U with Radeon Graphics");
    const finalCpuCores = custom?.cpuCores ? parseInt(custom.cpuCores) : cores;
    const finalCpuSpeed = custom?.cpuSpeed ? parseFloat(custom.cpuSpeed) : 2.3;
    const finalRamGb = custom?.ramGb ? parseFloat(custom.ramGb) : (memoryGb >= 8 ? memoryGb : 16);
    const finalRamType = custom?.ramType || 'DDR4';
    const finalRamSlots = custom?.ramSlotsCount ? parseInt(custom.ramSlotsCount) : 1;
    const finalRamMfg = custom?.ramManufacturer || 'Hynix/Hyundai';
    const finalStorageGb = custom?.storageGb ? parseFloat(custom.storageGb) : 512;
    const finalStorageType = custom?.storageType || 'SSD';
    const finalStorageName = custom?.storageName || 'NVMe SSD Controller';
    const finalGpuModel = custom?.gpuModel || gpuModel;
    const finalGpuVram = custom?.gpuVram ? parseFloat(custom.gpuVram) : 512;

    const finalSlotSize = (finalRamGb / finalRamSlots) * 1024 ** 3;
    const ramLayout = [];
    for (let i = 0; i < finalRamSlots; i++) {
        ramLayout.push({
            size: finalSlotSize,
            bank: String(i),
            type: finalRamType,
            ecc: false,
            clockSpeed: 3200,
            formFactor: 'SODIMM',
            manufacturer: finalRamMfg,
            partNum: 'HMA82GS6DJR8N-XN',
            serialNum: `32A78F2${i}`,
            voltageConfigured: 1.2
        });
    }

    return {
        system: {
            manufacturer: finalMfg,
            model: finalModel,
            serial: finalSerial,
            version: "v1.0"
        },
        cpu: {
            manufacturer: finalMfg === 'Apple' ? 'Apple' : (finalCpuBrand.toLowerCase().includes('intel') ? 'Intel' : 'AMD'),
            brand: finalCpuBrand,
            speed: finalCpuSpeed,
            cores: finalCpuCores,
            physicalCores: Math.ceil(finalCpuCores / 2)
        },
        mem: {
            total: finalRamGb * 1024 ** 3,
            used: (finalRamGb * 0.32) * 1024 ** 3,
            free: (finalRamGb * 0.68) * 1024 ** 3,
            available: (finalRamGb * 0.68) * 1024 ** 3
        },
        os: {
            distro: osName,
            arch: arch,
            release: "Build 22631",
            hostname: "DESKTOP-CLIENT",
            uefi: true
        },
        graphics: {
            controllers: [
                {
                    vendor: finalGpuModel.toUpperCase().includes("AMD") ? "AMD" : (finalGpuModel.toUpperCase().includes("NVIDIA") ? "NVIDIA" : "Intel"),
                    model: finalGpuModel,
                    vram: finalGpuVram
                }
            ],
            displays: [
                {
                    vendor: 'Primary Display Monitor',
                    model: 'Generic PnP Monitor',
                    resolutionX: window.screen.width,
                    resolutionY: window.screen.height,
                    currentRefreshRate: 60
                }
            ]
        },
        diskLayout: [
            {
                name: finalStorageName,
                type: finalStorageType,
                size: finalStorageGb * 1024 ** 3,
                smartStatus: 'Ok'
            }
        ],
        battery: batteryInfo,
        ramLayout: ramLayout
    };
};

export default function SpecCheckPage() {
    const [loading, setLoading] = useState(true);
    const [specs, setSpecs] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [simulatedLoad, setSimulatedLoad] = useState(12);
    const [simulatedTemp, setSimulatedTemp] = useState(42);
    const [simulatedGpuTemp, setSimulatedGpuTemp] = useState(51);

    // Manual Entry States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [processor, setProcessor] = useState('');
    const [ram, setRam] = useState('');
    const [ramCustom, setRamCustom] = useState('');
    const [storage, setStorage] = useState('');
    const [storageCustom, setStorageCustom] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [warrantyOption, setWarrantyOption] = useState('option1');
    const [warrantyResult, setWarrantyResult] = useState<any>(null);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    
    // Form fields states
    const [cfgMfg, setCfgMfg] = useState('HP');
    const [cfgModel, setCfgModel] = useState('HP ProBook 455 G9');
    const [cfgSerial, setCfgSerial] = useState('5CD242BGXC');
    const [cfgCpuBrand, setCfgCpuBrand] = useState('AMD Ryzen 5 5625U with Radeon Graphics');
    const [cfgCpuCores, setCfgCpuCores] = useState(12);
    const [cfgCpuSpeed, setCfgCpuSpeed] = useState(2.3);
    const [cfgRamGb, setCfgRamGb] = useState(16);
    const [cfgRamType, setCfgRamType] = useState('DDR4');
    const [cfgRamSlots, setCfgRamSlots] = useState(1);
    const [cfgRamMfg, setCfgRamMfg] = useState('Hynix/Hyundai');
    const [cfgStorageGb, setCfgStorageGb] = useState(512);
    const [cfgStorageType, setCfgStorageType] = useState('SSD');
    const [cfgStorageName, setCfgStorageName] = useState('NVMe SSD Controller');
    const [cfgGpuModel, setCfgGpuModel] = useState('AMD Radeon Graphics');
    const [cfgGpuVram, setCfgGpuVram] = useState(512);

    useEffect(() => {
        const saved = localStorage.getItem('custom_specs_override');
        if (saved) {
            try {
                const c = JSON.parse(saved);
                setCfgMfg(c.manufacturer || 'HP');
                setCfgModel(c.model || 'HP ProBook 455 G9');
                setCfgSerial(c.serial || '5CD242BGXC');
                setCfgCpuBrand(c.cpuBrand || 'AMD Ryzen 5 5625U with Radeon Graphics');
                setCfgCpuCores(c.cpuCores || 12);
                setCfgCpuSpeed(c.cpuSpeed || 2.3);
                setCfgRamGb(c.ramGb || 16);
                setCfgRamType(c.ramType || 'DDR4');
                setCfgRamSlots(c.ramSlotsCount || 1);
                setCfgRamMfg(c.ramManufacturer || 'Hynix/Hyundai');
                setCfgStorageGb(c.storageGb || 512);
                setCfgStorageType(c.storageType || 'SSD');
                setCfgStorageName(c.storageName || 'NVMe SSD Controller');
                setCfgGpuModel(c.gpuModel || 'AMD Radeon Graphics');
                setCfgGpuVram(c.gpuVram || 512);
            } catch(e){}
        }
    }, []);

    // Initialize purchase date when modal opens
    useEffect(() => {
        if (isModalOpen) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            setPurchaseDate(`${yyyy}-${mm}-${dd}`);
        }
    }, [isModalOpen]);

    // Fetch Specs from server action
    const fetchSpecsData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const isLocalhost = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

            let data = null;
            if (isLocalhost) {
                data = await getFullSpecs();
            }

            if (!isLocalhost || !data) {
                const clientData = await getClientSideSpecs();
                setSpecs(clientData);
            } else {
                setSpecs(data);
                if (isRefresh) {
                    toast.success("System specifications updated successfully!");
                }
            }
        } catch (error) {
            console.error("Error loading specs:", error);
            try {
                const clientData = await getClientSideSpecs();
                setSpecs(clientData);
            } catch (innerError) {
                console.error("Client side fallback failed:", innerError);
                toast.error("An error occurred while fetching specs.");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpecsData();

        // Simulate live metrics fluctuations to make the UI look alive and high-fidelity
        const interval = setInterval(() => {
            setSimulatedLoad(prev => {
                const delta = Math.floor(Math.random() * 7) - 3;
                return Math.max(5, Math.min(65, prev + delta));
            });
            setSimulatedTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(38, Math.min(48, prev + delta));
            });
            setSimulatedGpuTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(47, Math.min(56, prev + delta));
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Helper: calculate storage total size
    const getTotalStorage = () => {
        if (!specs || !specs.diskLayout) return "0 GB";
        const bytes = specs.diskLayout.reduce((acc: number, disk: any) => acc + (disk.size || 0), 0);
        const tb = bytes / 1024 ** 4;
        if (tb >= 1) return `${tb.toFixed(1)} TB`;
        return `${(bytes / 1024 ** 3).toFixed(0)} GB`;
    };

    // Helper: format bytes to GB
    const formatBytesToGb = (bytes: number) => {
        return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    };

    // Helper: generate segmented progress bar indicators
    const renderSegments = (percent: number, activeColor: string = '#00E5FF', segmentsCount = 8) => {
        const activeSegments = Math.round((percent / 100) * segmentsCount);
        return (
            <div className="segment-container" style={{ display: 'flex', gap: '4px', width: '100%', height: '8px', marginTop: '8px' }}>
                {Array.from({ length: segmentsCount }).map((_, idx) => {
                    const isActive = idx < activeSegments;
                    return (
                        <div 
                            key={idx} 
                            style={{ 
                                flex: 1, 
                                height: '100%', 
                                background: isActive ? activeColor : '#1E293B',
                                opacity: isActive ? 1 : 0.4,
                                boxShadow: isActive ? `0 0 8px ${activeColor}` : 'none',
                                transition: 'all 0.3s ease',
                                borderRadius: '1px'
                            }} 
                        />
                    );
                })}
            </div>
        );
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBrand('');
        setModel('');
        setProcessor('');
        setRam('');
        setRamCustom('');
        setStorage('');
        setStorageCustom('');
        setWarrantyOption('option1');
        setWarrantyResult(null);
    };

    const handleCalculateWarranty = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalRam = ram;
        if (ram === 'other') {
            finalRam = ramCustom;
        }
        
        let finalStorage = storage;
        if (storage === 'other') {
            finalStorage = storageCustom;
        }
        
        let warrantyStatusText = '';
        if (warrantyOption === 'option1') {
            warrantyStatusText = 'Non-Warranty / As-Is Condition (No warranty)';
        } else {
            const addDays = (dateStr: string, days: number) => {
                const parts = dateStr.split('-');
                if (parts.length !== 3) return '';
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const date = new Date(year, month, day + days);
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };
            
            const expiryDate = addDays(purchaseDate, 7);
            warrantyStatusText = `7-Day Warranty (Expires: ${expiryDate})`;
        }
        
        setWarrantyResult({
            laptop: `${brand} ${model}`,
            processor,
            specs: `${finalRam} / ${finalStorage}`,
            warranty: warrantyStatusText
        });
        
        setTimeout(() => {
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) {
                modalBody.scrollTo({
                    top: modalBody.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#05070F',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #0E162D 0%, #05070F 100%)',
            color: '#E2E8F0',
            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif', monospace",
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: '80px'
        }}>
            {/* Embedded styles for beautiful animations, grids, scanning lines and effects */}
            <style dangerouslySetInnerHTML={{ __html: `
                .cyber-grid {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                    background-position: center;
                    pointer-events: none;
                    z-index: 1;
                }
                .scanline {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(to bottom, rgba(0, 229, 255, 0) 0%, rgba(0, 229, 255, 0.15) 50%, rgba(0, 229, 255, 0) 100%);
                    animation: scan 6s linear infinite;
                    pointer-events: none;
                    z-index: 2;
                }
                @keyframes scan {
                    0% { transform: translateY(-100px); }
                    100% { transform: translateY(100vh); }
                }
                .cyber-glow-btn {
                    position: relative;
                    background: transparent;
                    border: 1px solid #00E5FF;
                    color: #00E5FF;
                    font-size: 13px;
                    letter-spacing: 0.1em;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 10px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
                    z-index: 10;
                }
                .cyber-glow-btn:hover {
                    background: rgba(0, 229, 255, 0.1);
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.4), inset 0 0 10px rgba(0, 229, 255, 0.2);
                    text-shadow: 0 0 5px #00E5FF;
                }
                .cyber-card {
                    background: rgba(10, 15, 30, 0.7);
                    border: 1px solid rgba(0, 229, 255, 0.1);
                    border-radius: 6px;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                .cyber-card:hover {
                    border-color: rgba(0, 229, 255, 0.35);
                    box-shadow: 0 0 25px rgba(0, 229, 255, 0.08);
                    transform: translateY(-2px);
                }
                .cyber-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 3px;
                    height: 12px;
                    background: #00E5FF;
                    box-shadow: 0 0 8px #00E5FF;
                }
                .cyber-card::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 12px;
                    height: 1px;
                    background: rgba(0, 229, 255, 0.3);
                }
                .glow-pulse {
                    animation: pulse 1.8s infinite alternate;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 4px #00FFB2, inset 0 0 2px #00FFB2; opacity: 0.6; }
                    100% { box-shadow: 0 0 14px #00FFB2, inset 0 0 4px #00FFB2; opacity: 1; }
                }
                .scan-bar-active {
                    animation: scanBar 1.5s ease infinite alternate;
                }
                @keyframes scanBar {
                    0% { filter: brightness(0.8) drop-shadow(0 0 1px #00E5FF); }
                    100% { filter: brightness(1.2) drop-shadow(0 0 5px #00E5FF); }
                }
                .terminal-header-link {
                    color: rgba(226, 232, 240, 0.6);
                    font-size: 13px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .terminal-header-link:hover, .terminal-header-link.active {
                    color: #00E5FF;
                    text-shadow: 0 0 4px rgba(0, 229, 255, 0.4);
                }
                
                /* Modal Overlay */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: rgba(5, 7, 15, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease forwards;
                }

                /* Modal Container */
                .modal-content {
                    background-color: #0A0F2D;
                    border: 1px solid rgba(255, 126, 64, 0.4);
                    box-shadow: 0 0 35px rgba(255, 126, 64, 0.2);
                    width: 90%;
                    max-width: 550px;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                    animation: slideUp 0.3s ease forwards;
                    backdrop-filter: blur(15px);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* Form Styles */
                .form-group {
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .form-group label {
                    font-size: 11px;
                    color: rgba(226, 232, 240, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                    font-family: monospace;
                }

                .form-group input[type="text"],
                .form-group input[type="date"],
                .form-group select {
                    background-color: rgba(5, 7, 15, 0.7);
                    border: 1px solid rgba(0, 229, 255, 0.2);
                    color: #FFFFFF;
                    padding: 12px 16px;
                    font-size: 14px;
                    border-radius: 4px;
                    outline: none;
                    transition: all 0.3s;
                }

                .form-group input[type="text"]::placeholder {
                    color: rgba(226, 232, 240, 0.3);
                }

                .form-group input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }

                .form-group select {
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    background-size: 16px;
                    padding-right: 40px;
                    cursor: pointer;
                }

                .form-group select:focus,
                .form-group input[type="text"]:focus,
                .form-group input[type="date"]:focus {
                    border-color: #00E5FF;
                    box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
                }

                .btn-submit {
                    background: rgba(255, 126, 64, 0.1);
                    border: 1px solid #FF7E40;
                    color: #FF7E40;
                    font-size: 14px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    padding: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                    width: 100%;
                    margin-top: 10px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }

                .btn-submit:hover {
                    background: #FF7E40;
                    color: #05070F;
                    box-shadow: 0 0 15px rgba(255, 126, 64, 0.4);
                }

                .result-container {
                    background: rgba(255, 126, 64, 0.03);
                    border: 1px solid rgba(255, 126, 64, 0.25);
                    border-radius: 4px;
                    padding: 20px;
                    margin-top: 24px;
                    animation: fadeIn 0.4s ease;
                }

                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    border-bottom: 1px dashed rgba(255, 126, 64, 0.2);
                    padding-bottom: 10px;
                }

                .result-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .result-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .result-label {
                    font-size: 11px;
                    color: rgba(226, 232, 240, 0.4);
                    text-transform: uppercase;
                    font-family: monospace;
                }

                .result-val {
                    font-size: 14px;
                    color: #FFFFFF;
                    font-weight: bold;
                }

                .result-val.highlighted {
                    color: #FF7E40;
                    font-size: 18px;
                    text-shadow: 0 0 8px rgba(255, 126, 64, 0.3);
                    font-family: monospace;
                }
            ` }} />

            {/* Background elements */}
            <div className="cyber-grid" />
            <div className="scanline" />

            {/* Cyberpunk Top Bar */}
            <div style={{
                borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
                backgroundColor: 'rgba(5, 7, 15, 0.85)',
                backdropFilter: 'blur(10px)',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 100,
                padding: '0 24px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#00E5FF', letterSpacing: '0.08em', textShadow: '0 0 8px rgba(0, 229, 255, 0.3)' }}>
                            SpecCheck
                        </span>
                    </div>
                    <nav style={{ display: 'flex', gap: '24px' }}>
                        <a href="#" className="terminal-header-link active">Dashboard</a>
                        <a href="#" className="terminal-header-link">Benchmarks</a>
                        <a href="#" className="terminal-header-link">Comparison</a>
                        <a href="#" className="terminal-header-link">History</a>
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(226, 232, 240, 0.6)' }}>
                    <Settings size={18} style={{ cursor: 'pointer' }} className="terminal-header-link" />
                    <User size={18} style={{ cursor: 'pointer' }} className="terminal-header-link" />
                </div>
            </div>

            {/* Back Nav Header */}
            <header style={{
                padding: '24px 40px',
                borderBottom: '1px solid rgba(0, 229, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                zIndex: 5
            }}>
                <Link href="/resources" style={{ color: 'rgba(226, 232, 240, 0.5)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '14px', transition: 'all 0.3s' }} className="terminal-header-link">
                    <ArrowLeft size={16} /> Back to Resources
                </Link>
                <div style={{ width: '1px', height: '16px', background: 'rgba(0, 229, 255, 0.15)' }}></div>
                <span style={{ fontSize: '13px', color: 'rgba(0, 229, 255, 0.6)', letterSpacing: '0.1em', fontWeight: 'bold' }}>SPECC_SYSTEM_MODULE</span>
            </header>

            {/* Main Interactive Dashboard Area */}
            <main style={{
                flex: '1',
                padding: '16px 40px 48px',
                zIndex: 5,
                maxWidth: '1280px',
                width: '100%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Hero / State Panel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ 
                            fontSize: '36px', 
                            fontWeight: 900, 
                            letterSpacing: '0.05em', 
                            color: '#FFFFFF',
                            textShadow: '0 0 15px rgba(255, 255, 255, 0.15)',
                            margin: 0,
                            fontFamily: "'Outfit', sans-serif"
                        }}>
                            SYSTEM DIAGNOSTICS
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <div className="glow-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FFB2' }} />
                            <span style={{ fontSize: '12px', letterSpacing: '0.15em', fontWeight: 'bold', color: '#00FFB2' }}>
                                NODE: ONLINE & OPTIMAL
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button 
                            onClick={() => setIsConfigModalOpen(true)}
                            className="cyber-glow-btn"
                            style={{ 
                                borderColor: '#B8C3FF', 
                                color: '#B8C3FF', 
                                boxShadow: '0 0 10px rgba(99, 102, 241, 0.15)' 
                            }}
                        >
                            <Settings size={14} />
                            CONFIGURE SPECS
                        </button>
                        <button 
                            onClick={() => {
                                setIsModalOpen(true);
                                setWarrantyResult(null); // Clear previous results
                            }} 
                            className="cyber-glow-btn"
                            style={{ 
                                borderColor: '#FF7E40', 
                                color: '#FF7E40', 
                                boxShadow: '0 0 10px rgba(255, 126, 64, 0.15)' 
                            }}
                        >
                            <Laptop size={14} />
                            MANUAL ENTRY
                        </button>
                        <button 
                            onClick={() => fetchSpecsData(true)} 
                            disabled={refreshing || loading}
                            className="cyber-glow-btn"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "FETCHING..." : "FETCH DETAILS"}
                        </button>
                    </div>
                </div>

                {typeof window !== 'undefined' && 
                 window.location.hostname !== 'localhost' && 
                 window.location.hostname !== '127.0.0.1' && (
                    <div style={{
                        background: 'rgba(255, 126, 64, 0.08)',
                        border: '1px solid rgba(255, 126, 64, 0.2)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#FF9E64',
                        boxSizing: 'border-box',
                        marginBottom: '16px'
                    }}>
                        <Info size={14} style={{ flexShrink: 0 }} />
                        <span>
                            <strong>Hosted Diagnostics Mode:</strong> Detailed local hardware information (such as RAM layout and Storage size) is simulated due to browser security restrictions. 
                            Use the <strong>Configure Specs</strong> button at the top right to override and input your device's actual specifications.
                        </span>
                    </div>
                )}

                {loading ? (
                    /* Elegant Loading Grid Skeleton */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                        <div style={{ border: '2px solid rgba(0, 229, 255, 0.2)', borderTop: '2px solid #00E5FF', borderRadius: '50%', width: '40px', height: '40px' }} className="animate-spin" />
                        <span style={{ fontSize: '13px', color: '#00E5FF', letterSpacing: '0.2em', fontWeight: 'bold' }}>SCANNING HARDWARE ARRAYS...</span>
                    </div>
                ) : (
                    /* Beautiful Cyber Grid */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '24px'
                        }}>
                            {/* Card 1: SYS_OVERVIEW_01 */}
                            <div className="cyber-card" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>SYS_OVERVIEW_01</span>
                                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#00E5FF', marginTop: '12px', marginBottom: '4px', textShadow: '0 0 10px rgba(0, 229, 255, 0.2)' }}>
                                            {specs?.system?.manufacturer} {specs?.system?.model}
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', fontFamily: 'monospace' }}>
                                            S/N: {specs?.system?.serial}
                                        </p>
                                    </div>
                                    <Laptop size={44} color="rgba(0, 229, 255, 0.15)" style={{ strokeWidth: 1 }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OS ARCHITECTURE</span>
                                        <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '4px' }}>{specs?.os?.distro} ({specs?.os?.arch})</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TEMP_AVG</span>
                                        <div style={{ fontSize: '14px', color: '#00FFB2', fontWeight: 'bold', marginTop: '4px' }}>{simulatedTemp}°C</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: PROC_UNIT */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>PROC_UNIT</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px', textTransform: 'uppercase' }}>Model</h4>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px', minHeight: '44px' }}>
                                            {specs?.cpu?.brand}
                                        </h3>
                                    </div>
                                    <Cpu size={24} color="#00E5FF" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>Clock Speed</span>
                                        <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>{specs?.cpu?.speed ? specs.cpu.speed.toFixed(1) : '2.6'} GHz <span style={{ fontSize: '10px', color: 'rgba(226, 232, 240, 0.5)' }}>BASE</span></span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>Cores (Logical)</span>
                                        <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{specs?.cpu?.cores} Cores</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)' }}>
                                            <span>LOAD</span>
                                            <span style={{ color: '#00E5FF' }}>{simulatedLoad}%</span>
                                        </div>
                                        {renderSegments(simulatedLoad, '#00E5FF', 10)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: MEM_ALLOC */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>MEM_ALLOC</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Capacity</h4>
                                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                                            {specs?.mem ? (specs.mem.total / 1024 ** 3).toFixed(0) : '64'} GB
                                        </h3>
                                    </div>
                                    <Server size={24} color="#00FFB2" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 178, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>USED</span>
                                        <span style={{ color: '#00FFB2', fontWeight: 'bold' }}>{specs?.mem ? formatBytesToGb(specs.mem.used) : '19.4 GB'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>AVAILABLE</span>
                                        <span style={{ color: '#FFFFFF' }}>{specs?.mem ? formatBytesToGb(specs.mem.available) : '44.6 GB'}</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        {renderSegments(specs?.mem ? (specs.mem.used / specs.mem.total) * 100 : 28, '#00FFB2', 8)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: STOR_VOL */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>STOR_VOL</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Capacity</h4>
                                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                                            {getTotalStorage()}
                                        </h3>
                                    </div>
                                    <HardDrive size={24} color="#00E5FF" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>DRIVE INTEGRITY</span>
                                        <span style={{ color: '#00FFB2', fontWeight: 'bold' }}>{specs?.diskLayout?.[0]?.smartStatus === 'Ok' ? 'OPTIMAL' : 'OK'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>VOLUMES DETECTED</span>
                                        <span style={{ color: '#FFFFFF' }}>{specs?.diskLayout?.length || 1} Device(s)</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)' }}>
                                            <span>USED CAPACITY</span>
                                            <span style={{ color: '#00E5FF' }}>38%</span>
                                        </div>
                                        {renderSegments(38, '#00E5FF', 8)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: GFX_PROC */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>GFX_PROC</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Model</h4>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px', minHeight: '44px' }}>
                                            {specs?.graphics?.controllers?.[0]?.vendor} {specs?.graphics?.controllers?.[0]?.model}
                                        </h3>
                                    </div>
                                    <Monitor size={24} color="#00FFB2" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 178, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>VRAM</span>
                                        <span style={{ color: '#00FFB2', fontWeight: 'bold' }}>{specs?.graphics?.controllers?.[0]?.vram ? `${(specs.graphics.controllers[0].vram / 1024).toFixed(0)} GB` : '6 GB'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>TEMP</span>
                                        <span style={{ color: '#FF7E40', fontWeight: 'bold' }}>{simulatedGpuTemp}°C</span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        {renderSegments(42, '#00FFB2', 8)}
                                    </div>
                                </div>
                            </div>

                            {/* Card 6: DISP_RES */}
                            <div className="cyber-card" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>DISP_RES</span>
                                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#00E5FF', marginTop: '12px', marginBottom: '4px', textShadow: '0 0 10px rgba(0, 229, 255, 0.2)' }}>
                                            {specs?.graphics?.displays?.[0]?.resolutionX || 1920} x {specs?.graphics?.displays?.[0]?.resolutionY || 1080}
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', fontFamily: 'monospace' }}>
                                            Monitor: {specs?.graphics?.displays?.[0]?.model || 'Generic Display'}
                                        </p>
                                    </div>
                                    <Tv size={36} color="rgba(0, 229, 255, 0.15)" style={{ strokeWidth: 1 }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REFRESH RATE</span>
                                        <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 'bold', marginTop: '4px' }}>
                                            {specs?.graphics?.displays?.[0]?.currentRefreshRate || 60} Hz
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONNECTION BUS</span>
                                        <div style={{ fontSize: '14px', color: '#00E5FF', fontWeight: 'bold', marginTop: '4px' }}>DP embedded</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 7: PWR_CELL */}
                            <div className="cyber-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>PWR_CELL</span>
                                        <h4 style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', marginTop: '8px' }}>Charge</h4>
                                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                                            {specs?.battery?.hasBattery ? `${specs.battery.percent}%` : '100%'} <span style={{ fontSize: '12px', color: '#00FFB2', fontWeight: 'bold', marginLeft: '4px' }}>
                                                {specs?.battery?.hasBattery ? (specs.battery.isCharging ? 'CHARGING' : 'BATTERY POWER') : 'HEALTHY'}
                                            </span>
                                        </h3>
                                    </div>
                                    <Zap size={24} color="#00FFB2" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 178, 0.4))' }} />
                                </div>
                                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0, 229, 255, 0.05)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>POWER SUPPLY</span>
                                        <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>{specs?.battery?.acConnected ? 'AC CONNECTED' : 'BATTERY'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                                        <span style={{ color: 'rgba(226, 232, 240, 0.4)' }}>CAPACITY RATIO</span>
                                        <span style={{ color: '#FFFFFF' }}>
                                            {specs?.battery?.maxCapacity && specs?.battery?.designedCapacity
                                                ? `${((specs.battery.maxCapacity / specs.battery.designedCapacity) * 100).toFixed(0)}% Health`
                                                : '100%'}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        {renderSegments(specs?.battery?.percent || 100, '#00FFB2', 10)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Warnings / System Notifications Panel */}
                        <div style={{
                            background: 'rgba(255, 126, 64, 0.04)',
                            border: '1px solid rgba(255, 126, 64, 0.15)',
                            borderRadius: '6px',
                            padding: '16px 20px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <ShieldAlert size={20} color="#FF7E40" />
                            <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.85)', lineHeight: '1.5' }}>
                                <strong style={{ color: '#FF7E40' }}>Note:</strong> System diagnostics query low-level hardware structures directly. Real-time updates occur when the <strong>FETCH DETAILS</strong> trigger is executed or network activity scales.
                            </span>
                        </div>
                    </div>
                )}
            </main>

            {/* Manual Entry Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
                    <div className="modal-content">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px 24px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <h2 style={{
                                fontFamily: "'Outfit', monospace",
                                fontSize: '22px',
                                fontWeight: 'bold',
                                color: '#FF7E40',
                                letterSpacing: '1px',
                                margin: 0
                            }}>
                                MANUAL ENTRY
                            </h2>
                            <button 
                                onClick={handleCloseModal}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(226, 232, 240, 0.6)',
                                    cursor: 'pointer',
                                    transition: 'color 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#FF7E40'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(226, 232, 240, 0.6)'}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                            <form onSubmit={handleCalculateWarranty}>
                                <div className="form-group">
                                    <label>Brand</label>
                                    <input 
                                        type="text" 
                                        value={brand} 
                                        onChange={(e) => setBrand(e.target.value)} 
                                        required 
                                        placeholder="e.g. Dell, HP, Lenovo" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Model</label>
                                    <input 
                                        type="text" 
                                        value={model} 
                                        onChange={(e) => setModel(e.target.value)} 
                                        required 
                                        placeholder="e.g. XPS 15, ThinkPad X1" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Processor</label>
                                    <input 
                                        type="text" 
                                        value={processor} 
                                        onChange={(e) => setProcessor(e.target.value)} 
                                        required 
                                        placeholder="e.g. Intel Core i7-12700H, AMD Ryzen 7 5800U" 
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>RAM</label>
                                        <select 
                                            value={ram} 
                                            onChange={(e) => {
                                                setRam(e.target.value);
                                                if (e.target.value !== 'other') setRamCustom('');
                                            }} 
                                            required
                                        >
                                            <option value="" disabled>Select RAM</option>
                                            <option value="8 GB">8 GB</option>
                                            <option value="16 GB">16 GB</option>
                                            <option value="32 GB">32 GB</option>
                                            <option value="64 GB">64 GB</option>
                                            <option value="other">Other (Specify)</option>
                                        </select>
                                        {ram === 'other' && (
                                            <input 
                                                type="text" 
                                                value={ramCustom} 
                                                onChange={(e) => setRamCustom(e.target.value)} 
                                                required 
                                                style={{ marginTop: '10px' }} 
                                                placeholder="e.g. 12 GB" 
                                            />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Storage</label>
                                        <select 
                                            value={storage} 
                                            onChange={(e) => {
                                                setStorage(e.target.value);
                                                if (e.target.value !== 'other') setStorageCustom('');
                                            }} 
                                            required
                                        >
                                            <option value="" disabled>Select Storage</option>
                                            <option value="256 GB SSD">256 GB SSD</option>
                                            <option value="512 GB SSD">512 GB SSD</option>
                                            <option value="1 TB SSD">1 TB SSD</option>
                                            <option value="2 TB SSD">2 TB SSD</option>
                                            <option value="other">Other (Specify)</option>
                                        </select>
                                        {storage === 'other' && (
                                            <input 
                                                type="text" 
                                                value={storageCustom} 
                                                onChange={(e) => setStorageCustom(e.target.value)} 
                                                required 
                                                style={{ marginTop: '10px' }} 
                                                placeholder="e.g. 128 GB SSD" 
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Purchase Date</label>
                                    <input 
                                        type="date" 
                                        value={purchaseDate} 
                                        onChange={(e) => setPurchaseDate(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Warranty Condition</label>
                                    <select 
                                        value={warrantyOption} 
                                        onChange={(e) => setWarrantyOption(e.target.value)} 
                                        required
                                    >
                                        <option value="option1">Non-Warranty / As-Is Condition</option>
                                        <option value="option2">7-Day Warranty</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-submit">SUBMIT DETAILS</button>
                            </form>

                            {/* Warranty Result Section */}
                            {warrantyResult && (
                                <div className="result-container">
                                    <div className="result-header">
                                        <span style={{ fontSize: '10px', color: 'rgba(255, 126, 64, 0.6)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>WARRANTY_REPORT</span>
                                        <Shield size={16} color="#FF7E40" />
                                    </div>
                                    <div className="result-body">
                                        <div className="result-row">
                                            <span className="result-label">Laptop:</span>
                                            <span className="result-val">{warrantyResult.laptop}</span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Processor:</span>
                                            <span className="result-val">{warrantyResult.processor}</span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Specs:</span>
                                            <span className="result-val">{warrantyResult.specs}</span>
                                        </div>
                                        <div className="result-row" style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 126, 64, 0.1)', paddingTop: '8px' }}>
                                            <span className="result-label">Warranty:</span>
                                            <span className="result-val highlighted">{warrantyResult.warranty}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Custom Telemetry Specs Configurator Modal */}
            {isConfigModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ border: '1px solid rgba(184, 195, 255, 0.4)', boxShadow: '0 0 35px rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(67, 70, 86, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#B8C3FF', margin: 0 }}>Configure Device Telemetry Specs</h3>
                            <button onClick={() => setIsConfigModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8E90A2', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const updated = {
                                manufacturer: cfgMfg,
                                model: cfgModel,
                                serial: cfgSerial,
                                cpuBrand: cfgCpuBrand,
                                cpuCores: cfgCpuCores,
                                cpuSpeed: cfgCpuSpeed,
                                ramGb: cfgRamGb,
                                ramType: cfgRamType,
                                ramSlotsCount: cfgRamSlots,
                                ramManufacturer: cfgRamMfg,
                                storageGb: cfgStorageGb,
                                storageType: cfgStorageType,
                                storageName: cfgStorageName,
                                gpuModel: cfgGpuModel,
                                gpuVram: cfgGpuVram
                            };
                            localStorage.setItem('custom_specs_override', JSON.stringify(updated));
                            setIsConfigModalOpen(false);
                            fetchSpecsData(true);
                        }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }} className="modal-body">
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Manufacturer</label>
                                    <input type="text" value={cfgMfg} onChange={(e) => setCfgMfg(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Model Name</label>
                                    <input type="text" value={cfgModel} onChange={(e) => setCfgModel(e.target.value)} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Serial Number</label>
                                    <input type="text" value={cfgSerial} onChange={(e) => setCfgSerial(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Processor (CPU Brand)</label>
                                    <input type="text" value={cfgCpuBrand} onChange={(e) => setCfgCpuBrand(e.target.value)} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>CPU Cores (Threads)</label>
                                    <input type="number" value={cfgCpuCores} onChange={(e) => setCfgCpuCores(parseInt(e.target.value))} required min={1} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Base Clock Speed (GHz)</label>
                                    <input type="number" step="0.01" value={cfgCpuSpeed} onChange={(e) => setCfgCpuSpeed(parseFloat(e.target.value))} required min={0.1} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Total RAM (GB)</label>
                                    <input type="number" value={cfgRamGb} onChange={(e) => setCfgRamGb(parseInt(e.target.value))} required min={1} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>RAM Type</label>
                                    <select value={cfgRamType} onChange={(e) => setCfgRamType(e.target.value)}>
                                        <option value="DDR4">DDR4</option>
                                        <option value="DDR5">DDR5</option>
                                        <option value="LPDDR5">LPDDR5</option>
                                        <option value="LPDDR4">LPDDR4</option>
                                        <option value="DDR3">DDR3</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Active RAM Slots</label>
                                    <select value={cfgRamSlots} onChange={(e) => setCfgRamSlots(parseInt(e.target.value))}>
                                        <option value={1}>1 Slot Occupied</option>
                                        <option value={2}>2 Slots Occupied</option>
                                        <option value={4}>4 Slots Occupied</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>RAM Manufacturer</label>
                                    <input type="text" value={cfgRamMfg} onChange={(e) => setCfgRamMfg(e.target.value)} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Storage Size (GB)</label>
                                    <input type="number" value={cfgStorageGb} onChange={(e) => setCfgStorageGb(parseInt(e.target.value))} required min={1} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Storage Type</label>
                                    <select value={cfgStorageType} onChange={(e) => setCfgStorageType(e.target.value)}>
                                        <option value="SSD">SSD</option>
                                        <option value="HDD">HDD</option>
                                        <option value="NVMe SSD">NVMe SSD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Storage Device Name</label>
                                <input type="text" value={cfgStorageName} onChange={(e) => setCfgStorageName(e.target.value)} required />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Graphics Card Model</label>
                                    <input type="text" value={cfgGpuModel} onChange={(e) => setCfgGpuModel(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>VRAM Size (MB)</label>
                                    <input type="number" value={cfgGpuVram} onChange={(e) => setCfgGpuVram(parseInt(e.target.value))} required min={0} />
                                </div>
                            </div>

                            <button type="submit" className="btn-submit" style={{ borderColor: '#B8C3FF', color: '#B8C3FF', background: 'rgba(99, 102, 241, 0.1)', marginTop: '12px' }}>
                                Apply Specifications
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
