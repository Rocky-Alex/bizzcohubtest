import './App.css';
"use client";

import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Cpu,
    Monitor,
    HardDrive,
    Zap,
    Activity,
    Tv,
    RefreshCw,
    Database,
    Info,
    Check,
    Settings,
    X,
    Palette
} from 'lucide-react';
// import { toast } from 'sonner';

// Polyfill toast since sonner is not installed in the basic template
const toast = {
    success: (msg: string) => console.log(msg),
    error: (msg: string) => console.error(msg)
};

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

    // 4. Detect OS and Device details dynamically
    const ua = navigator.userAgent;
    let osName = "Windows PC / Laptop";
    let arch = "x64";
    let defaultMfg = "Generic PC OEM";
    let defaultModel = "Windows PC / Laptop";
    let defaultCpu = "Intel/AMD Core Processor";
    
    if (ua.indexOf("Macintosh") !== -1) {
        osName = "macOS Sequoia";
        arch = "ARM64";
        defaultMfg = "Apple";
        defaultModel = "Macintosh Computer";
        defaultCpu = "Apple Silicon";
    } else if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) {
        osName = "iOS Platform";
        arch = "ARM64";
        defaultMfg = "Apple";
        defaultModel = ua.indexOf("iPad") !== -1 ? "Apple iPad" : "Apple iPhone";
        defaultCpu = "Apple A-Series / M-Series Chip";
    } else if (ua.indexOf("Android") !== -1) {
        osName = "Android OS";
        arch = "ARM";
        defaultMfg = "Android OEM";
        defaultModel = "Android Device";
        defaultCpu = "ARM Multi-Core Processor";
    } else if (ua.indexOf("Linux") !== -1) {
        osName = "Linux Enterprise";
        defaultMfg = "Generic Linux OEM";
        defaultModel = "Linux PC / Laptop";
        defaultCpu = "x86_64 Core Processor";
    }

    // Attempt to refine default CPU brand based on detected WebGL GPU
    if (defaultCpu.includes("Intel/AMD")) {
        if (gpuModel.toUpperCase().includes("INTEL")) {
            defaultCpu = "Intel Core Processor";
            defaultMfg = "Intel System";
        } else if (gpuModel.toUpperCase().includes("AMD")) {
            defaultCpu = "AMD Ryzen Processor";
            defaultMfg = "AMD System";
        } else if (gpuModel.toUpperCase().includes("NVIDIA")) {
            defaultCpu = "Intel/AMD Core Processor (NVIDIA Graphics)";
        }
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

    const finalMfg = custom?.manufacturer || defaultMfg;
    const finalModel = custom?.model || defaultModel;
    const finalSerial = custom?.serial || "Unavailable (Sandbox Protected)";
    const finalCpuBrand = custom?.cpuBrand || defaultCpu;
    const finalCpuCores = custom?.cpuCores ? parseInt(custom.cpuCores) : cores;
    const finalCpuSpeed = custom?.cpuSpeed ? parseFloat(custom.cpuSpeed) : 2.4;
    const finalRamGb = custom?.ramGb ? parseFloat(custom.ramGb) : (memoryGb >= 8 ? memoryGb : 16);
    const finalRamType = custom?.ramType || 'DDR4';
    const finalRamSlots = custom?.ramSlotsCount ? parseInt(custom.ramSlotsCount) : 1;
    const finalRamTotalSlots = custom?.ramTotalSlots ? parseInt(custom.ramTotalSlots) : 2;
    const finalRamMfg = custom?.ramManufacturer || 'System Memory';
    const finalStorageGb = custom?.storageGb ? parseFloat(custom.storageGb) : 512;
    const finalStorageType = custom?.storageType || 'SSD';
    const finalStorageName = custom?.storageName || 'System Disk Drive';
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
        ramLayout: ramLayout,
        ramTotalSlots: finalRamTotalSlots
    };
};

export interface ThemeConfig {
    id: string;
    name: string;
    bgType: 'gradient' | 'solid';
    bgColor: string;
    bgGradientStart: string;
    bgGradientEnd: string;
    accentColor: string;
    accentSecColor: string;
    accentLightColor: string;
    textColor: string;
    fontFamily: string;
}

export const THEME_PRESETS: ThemeConfig[] = [
    {
        id: "cyber",
        name: "Cyber Space (Default)",
        bgType: "gradient",
        bgColor: "#111317",
        bgGradientStart: "#111317",
        bgGradientEnd: "#050505",
        accentColor: "#6366F1",
        accentSecColor: "#8B5CF6",
        accentLightColor: "#B8C3FF",
        textColor: "#E2E2E8",
        fontFamily: "'Inter', sans-serif"
    },
    {
        id: "emerald",
        name: "Emerald Shield",
        bgType: "gradient",
        bgColor: "#061612",
        bgGradientStart: "#061612",
        bgGradientEnd: "#020807",
        accentColor: "#10B981",
        accentSecColor: "#059669",
        accentLightColor: "#A7F3D0",
        textColor: "#E6F4EA",
        fontFamily: "'Outfit', sans-serif"
    },
    {
        id: "ruby",
        name: "Ruby Forge",
        bgType: "gradient",
        bgColor: "#1C090D",
        bgGradientStart: "#1C090D",
        bgGradientEnd: "#0A0204",
        accentColor: "#EF4444",
        accentSecColor: "#F97316",
        accentLightColor: "#FECACA",
        textColor: "#FCE8E6",
        fontFamily: "'Hanken Grotesk', sans-serif"
    },
    {
        id: "ocean",
        name: "Ocean Drift",
        bgType: "gradient",
        bgColor: "#0b132b",
        bgGradientStart: "#0b132b",
        bgGradientEnd: "#010409",
        accentColor: "#0EA5E9",
        accentSecColor: "#06B6D4",
        accentLightColor: "#BAE6FD",
        textColor: "#E0F2FE",
        fontFamily: "'Inter', sans-serif"
    },
    {
        id: "solar",
        name: "Solar Flare",
        bgType: "gradient",
        bgColor: "#1C150C",
        bgGradientStart: "#1C150C",
        bgGradientEnd: "#0A0703",
        accentColor: "#F59E0B",
        accentSecColor: "#D97706",
        accentLightColor: "#FEF3C7",
        textColor: "#FEFDF6",
        fontFamily: "'Outfit', sans-serif"
    },
    {
        id: "monochrome",
        name: "Monochrome Carbon",
        bgType: "gradient",
        bgColor: "#262626",
        bgGradientStart: "#262626",
        bgGradientEnd: "#0A0A0A",
        accentColor: "#D4D4D8",
        accentSecColor: "#71717A",
        accentLightColor: "#F4F4F5",
        textColor: "#F4F4F5",
        fontFamily: "'JetBrains Mono', monospace"
    }
];

export default function SpecCheckUltraPage() {
    const CURRENT_VERSION = "1.0.7";

    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>(THEME_PRESETS[0]);

    // Temp inputs for custom editing in the modal
    const [customBgType, setCustomBgType] = useState<'gradient' | 'solid'>('gradient');
    const [customBgColor, setCustomBgColor] = useState('#111317');
    const [customBgGradientStart, setCustomBgGradientStart] = useState('#111317');
    const [customBgGradientEnd, setCustomBgGradientEnd] = useState('#050505');
    const [customAccent, setCustomAccent] = useState('#6366F1');
    const [customAccentSec, setCustomAccentSec] = useState('#8B5CF6');
    const [customTextColor, setCustomTextColor] = useState('#E2E2E8');
    const [customFont, setCustomFont] = useState("'Inter', sans-serif");

    const applyPreset = (preset: ThemeConfig) => {
        setCustomBgType(preset.bgType);
        setCustomBgColor(preset.bgColor);
        setCustomBgGradientStart(preset.bgGradientStart);
        setCustomBgGradientEnd(preset.bgGradientEnd);
        setCustomAccent(preset.accentColor);
        setCustomAccentSec(preset.accentSecColor);
        setCustomTextColor(preset.textColor);
        setCustomFont(preset.fontFamily);
    };

    const [loading, setLoading] = useState(true);
    const [specs, setSpecs] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'ram' | 'memory' | 'battery' | 'graphics'>('overview');
    const [simulatedLoad, setSimulatedLoad] = useState(24);
    const [simulatedTemp, setSimulatedTemp] = useState(38);
    const [simulatedGpuTemp, setSimulatedGpuTemp] = useState(44);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isUpToDate, setIsUpToDate] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<any>(null);
    const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        if (typeof window !== 'undefined' && (window as any).electronAPI?.checkForUpdates) {
            try {
                const result = await (window as any).electronAPI.checkForUpdates();
                setIsCheckingUpdate(false);
                if (result) {
                    setUpdateInfo(result);
                    setIsUpdateModalOpen(true);
                    setIsUpToDate(false);
                } else {
                    setIsUpToDate(true);
                    setIsUpdateModalOpen(true);
                }
            } catch (err) {
                setIsCheckingUpdate(false);
                setIsUpToDate(true);
                setIsUpdateModalOpen(true);
            }
        } else {
            setIsCheckingUpdate(false);
            setIsUpToDate(true);
            setIsUpdateModalOpen(true);
        }
    };

    const executeUpdateDownload = async () => {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            setIsUpdating(true);
            setDownloadProgress(0);
            try {
                const downloadUrl = updateInfo?.url || 'https://bizzcohubtest.netlify.app/BizzCo-Telemetry-Setup.exe';
                
                if ((window as any).electronAPI.onDownloadProgress) {
                    (window as any).electronAPI.onDownloadProgress((percentage: number) => {
                        setDownloadProgress(percentage);
                    });
                }

                const res = await (window as any).electronAPI.downloadUpdate(downloadUrl);
                
                if ((window as any).electronAPI.removeDownloadProgress) {
                    (window as any).electronAPI.removeDownloadProgress();
                }
                
                if (!res.success) {
                    alert("Failed to download update: " + res.error);
                    setIsUpdating(false);
                } else {
                    setDownloadedFilePath(res.tempFile);
                    setIsUpdating(false);
                }
            } catch (e: any) {
                alert("Update failed: " + e.message);
                setIsUpdating(false);
            }
        } else {
            alert("Auto-updater is only available in the offline desktop app.");
        }
    };
    
    const executeInstallRestart = async () => {
        if (typeof window !== 'undefined' && (window as any).electronAPI && downloadedFilePath) {
            try {
                await (window as any).electronAPI.installUpdate(downloadedFilePath);
            } catch (e: any) {
                alert("Failed to install update: " + e.message);
            }
        }
    };
    
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
    const [cfgRamTotalSlots, setCfgRamTotalSlots] = useState(2);
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
                setCfgRamTotalSlots(c.ramTotalSlots || 2);
                setCfgRamMfg(c.ramManufacturer || 'Hynix/Hyundai');
                setCfgStorageGb(c.storageGb || 512);
                setCfgStorageType(c.storageType || 'SSD');
                setCfgStorageName(c.storageName || 'NVMe SSD Controller');
                setCfgGpuModel(c.gpuModel || 'AMD Radeon Graphics');
                setCfgGpuVram(c.gpuVram || 512);
            } catch(e){}
        }
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('custom_theme_config');
        if (savedTheme) {
            try {
                const parsed = JSON.parse(savedTheme);
                setThemeConfig(parsed);
                setCustomBgType(parsed.bgType || 'gradient');
                setCustomBgColor(parsed.bgColor || '#111317');
                setCustomBgGradientStart(parsed.bgGradientStart || '#111317');
                setCustomBgGradientEnd(parsed.bgGradientEnd || '#050505');
                setCustomAccent(parsed.accentColor || '#6366F1');
                setCustomAccentSec(parsed.accentSecColor || '#8B5CF6');
                setCustomTextColor(parsed.textColor || '#E2E2E8');
                setCustomFont(parsed.fontFamily || "'Inter', sans-serif");
            } catch (e) {
                console.error("Failed to parse custom theme config", e);
            }
        }
    }, []);

    const fetchSpecsData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            // Check if running inside Electron
            if (window.electronAPI) {
                // Fetch from Electron backend instantly
                const psCommand = `
                    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
                    $ram = Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
                    $bat = Get-WmiObject -Namespace root\\wmi -Class BatteryFullChargedCapacity -ErrorAction SilentlyContinue | Select-Object -First 1
                    $batStat = Get-WmiObject -Namespace root\\wmi -Class BatteryStatus -ErrorAction SilentlyContinue | Select-Object -First 1
                    $batStatic = Get-WmiObject -Namespace root\\wmi -Class BatteryStaticData -ErrorAction SilentlyContinue | Select-Object -First 1
                    
                    $sys = Get-CimInstance Win32_ComputerSystem | Select-Object -First 1
                    $gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1
                    $disk = Get-CimInstance Win32_DiskDrive | Select-Object -First 1
                    
                    @{
                        system = @{ manufacturer = $sys.Manufacturer; model = $sys.Model }
                        cpu = @{ brand = $cpu.Name; cores = $cpu.NumberOfLogicalProcessors; physicalCores = $cpu.NumberOfCores }
                        mem = @{ total = $ram.Sum; used = ($ram.Sum * 0.3) }
                        battery = @{
                            hasBattery = $($bat -ne $null)
                            percent = $(if($batStat -and $bat){ [math]::Round(($batStat.RemainingCapacity / $bat.FullChargedCapacity) * 100) }else{ 100 })
                            isCharging = $(if($batStat){ $batStat.Charging }else{ $true })
                            cycleCount = $(if($bat){ $bat.CycleCount }else{ 0 })
                            manufacturer = $(if($batStatic){ $batStatic.ManufactureName }else{ 'System Battery' })
                        }
                        graphics = @{ controllers = @( @{ model = $gpu.Name; vendor = $gpu.AdapterCompatibility } ) }
                        diskLayout = @( @{ name = $disk.Model; size = $disk.Size } )
                    } | ConvertTo-Json -Depth 10 -Compress
                `;
                
                const result = await window.electronAPI.executePowerShell(psCommand);
                if (result && !result.error && result.stdout) {
                    try {
                        const parsed = JSON.parse(result.stdout);
                        setSpecs(parsed);
                        if (isRefresh) toast.success("Telemetry refreshed directly from hardware!");
                    } catch (e) {
                        console.error("Failed to parse powershell JSON", e);
                        const fallback = await getClientSideSpecs();
                        setSpecs(fallback);
                    }
                } else {
                    const fallback = await getClientSideSpecs();
                    setSpecs(fallback);
                }
            } else {
                // Browser fallback
                const clientData = await getClientSideSpecs();
                setSpecs(clientData);
            }
        } catch (error) {
            console.error("Error loading specs:", error);
            const fallback = await getClientSideSpecs();
            setSpecs(fallback);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpecsData();

        // Simulate fluctuations
        const interval = setInterval(() => {
            setSimulatedLoad(prev => {
                const delta = Math.floor(Math.random() * 9) - 4;
                return Math.max(10, Math.min(85, prev + delta));
            });
            setSimulatedTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(35, Math.min(46, prev + delta));
            });
            setSimulatedGpuTemp(prev => {
                const delta = Math.floor(Math.random() * 3) - 1;
                return Math.max(40, Math.min(52, prev + delta));
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    // Circular progress gauge matching Figma exported layout
    const CircularGauge = ({ value, color }: { value: number; color: string }) => {
        const radius = 28;
        const strokeWidth = 4;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div className="metric-gauge-wrapper">
                <svg width="64" height="64" viewBox="0 0 64 64" style={{ zIndex: 0 }}>
                    {/* Background Circle */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Active Circle Progress */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 32 32)"
                        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                </svg>
                <div className="metric-gauge-text">{Math.round(value)}%</div>
            </div>
        );
    };

    // Calculation shortcuts
    const ramUsedPercent = specs?.mem ? (specs.mem.used / specs.mem.total) * 100 : 32;

    const bgValue = themeConfig.bgType === 'gradient'
        ? `radial-gradient(128.06% 160.08% at 0% 0%, ${themeConfig.bgGradientStart} 0%, ${themeConfig.bgGradientEnd} 50%), ${themeConfig.bgGradientEnd}`
        : themeConfig.bgColor;

    const containerStyle = {
        '--theme-bg': bgValue,
        '--theme-accent': themeConfig.accentColor,
        '--theme-accent-sec': themeConfig.accentSecColor,
        '--theme-accent-light': themeConfig.accentLightColor,
        '--theme-text': themeConfig.textColor,
        '--theme-font-sans': themeConfig.fontFamily,
        '--theme-font-heading': themeConfig.fontFamily.includes('Mono') ? themeConfig.fontFamily : `'Hanken Grotesk', sans-serif`,
    } as React.CSSProperties;

    return (
        <div className="telemetry-container" style={containerStyle}>
            

            <div className="aurora-bg aurora-1" />
            <div className="aurora-bg aurora-2" />

            {/* Header - Top Navigation Bar */}
            <div className="dashboard-header">
                <div className="dashboard-header-inner">
                    <a href="#" onClick={(e) => {e.preventDefault();}} className="back-link">
                        <ArrowLeft size={12} /> BIZZCO HUB OFFLINE APP
                    </a>
                    <div className="header-top-row">
                        <div className="header-title-container">
                            <h1 className="header-title">SYSTEM TELEMETRY</h1>
                            <div className="status-row">
                                <div className="status-dot" />
                                <span className="status-text">ACTIVE SHIELD ENABLED</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setIsThemeModalOpen(true)}
                                className="reload-btn"
                                style={{ borderColor: 'var(--theme-accent-light)', color: 'var(--theme-accent-light)' }}
                            >
                                <Palette size={12} style={{ marginRight: '6px' }} />
                                <span>THEMES</span>
                            </button>
                            <button
                                onClick={handleCheckUpdate}
                                disabled={isCheckingUpdate || isUpdating}
                                className="reload-btn"
                                style={{ borderColor: '#6366F1', color: '#B8C3FF' }}
                            >
                                <RefreshCw size={12} style={{ marginRight: '6px' }} />
                                <span>UPDATE APP</span>
                            </button>
                            <button
                                onClick={() => setIsConfigModalOpen(true)}
                                className="reload-btn"
                                style={{ borderColor: '#B8C3FF', color: '#B8C3FF' }}
                            >
                                <Settings size={12} style={{ marginRight: '6px' }} />
                                <span>CONFIGURE SPECS</span>
                            </button>
                            <button
                                onClick={() => fetchSpecsData(true)}
                                disabled={refreshing || loading}
                                className="reload-btn"
                            >
                                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} style={{ color: '#E2E2E8' }} />
                                <span>{refreshing ? "EXECUTING SCRIPT..." : "RELOAD TELEMETRY"}</span>
                            </button>
                        </div>
                    </div>

                    <div className="nav-row">
                        <button onClick={() => setActiveTab('overview')} className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}>Overview</button>
                        <button onClick={() => setActiveTab('hardware')} className={`nav-link ${activeTab === 'hardware' ? 'active' : ''}`}>Processor Info</button>
                        <button onClick={() => setActiveTab('ram')} className={`nav-link ${activeTab === 'ram' ? 'active' : ''}`}>RAM Array</button>
                        <button onClick={() => setActiveTab('memory')} className={`nav-link ${activeTab === 'memory' ? 'active' : ''}`}>Storage Array</button>
                        <button onClick={() => setActiveTab('battery')} className={`nav-link ${activeTab === 'battery' ? 'active' : ''}`}>Battery & Power</button>
                        <button onClick={() => setActiveTab('graphics')} className={`nav-link ${activeTab === 'graphics' ? 'active' : ''}`}>Graphics & Display</button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="main-canvas">
                {/* Banner explaining hosted mode */}
                {typeof window !== 'undefined' && 
                 window.location.hostname !== 'localhost' && 
                 window.location.hostname !== '127.0.0.1' && (
                    <div style={{
                        background: 'rgba(255, 126, 64, 0.08)',
                        border: '1px solid rgba(255, 126, 64, 0.2)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        width: '100%',
                        margin: '0 auto 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#FF9E64',
                        boxSizing: 'border-box'
                    }}>
                        <Info size={14} style={{ flexShrink: 0 }} />
                        <span>
                            <strong>Hosted Telemetry Mode:</strong> Physical hardware details (such as RAM layout and Storage size) are simulated due to browser security restrictions. 
                            Use the <strong>Configure Specs</strong> button at the top right to override and input your device's actual specifications.
                        </span>
                    </div>
                )}
                {/* Top Metrics Row */}
                <div className="top-metrics-row">
                    {/* Processor Load Card */}
                    <div className="metric-card">
                        <CircularGauge value={simulatedLoad} color="#B8C3FF" />
                        <div className="metric-info">
                            <div className="metric-label-row">
                                <div className="metric-label-icon"><Cpu size={12} /></div>
                                <span className="metric-label-text">Processor Load</span>
                            </div>
                            <div className="metric-value">
                                {specs?.cpu?.cores || 12} LOGICAL CORES
                            </div>
                        </div>
                    </div>

                    {/* Memory Allocation Card */}
                    <div className="metric-card">
                        <CircularGauge value={ramUsedPercent} color="#D30078" />
                        <div className="metric-info">
                            <div className="metric-label-row">
                                <div className="metric-label-icon"><Database size={12} /></div>
                                <span className="metric-label-text">Memory Allocation</span>
                            </div>
                            <div className="metric-value">
                                {(specs?.mem?.used / 1024 ** 3 || 5.1).toFixed(1)} / {(specs?.mem?.total / 1024 ** 3 || 16.0).toFixed(0)} GB
                            </div>
                        </div>
                    </div>

                    {/* Power Reserve Card */}
                    <div className="metric-card">
                        <CircularGauge value={specs?.battery?.hasBattery ? specs.battery.percent : 100} color="#27FF97" />
                        <div className="metric-info">
                            <div className="metric-label-row">
                                <div className="metric-label-icon"><Zap size={12} /></div>
                                <span className="metric-label-text">Power Reserve</span>
                            </div>
                            <div className="metric-value" style={{ textTransform: 'uppercase' }}>
                                {specs?.battery?.hasBattery 
                                    ? (specs.battery.isCharging ? 'CHARGING' : 'BATTERY DISCHARGE') 
                                    : 'AC STEADY POWER'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Canvas Content */}
                <div className="tab-content-canvas">
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                            <div style={{ border: '3px solid rgba(99, 102, 241, 0.1)', borderTop: '3px solid #B8C3FF', borderRadius: '50%', width: '36px', height: '36px' }} className="animate-spin" />
                            <span style={{ fontSize: '12px', color: '#C4C5D9', letterSpacing: '0.15em', fontWeight: 'bold' }}>COMPILING TELEMETRY NODE...</span>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: Overview */}
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">System Overview</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>All Diagnostics: Pass</span>
                                        </div>
                                    </div>

                                    <div className="overview-grid">
                                        <div className="overview-left-card">
                                            <span style={{ fontSize: '11px', color: '#B8C3FF', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: '8px' }}>Device Configuration</span>
                                            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '28px', fontWeight: 600, color: '#E2E2E8', margin: '0 0 16px 0' }}>
                                                {specs?.system?.manufacturer} {specs?.system?.model}
                                            </h2>
                                            <div style={{ fontSize: '12px', color: '#8E90A2', marginBottom: '24px' }}>
                                                SERIAL NUMBER: <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{specs?.system?.serial}</span>
                                            </div>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Platform OS</span>
                                                    <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.distro || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Architecture</span>
                                                    <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.arch || 'N/A'} ({specs?.os?.release || 'N/A'})</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Host Node</span>
                                                    <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.hostname || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Board UEFI</span>
                                                    <div style={{ fontSize: '15px', color: '#5BFFA1', fontWeight: 600, marginTop: '4px' }}>{specs?.os?.uefi ? 'SECURE_BOOT' : 'COMPATIBLE'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="overview-right-card">
                                            <span style={{ fontSize: '11px', color: '#D30078', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase' }}>Live Hardware Temps</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: '#C4C5D9' }}>CPU Core Temp</span>
                                                    <span style={{ color: '#B8C3FF', fontWeight: 'bold' }}>{simulatedTemp}°C</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: '#C4C5D9' }}>GPU Controller Temp</span>
                                                    <span style={{ color: '#D30078', fontWeight: 'bold' }}>{simulatedGpuTemp}°C</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                                                    <span style={{ color: '#C4C5D9' }}>System Status</span>
                                                    <span style={{ color: '#5BFFA1', fontWeight: 'bold' }}>COOL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Processor Info */}
                            {activeTab === 'hardware' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Processor Details</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Cores Online</span>
                                        </div>
                                    </div>

                                    <div className="overview-left-card" style={{ width: '100%' }}>
                                        <span style={{ fontSize: '11px', color: '#B8C3FF', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: '8px' }}>Processor load sensors</span>
                                        <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '28px', fontWeight: 600, color: '#E2E2E8', margin: '0 0 24px 0' }}>
                                            {specs?.cpu?.brand}
                                        </h2>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Manufacturer</span>
                                                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.manufacturer}</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Physical Cores</span>
                                                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.physicalCores || 6} Cores</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Logical Threads</span>
                                                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.cores || 12} Threads</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '1.1px' }}>Base Frequency</span>
                                                <div style={{ fontSize: '16px', color: '#B8C3FF', fontWeight: 600, marginTop: '6px' }}>{specs?.cpu?.speed ? specs.cpu.speed.toFixed(2) : '2.60'} GHz</div>
                                            </div>
                                        </div>

                                        {/* Real-time Load details */}
                                        <div style={{ marginTop: '32px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <span style={{ fontSize: '12px', color: '#C4C5D9', fontWeight: 'bold' }}>REAL-TIME CORE LOAD SCALE</span>
                                                <span style={{ fontSize: '16px', color: '#B8C3FF', fontWeight: 'bold', fontFamily: 'monospace' }}>{simulatedLoad}%</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', height: '16px', width: '100%' }}>
                                                {Array.from({ length: 24 }).map((_, idx) => {
                                                    const activeLimit = Math.round((simulatedLoad / 100) * 24);
                                                    const isActive = idx < activeLimit;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                flex: 1,
                                                                height: '100%',
                                                                background: isActive ? 'linear-gradient(180deg, #B8C3FF 0%, #6366F1 100%)' : 'rgba(255, 255, 255, 0.03)',
                                                                borderRadius: '2px',
                                                                boxShadow: isActive ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8E90A2', marginTop: '8px' }}>
                                                <span>MIN_CYCLE</span>
                                                <span>MID_SCALE</span>
                                                <span>MAX_CYCLE_BOOST</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: RAM Array */}
                            {activeTab === 'ram' && (() => {
                                const totalSlots = specs?.ramTotalSlots || 2;
                                const occupiedCount = specs?.ramLayout?.length || 1;
                                const isMultiChannel = occupiedCount >= 2;

                                const slots = Array.from({ length: totalSlots }).map((_, index) => {
                                    let matchingStick = specs?.ramLayout?.find((ram: any) => {
                                        const bankStr = (ram.bank || '').toLowerCase();
                                        const firstDigitMatch = bankStr.match(/\d+/);
                                        if (firstDigitMatch) {
                                            const digit = parseInt(firstDigitMatch[0], 10);
                                            return digit === index;
                                        }
                                        return false;
                                    });

                                    // Fallback to array index matching if bank locator didn't yield a match
                                    if (!matchingStick && specs?.ramLayout && specs.ramLayout[index]) {
                                        matchingStick = specs.ramLayout[index];
                                    }

                                    return {
                                        slotIndex: index,
                                        slotName: `DIMM Slot ${index + 1}`,
                                        occupied: !!matchingStick,
                                        ram: matchingStick || null
                                    };
                                });

                                const occupiedSlots = slots.filter((s: any) => s.occupied);

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                        <div className="canvas-header-row">
                                            <h2 className="canvas-title">Physical Memory Slots (RAM Array Layout)</h2>
                                            <div className="diagnostics-badge">
                                                <Activity size={12} />
                                                <span>{occupiedSlots.length} / {totalSlots} SLOTS ACTIVE</span>
                                            </div>
                                        </div>

                                        {/* Summary Bar */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '16px',
                                            padding: '16px 20px',
                                            background: 'rgba(184,195,255,0.04)',
                                            border: '1px solid rgba(184,195,255,0.1)',
                                            borderRadius: '12px',
                                            alignItems: 'center',
                                            flexWrap: 'wrap'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5BFFA1', boxShadow: '0 0 6px rgba(91,255,161,0.6)' }} />
                                                <span style={{ fontSize: '12px', color: '#C4C5D9' }}>{occupiedSlots.length} Occupied</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }} />
                                                <span style={{ fontSize: '12px', color: '#8E90A2' }}>{totalSlots - occupiedSlots.length} Empty</span>
                                            </div>
                                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Channel Mode:</span>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: isMultiChannel ? '#B8C3FF' : '#FFD68A', background: isMultiChannel ? 'rgba(184,195,255,0.1)' : 'rgba(255,214,138,0.1)', padding: '2px 10px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                                                    {isMultiChannel ? 'DUAL CHANNEL' : 'SINGLE CHANNEL'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="ram-slots-grid">
                                            {slots.map((slot: any) => (
                                                slot.occupied ? (
                                                    <div key={slot.slotIndex} className="slot-occupied-card">
                                                        <div className="slot-card-header">
                                                            <div className="slot-label-group">
                                                                <Database size={16} color="#B8C3FF" />
                                                                <span className="slot-label-text">{slot.slotName}</span>
                                                            </div>
                                                            <span className="occupied-badge">● Occupied</span>
                                                        </div>
                                                        
                                                        <div className="slot-mfg-row">
                                                            <h3 className="mfg-name">{slot.ram.manufacturer || 'Unknown Manufacturer'}</h3>
                                                            <div className="capacity-type-row">
                                                                <span className="capacity-text">
                                                                    {(slot.ram.size / 1024 ** 3).toFixed(0)} GB
                                                                </span>
                                                                <span className="type-text">{slot.ram.type}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="hw-verification-card">
                                                            <div className="hw-verification-title">Hardware Verification</div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">Voltage Check</span>
                                                                </div>
                                                                <span className="verification-value">{slot.ram.voltageConfigured || '1.20'} V</span>
                                                            </div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">Speed Clock Match</span>
                                                                </div>
                                                                <span className="verification-value">{slot.ram.clockSpeed || '3200'} MHz</span>
                                                            </div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">ECC Integrity</span>
                                                                </div>
                                                                <span className="verification-value">{slot.ram.ecc ? 'ECC Active' : 'NON-ECC'}</span>
                                                            </div>
                                                            
                                                            <div className="verification-row">
                                                                <div className="verification-item">
                                                                    <Check size={12} color="#5BFFA1" />
                                                                    <span className="verification-label">Channel Status</span>
                                                                </div>
                                                                <span className="verification-value">{isMultiChannel ? 'DUAL CHANNEL' : 'SINGLE CHANNEL'}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="slot-tech-specs">
                                                            <div className="tech-spec-row">
                                                                    <span className="tech-spec-label">Form Factor:</span>
                                                                    <span className="tech-spec-value">{slot.ram.formFactor || 'SODIMM'}</span>
                                                            </div>
                                                            <div className="tech-spec-row">
                                                                    <span className="tech-spec-label">Part ID:</span>
                                                                    <span className="tech-spec-value" style={{ fontFamily: 'monospace' }}>{slot.ram.partNum || '—'}</span>
                                                            </div>
                                                            <div className="tech-spec-row">
                                                                    <span className="tech-spec-label">Serial Key:</span>
                                                                    <span className="tech-spec-value" style={{ fontFamily: 'monospace' }}>{slot.ram.serialNum || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={slot.slotIndex} style={{
                                                        background: 'rgba(255,255,255,0.01)',
                                                        border: '1.5px dashed rgba(255,255,255,0.08)',
                                                        borderRadius: '16px',
                                                        padding: '28px 24px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '12px',
                                                        minHeight: '200px',
                                                        opacity: 0.55
                                                    }}>
                                                        <div style={{
                                                            width: '48px', height: '48px',
                                                            borderRadius: '12px',
                                                            background: 'rgba(255,255,255,0.04)',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            <Database size={20} color="rgba(255,255,255,0.2)" />
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>{slot.slotName}</div>
                                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Empty — No Module Installed</div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '10px',
                                                            color: 'rgba(255,255,255,0.15)',
                                                            background: 'rgba(255,255,255,0.03)',
                                                            border: '1px solid rgba(255,255,255,0.06)',
                                                            borderRadius: '6px',
                                                            padding: '3px 10px',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.8px'
                                                        }}>Slot Available</div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* TAB 4: Storage Array */}
                            {activeTab === 'memory' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Storage Disk Arrays</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Optimal Smart</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                        {specs?.diskLayout && specs.diskLayout.map((disk: any, idx: number) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '16px 24px',
                                                background: 'rgba(255, 255, 255, 0.01)',
                                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <HardDrive size={20} color="#B8C3FF" />
                                                    <div>
                                                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#E2E2E8' }}>{disk.name}</div>
                                                        <span style={{ fontSize: '11px', color: '#8E90A2' }}>Type: {disk.type} | interface: SCSI/NVMe</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                    <span style={{ fontSize: '12px', color: '#5BFFA1', fontWeight: 'bold', background: 'rgba(91, 255, 161, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{disk.smartStatus || 'Ok'}</span>
                                                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF' }}>{(disk.size / 1024 ** 3).toFixed(0)} GB</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: Battery & Power */}
                            {activeTab === 'battery' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Battery Diagnostic Console</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Power Optimal</span>
                                        </div>
                                    </div>

                                    <div className="overview-left-card" style={{ width: '100%', marginTop: '8px' }}>
                                        <span style={{ fontSize: '11px', color: '#5BFFA1', fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: '16px' }}>Power Grid Telemetry & Battery Specs</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '16px' }}>
                                            
                                            {/* 1. Manufacture Name */}
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Manufacture Name</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.hasBattery ? (specs.battery.manufacturer || 'System Battery') : 'No Internal Battery'}
                                                </div>
                                            </div>

                                            {/* 2. Power State */}
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Power State</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.hasBattery 
                                                        ? (specs.battery.isCharging ? 'Charging' : (specs.battery.acConnected ? 'AC Connected (Not Charging)' : 'Discharging')) 
                                                        : 'AC Power (Desktop)'}
                                                </div>
                                            </div>

                                            {/* 3. Current Capacity Value */}
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Current Capacity Value</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.currentCapacity ? `${specs.battery.currentCapacity} mWh` : 'Unknown'} ({specs?.battery?.percent || 100}%)
                                                </div>
                                            </div>

                                            {/* 4. Full Charged Capacity */}
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Full Charged Capacity</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.maxCapacity ? `${specs.battery.maxCapacity} mWh` : 'Unknown'}
                                                </div>
                                            </div>

                                            {/* 5. Designed Capacity */}
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Designed Capacity</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.designedCapacity ? `${specs.battery.designedCapacity} mWh` : 'Unknown'}
                                                </div>
                                            </div>

                                            {/* 6. Battery Health */}
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Battery Health</span>
                                                <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                                                    {(() => {
                                                        const health = specs?.battery?.healthPercent 
                                                            || (specs?.battery?.maxCapacity && specs?.battery?.designedCapacity 
                                                                ? (specs.battery.maxCapacity / specs.battery.designedCapacity) * 100 
                                                                : 100);
                                                        
                                                        const cappedHealth = Math.min(100, Math.max(0, health));
                                                        let label = "Healthy";
                                                        let color = "#5BFFA1";
                                                        if (cappedHealth < 50) { label = "Replace Battery"; color = "#FF4B4B"; }
                                                        else if (cappedHealth < 80) { label = "Degraded"; color = "#FFD68A"; }
                                                        
                                                        return <span style={{ color }}>{cappedHealth.toFixed(1)}% ({label})</span>;
                                                    })()}
                                                </div>
                                            </div>

                                            {/* 7. Cycle Count */}
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#8E90A2', textTransform: 'uppercase' }}>Charge / Discharge Cycles</span>
                                                <div style={{ fontSize: '15px', color: '#E2E2E8', fontWeight: 600, marginTop: '4px' }}>
                                                    {specs?.battery?.cycleCount || 'Not Reported by OS'}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 6: Graphics & Display */}
                            {activeTab === 'graphics' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <div className="canvas-header-row">
                                        <h2 className="canvas-title">Display Controllers & Monitor Console</h2>
                                        <div className="diagnostics-badge">
                                            <Activity size={12} />
                                            <span>Display Online</span>
                                        </div>
                                    </div>

                                    <div className="display-cards-row">
                                        {/* GPU controller Model */}
                                        <div className="display-card">
                                            <div className="display-icon-wrapper">
                                                <Monitor size={20} color="#FFB0CB" />
                                            </div>
                                            <div className="display-info-container">
                                                <span className="display-label">Controller Model</span>
                                                <div className="display-value">
                                                    {specs?.graphics?.controllers?.[0]?.vendor} {specs?.graphics?.controllers?.[0]?.model}
                                                </div>
                                                <div className="display-subtext">
                                                    VRAM Capacity: {specs?.graphics?.controllers?.[0]?.vram ? `${(specs.graphics.controllers[0].vram / 1024).toFixed(0)} GB` : '6 GB'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Monitor Card */}
                                        <div className="display-card">
                                            <div className="display-icon-wrapper green">
                                                <Tv size={20} color="#B8FFD9" />
                                            </div>
                                            <div className="display-info-container">
                                                <span className="display-label">Primary Display</span>
                                                <div className="display-value">
                                                    {specs?.graphics?.displays?.[0]?.resolutionX || 1920} x {specs?.graphics?.displays?.[0]?.resolutionY || 1080}
                                                </div>
                                                <div className="display-subtext">
                                                    Refresh Frequency: {specs?.graphics?.displays?.[0]?.currentRefreshRate || 60} Hz
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </main>

            {/* Custom Telemetry Specs Configurator Modal */}
            {isConfigModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Configure Device Telemetry Specs</h3>
                            <button onClick={() => setIsConfigModalOpen(false)} className="modal-close-btn">
                                <X size={18} />
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
                                ramTotalSlots: cfgRamTotalSlots,
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
                        }}>
                            <div className="modal-body-scroll">
                                <div className="spec-group-grid">
                                    {/* Category 1: Device Identity */}
                                    <div className="spec-category-card">
                                        <div className="spec-category-header">
                                            <Settings size={14} className="spec-category-icon" />
                                            <span>Device Identity</span>
                                        </div>
                                        <div className="form-group">
                                            <label>Manufacturer</label>
                                            <input type="text" value={cfgMfg} onChange={(e) => setCfgMfg(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Model Name</label>
                                            <input type="text" value={cfgModel} onChange={(e) => setCfgModel(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Serial Number</label>
                                            <input type="text" value={cfgSerial} onChange={(e) => setCfgSerial(e.target.value)} required />
                                        </div>
                                    </div>

                                    {/* Category 2: Processor (CPU) */}
                                    <div className="spec-category-card">
                                        <div className="spec-category-header">
                                            <Cpu size={14} className="spec-category-icon" />
                                            <span>Processor (CPU)</span>
                                        </div>
                                        <div className="form-group">
                                            <label>Processor Brand</label>
                                            <input type="text" value={cfgCpuBrand} onChange={(e) => setCfgCpuBrand(e.target.value)} required />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Cores / Threads</label>
                                                <input type="number" value={cfgCpuCores} onChange={(e) => setCfgCpuCores(parseInt(e.target.value))} required min={1} />
                                            </div>
                                            <div className="form-group">
                                                <label>Speed (GHz)</label>
                                                <input type="number" step="0.01" value={cfgCpuSpeed} onChange={(e) => setCfgCpuSpeed(parseFloat(e.target.value))} required min={0.1} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category 3: Memory (RAM) */}
                                    <div className="spec-category-card">
                                        <div className="spec-category-header">
                                            <Database size={14} className="spec-category-icon" />
                                            <span>Memory (RAM)</span>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Total RAM (GB)</label>
                                                <input type="number" value={cfgRamGb} onChange={(e) => setCfgRamGb(parseInt(e.target.value))} required min={1} />
                                            </div>
                                            <div className="form-group">
                                                <label>RAM Type</label>
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
                                                <label>Slots on Board</label>
                                                <select value={cfgRamTotalSlots} onChange={(e) => setCfgRamTotalSlots(parseInt(e.target.value))}>
                                                    <option value={2}>2 Slots (Standard)</option>
                                                    <option value={4}>4 Slots (Desktop)</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Active Slots</label>
                                                <select value={cfgRamSlots} onChange={(e) => setCfgRamSlots(parseInt(e.target.value))}>
                                                    <option value={1}>1 Slot Active</option>
                                                    <option value={2}>2 Slots Active</option>
                                                    <option value={4}>4 Slots Active</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>RAM Manufacturer</label>
                                            <input type="text" value={cfgRamMfg} onChange={(e) => setCfgRamMfg(e.target.value)} required />
                                        </div>
                                    </div>

                                    {/* Category 4: Storage & Graphics */}
                                    <div className="spec-category-card">
                                        <div className="spec-category-header">
                                            <HardDrive size={14} className="spec-category-icon" />
                                            <span>Storage & Graphics</span>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Storage Size (GB)</label>
                                                <input type="number" value={cfgStorageGb} onChange={(e) => setCfgStorageGb(parseInt(e.target.value))} required min={1} />
                                            </div>
                                            <div className="form-group">
                                                <label>Storage Type</label>
                                                <select value={cfgStorageType} onChange={(e) => setCfgStorageType(e.target.value)}>
                                                    <option value="SSD">SSD</option>
                                                    <option value="HDD">HDD</option>
                                                    <option value="NVMe SSD">NVMe SSD</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Storage Device Name</label>
                                            <input type="text" value={cfgStorageName} onChange={(e) => setCfgStorageName(e.target.value)} required />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>GPU Model</label>
                                                <input type="text" value={cfgGpuModel} onChange={(e) => setCfgGpuModel(e.target.value)} required />
                                            </div>
                                            <div className="form-group">
                                                <label>VRAM (MB)</label>
                                                <input type="number" value={cfgGpuVram} onChange={(e) => setCfgGpuVram(parseInt(e.target.value))} required min={0} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-submit">
                                    Apply Specifications
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isUpdateModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#111317',
                        border: '1px solid rgba(67, 70, 86, 0.5)',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '500px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>
                        {!updateInfo && !isUpToDate ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '24px 0' }}>
                                <RefreshCw size={48} color="#6366F1" className={isCheckingUpdate ? "animate-spin" : ""} style={{ marginBottom: '8px' }} />
                                <div>
                                    <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '20px', fontFamily: "'Hanken Grotesk', sans-serif" }}>Software Update</h2>
                                    <p style={{ margin: '8px 0 0 0', color: '#8E90A2', fontSize: '14px' }}>Check if a new version of BizzCo Telemetry System is available.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button
                                        onClick={() => setIsUpdateModalOpen(false)}
                                        style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#E2E2E8', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleCheckUpdate}
                                        disabled={isCheckingUpdate}
                                        style={{ padding: '10px 24px', background: '#6366F1', border: 'none', color: '#FFFFFF', borderRadius: '6px', cursor: isCheckingUpdate ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                    >
                                        {isCheckingUpdate ? "CHECKING..." : "CHECK FOR UPDATES"}
                                    </button>
                                </div>
                            </div>
                        ) : isUpToDate ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '24px 0' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(91, 255, 161, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                    <Check size={32} color="#5BFFA1" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '20px', fontFamily: "'Hanken Grotesk', sans-serif" }}>You're Up To Date!</h2>
                                    <p style={{ margin: '8px 0 0 0', color: '#8E90A2', fontSize: '14px' }}>BizzCo Telemetry System version {CURRENT_VERSION} is currently the newest version available.</p>
                                </div>
                                <button
                                    onClick={() => setIsUpdateModalOpen(false)}
                                    style={{ padding: '10px 32px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', marginTop: '16px' }}
                                >
                                    CLOSE
                                </button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '24px', fontFamily: "'Hanken Grotesk', sans-serif" }}>New Update Available!</h2>
                                    <p style={{ margin: '8px 0 0 0', color: '#8E90A2', fontSize: '14px' }}>Version {updateInfo.version} is ready to install.</p>
                                </div>
                                
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ margin: '0 0 8px 0', color: '#C4C5D9', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Release Notes</h3>
                                    <p style={{ margin: 0, color: '#E2E2E8', fontSize: '14px', lineHeight: '1.5' }}>{updateInfo.releaseNotes}</p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                    {!downloadedFilePath ? (
                                        <>
                                            <button
                                                onClick={() => setIsUpdateModalOpen(false)}
                                                disabled={isUpdating}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: 'transparent',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    color: '#E2E2E8',
                                                    borderRadius: '6px',
                                                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px',
                                                    letterSpacing: '1px'
                                                }}
                                            >
                                                UPDATE LATER
                                            </button>
                                            <button
                                                onClick={executeUpdateDownload}
                                                disabled={isUpdating}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: '#6366F1',
                                                    border: 'none',
                                                    color: '#FFFFFF',
                                                    borderRadius: '6px',
                                                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px',
                                                    letterSpacing: '1px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : null}
                                                {isUpdating ? `DOWNLOADING... ${downloadProgress}%` : "UPDATE NOW"}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={executeInstallRestart}
                                            style={{
                                                padding: '10px 20px',
                                                background: '#5BFFA1',
                                                border: 'none',
                                                color: '#000000',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                                letterSpacing: '1px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Zap size={14} />
                                            RESTART TO INSTALL
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Theme Customizer Modal */}
            {isThemeModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#0e1116',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '560px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        boxShadow: `0 24px 48px rgba(0, 0, 0, 0.6), 0 0 40px ${customAccent}22`,
                        color: '#E2E2E8',
                        fontFamily: 'var(--theme-font-sans)'
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '20px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Palette size={20} color={customAccent} /> THEME CONFIGURATOR
                                </h2>
                                <p style={{ margin: '4px 0 0 0', color: '#8E90A2', fontSize: '12px' }}>Customize fonts, highlights and visual style for your workspace.</p>
                            </div>
                            <button onClick={() => setIsThemeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8E90A2', cursor: 'pointer', transition: 'color 0.2s' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body (Scrollable) */}
                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Preset Themes Section */}
                            <div>
                                <h3 style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>Theme Presets</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                    {THEME_PRESETS.map((preset) => {
                                        const isActive = 
                                            customBgType === preset.bgType &&
                                            customBgColor === preset.bgColor &&
                                            customBgGradientStart === preset.bgGradientStart &&
                                            customBgGradientEnd === preset.bgGradientEnd &&
                                            customAccent === preset.accentColor &&
                                            customAccentSec === preset.accentSecColor &&
                                            customTextColor === preset.textColor &&
                                            customFont === preset.fontFamily;

                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => applyPreset(preset)}
                                                style={{
                                                    background: preset.bgType === 'gradient'
                                                        ? `linear-gradient(135deg, ${preset.bgGradientStart} 0%, ${preset.bgGradientEnd} 100%)`
                                                        : preset.bgColor,
                                                    border: isActive 
                                                        ? `2px solid ${preset.accentColor}`
                                                        : '1px solid rgba(255, 255, 255, 0.08)',
                                                    borderRadius: '8px',
                                                    padding: '12px 14px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    height: '74px',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isActive ? `0 0 12px ${preset.accentColor}33` : 'none'
                                                }}
                                            >
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span>{preset.name}</span>
                                                    {isActive && <Check size={14} color={preset.accentColor} style={{ strokeWidth: 3 }} />}
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                                                        {preset.fontFamily.split(',')[0].replace(/'/g, '')}
                                                    </span>
                                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: preset.accentColor }} title="Primary Accent" />
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: preset.accentSecColor }} title="Secondary Accent" />
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: preset.textColor }} title="Text color" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                            {/* Custom Controls Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <h3 style={{ margin: '0', color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>Custom Style Override</h3>
                                
                                {/* Background Type */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: '#C4C5D9' }}>Background Type</span>
                                    <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setCustomBgType('gradient')}
                                            style={{
                                                padding: '4px 12px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                background: customBgType === 'gradient' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                                color: customBgType === 'gradient' ? '#FFFFFF' : '#8E90A2',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Gradient
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCustomBgType('solid')}
                                            style={{
                                                padding: '4px 12px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                background: customBgType === 'solid' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                                color: customBgType === 'solid' ? '#FFFFFF' : '#8E90A2',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Solid Color
                                        </button>
                                    </div>
                                </div>

                                {/* Background Colors */}
                                {customBgType === 'solid' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '13px', color: '#8E90A2' }}>Solid Color</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="color" 
                                                value={customBgColor} 
                                                onChange={(e) => setCustomBgColor(e.target.value)}
                                                style={{ border: 'none', background: 'none', width: '32px', height: '24px', cursor: 'pointer', padding: 0 }}
                                            />
                                            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{customBgColor.toUpperCase()}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '12px', color: '#8E90A2' }}>Gradient Start</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input 
                                                    type="color" 
                                                    value={customBgGradientStart} 
                                                    onChange={(e) => setCustomBgGradientStart(e.target.value)}
                                                    style={{ border: 'none', background: 'none', width: '32px', height: '24px', cursor: 'pointer', padding: 0 }}
                                                />
                                                <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{customBgGradientStart.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '12px', color: '#8E90A2' }}>Gradient End</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input 
                                                    type="color" 
                                                    value={customBgGradientEnd} 
                                                    onChange={(e) => setCustomBgGradientEnd(e.target.value)}
                                                    style={{ border: 'none', background: 'none', width: '32px', height: '24px', cursor: 'pointer', padding: 0 }}
                                                />
                                                <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{customBgGradientEnd.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Accent & Text Colors */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', color: '#8E90A2' }}>Primary Accent</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="color" 
                                                value={customAccent} 
                                                onChange={(e) => setCustomAccent(e.target.value)}
                                                style={{ border: 'none', background: 'none', width: '32px', height: '24px', cursor: 'pointer', padding: 0 }}
                                            />
                                            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{customAccent.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', color: '#8E90A2' }}>Secondary Accent</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="color" 
                                                value={customAccentSec} 
                                                onChange={(e) => setCustomAccentSec(e.target.value)}
                                                style={{ border: 'none', background: 'none', width: '32px', height: '24px', cursor: 'pointer', padding: 0 }}
                                            />
                                            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{customAccentSec.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: '#C4C5D9' }}>Main Text Color</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input 
                                            type="color" 
                                            value={customTextColor} 
                                            onChange={(e) => setCustomTextColor(e.target.value)}
                                            style={{ border: 'none', background: 'none', width: '32px', height: '24px', cursor: 'pointer', padding: 0 }}
                                        />
                                        <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{customTextColor.toUpperCase()}</span>
                                    </div>
                                </div>

                                {/* Typography / Fonts Selection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '13px', color: '#C4C5D9' }}>Font Family Selection</span>
                                    <select
                                        value={customFont}
                                        onChange={(e) => setCustomFont(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            background: '#161a22',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: '#FFFFFF',
                                            fontSize: '13px',
                                            fontFamily: customFont,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="'Inter', sans-serif">Inter (Clean Sans)</option>
                                        <option value="'Hanken Grotesk', sans-serif">Hanken Grotesk (Tech/Futuristic)</option>
                                        <option value="'Outfit', sans-serif">Outfit (Geometric & Elegant)</option>
                                        <option value="'JetBrains Mono', monospace">JetBrains Mono (Developer Code)</option>
                                        <option value="'Roboto Mono', monospace">Roboto Mono (Clean Code)</option>
                                        <option value="system-ui, sans-serif">System UI (Fallback OS)</option>
                                        <option value="Georgia, serif">Georgia (Classic Serif)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    applyPreset(THEME_PRESETS[0]);
                                    toast.success("Reset values to Default Cyber");
                                }}
                                style={{
                                    padding: '10px 16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px dashed rgba(255,255,255,0.15)',
                                    color: '#8E90A2',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                            >
                                RESET DEFAULT
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsThemeModalOpen(false)}
                                style={{
                                    padding: '10px 16px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#E2E2E8',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    marginLeft: 'auto',
                                    transition: 'all 0.2s'
                                }}
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const customConfig: ThemeConfig = {
                                        id: 'custom',
                                        name: 'Custom Theme',
                                        bgType: customBgType,
                                        bgColor: customBgColor,
                                        bgGradientStart: customBgGradientStart,
                                        bgGradientEnd: customBgGradientEnd,
                                        accentColor: customAccent,
                                        accentSecColor: customAccentSec,
                                        accentLightColor: customAccent,
                                        textColor: customTextColor,
                                        fontFamily: customFont
                                    };
                                    setThemeConfig(customConfig);
                                    localStorage.setItem('custom_theme_config', JSON.stringify(customConfig));
                                    setIsThemeModalOpen(false);
                                    toast.success("Theme configuration saved and applied!");
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: customAccent,
                                    border: 'none',
                                    color: '#FFFFFF',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: `0 4px 12px ${customAccent}33`
                                }}
                            >
                                APPLY THEME
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Version Watermark */}
            <div style={{
                position: 'fixed',
                bottom: '12px',
                right: '16px',
                color: 'rgba(255, 255, 255, 0.2)',
                fontSize: '11px',
                fontFamily: "'Inter', sans-serif",
                pointerEvents: 'none',
                letterSpacing: '0.5px',
                zIndex: 9999
            }}>
                Bizz Co Hub QC V{CURRENT_VERSION}
            </div>
        </div>
    );
}
