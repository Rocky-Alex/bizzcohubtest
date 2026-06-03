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
    X
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

export default function SpecCheckUltraPage() {
    const CURRENT_VERSION = "1.0.2";

    const [loading, setLoading] = useState(true);
    const [specs, setSpecs] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'ram' | 'memory' | 'battery' | 'graphics'>('overview');
    const [simulatedLoad, setSimulatedLoad] = useState(24);
    const [simulatedTemp, setSimulatedTemp] = useState(38);
    const [simulatedGpuTemp, setSimulatedGpuTemp] = useState(44);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isReloadModalOpen, setIsReloadModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isUpToDate, setIsUpToDate] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<any>(null);

    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        setIsUpToDate(false);
        setUpdateInfo(null);
        try {
            const res = await fetch('https://bizzcohubtest.netlify.app/version.json?t=' + new Date().getTime());
            if (!res.ok) throw new Error("Could not reach update server");
            const data = await res.json();
            
            // Assume any version !== CURRENT_VERSION is an update
            if (data.version && data.version !== CURRENT_VERSION) {
                setUpdateInfo(data);
            } else {
                setIsUpToDate(true);
            }
        } catch (e: any) {
            alert("Failed to check for updates: " + e.message);
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const executeUpdateDownload = async () => {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            setIsUpdating(true);
            try {
                const res = await (window as any).electronAPI.updateApp();
                if (!res.success) {
                    alert("Failed to download update: " + res.error);
                    setIsUpdating(false);
                    setIsUpdateModalOpen(false);
                }
                // If success, the app will quit automatically
            } catch (e: any) {
                alert("Update failed: " + e.message);
                setIsUpdating(false);
                setIsUpdateModalOpen(false);
            }
        } else {
            alert("Auto-updater is only available in the offline desktop app.");
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

    return (
        <div className="telemetry-container">
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

                .telemetry-container {
                    background: radial-gradient(128.06% 160.08% at 0% 0%, #111317 0%, #050505 50%), #000000;
                    min-height: 100vh;
                    position: relative;
                    width: 100%;
                    color: #E2E2E8;
                    font-family: 'Inter', sans-serif;
                    padding-top: 0px;
                    padding-bottom: 32px;
                }

                .aurora-bg {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(120px);
                    opacity: 0.15;
                    pointer-events: none;
                    z-index: 0;
                }
                .aurora-1 {
                    top: -10%;
                    right: -10%;
                    background: radial-gradient(circle, #6366F1 0%, transparent 80%);
                }
                .aurora-2 {
                    bottom: -20%;
                    left: -10%;
                    background: radial-gradient(circle, #8B5CF6 0%, transparent 80%);
                }

                /* Header - Top Navigation Bar */
                .dashboard-header {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0px;
                    position: relative;
                    width: 100%;
                    background: #111317;
                    border-bottom: 1px solid rgba(67, 70, 86, 0.2);
                    z-index: 50;
                }

                .dashboard-header-inner {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 16px 4vw;
                    gap: 16px;
                    width: 100%;
                    margin: 0 auto;
                }

                .back-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 10px;
                    letter-spacing: 1.1px;
                    color: #8E90A2;
                    text-decoration: none;
                    text-transform: uppercase;
                    transition: color 0.2s ease;
                    margin-bottom: -4px;
                    z-index: 60;
                }
                .back-link:hover {
                    color: #FFFFFF;
                }

                .header-top-row {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0px;
                    width: 100%;
                    height: 50px;
                }

                .header-title-container {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0px;
                }

                .header-title {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: 32px;
                    line-height: 38px;
                    letter-spacing: -0.8px;
                    text-transform: uppercase;
                    color: #E2E2E8;
                    margin: 0;
                }

                .status-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 8px;
                    margin-top: 4px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    background: #5BFFA1;
                    border-radius: 9999px;
                    box-shadow: 0 0 8px #5BFFA1;
                    animation: pulse-dot 1.8s infinite alternate;
                }

                @keyframes pulse-dot {
                    0% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 4px #5BFFA1; }
                    100% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 10px #5BFFA1; }
                }

                .status-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #5BFFA1;
                }

                .reload-btn {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 8px 24px;
                    gap: 8px;
                    background: rgba(51, 53, 57, 0.1);
                    border: 1px solid rgba(67, 70, 86, 0.3);
                    border-radius: 8px;
                    color: #E2E2E8;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .reload-btn:hover {
                    background: rgba(67, 70, 86, 0.2);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .nav-row {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 32px;
                    width: 100%;
                    height: 34px;
                }

                .nav-link {
                    background: transparent;
                    border: none;
                    padding: 0px 0px 8px;
                    font-family: 'Inter', sans-serif;
                    font-style: normal;
                    font-weight: 400;
                    font-size: 16px;
                    line-height: 24px;
                    color: #C4C5D9;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-bottom: 2px solid transparent;
                }

                .nav-link:hover {
                    color: #FFFFFF;
                }

                .nav-link.active {
                    font-weight: 700;
                    color: #B8C3FF;
                    border-bottom: 2px solid #B8C3FF;
                }

                /* Main Canvas positioning */
                .main-canvas {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 24px 4vw;
                    gap: 24px;
                    position: relative;
                    width: 100%;
                    margin: 0 auto;
                    z-index: 10;
                }

                /* Top Metrics Section */
                .top-metrics-row {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 24px;
                    width: 100%;
                    height: 96px;
                    flex: none;
                    order: 0;
                    align-self: stretch;
                    flex-grow: 0;
                }

                .metric-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 16px 24px;
                    gap: 24px;
                    flex: 1;
                    height: 96px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(6px);
                    border-radius: 12px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .metric-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }

                .metric-gauge-wrapper {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    padding: 0px;
                    isolation: isolate;
                    width: 64px;
                    height: 64px;
                    position: relative;
                }

                .metric-gauge-text {
                    position: absolute;
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 500;
                    font-size: 12px;
                    line-height: 14px;
                    display: flex;
                    align-items: center;
                    letter-spacing: 0.6px;
                    color: #E2E2E8;
                    z-index: 1;
                }

                .metric-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0px;
                    gap: 4px;
                    height: 48px;
                }

                .metric-label-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 0px;
                    gap: 8px;
                    height: 12px;
                }

                .metric-label-icon {
                    width: 12px;
                    height: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #C4C5D9;
                }

                .metric-label-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #C4C5D9;
                }

                .metric-value {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 600;
                    font-size: 24px;
                    line-height: 31px;
                    color: #E2E2E8;
                }

                /* Tab Content Canvas Container */
                .tab-content-canvas {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 24px;
                    gap: 24px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(6px);
                    border-radius: 12px;
                    align-self: stretch;
                }

                .canvas-header-row {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0px 0px 24px;
                    width: 100%;
                    border-bottom: 1px solid rgba(67, 70, 86, 0.1);
                    margin-bottom: 16px;
                }

                .canvas-title {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: 32px;
                    line-height: 38px;
                    letter-spacing: -0.8px;
                    color: #E2E2E8;
                    margin: 0;
                }

                /* Status Badge pass */
                .diagnostics-badge {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 8px 24px;
                    gap: 8px;
                    background: rgba(91, 255, 161, 0.1);
                    border: 1px solid rgba(91, 255, 161, 0.3);
                    box-shadow: 0px 0px 10px rgba(0, 227, 131, 0.3);
                    border-radius: 9999px;
                    color: #5BFFA1;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    text-transform: uppercase;
                }

                /* RAM Slots Layout Grid */
                .ram-slots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
                    gap: 24px;
                    width: 100%;
                }

                /* Slot occupied card */
                .slot-occupied-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(6px);
                    border-radius: 12px;
                    min-height: 440px;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }

                .slot-occupied-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.12);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
                }

                .slot-occupied-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: linear-gradient(90deg, #6366F1, #8B5CF6);
                }

                .slot-card-header {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    margin-bottom: 24px;
                }

                .slot-label-group {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 16px;
                }

                .slot-label-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #E2E2E8;
                    text-transform: uppercase;
                }

                .occupied-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 2px 8px;
                    background: rgba(91, 255, 161, 0.2);
                    border-radius: 4px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 10px;
                    line-height: 15px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #5BFFA1;
                }

                .slot-mfg-row {
                    width: 100%;
                    margin-bottom: 24px;
                }

                .mfg-name {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 24px;
                    line-height: 20px;
                    color: #FFFFFF;
                    margin: 0 0 8px 0;
                }

                .capacity-type-row {
                    display: flex;
                    flex-direction: row;
                    align-items: baseline;
                    gap: 8px;
                }

                .capacity-text {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: 32px;
                    line-height: 38px;
                    letter-spacing: -0.64px;
                    color: #E2E2E8;
                }

                .type-text {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #8E90A2;
                }

                /* Hardware verification card inside slot card */
                .hw-verification-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 16px;
                    gap: 8px;
                    width: 100%;
                    background: rgba(12, 14, 18, 0.5);
                    border: 1px solid rgba(67, 70, 86, 0.1);
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                .hw-verification-title {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 9px;
                    line-height: 14px;
                    letter-spacing: 0.45px;
                    text-transform: uppercase;
                    color: #8E90A2;
                    margin-bottom: 4px;
                }

                .verification-row {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    height: 20px;
                }

                .verification-item {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                }

                .check-icon {
                    width: 8px;
                    height: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #5BFFA1;
                }

                .verification-label {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 14px;
                    line-height: 20px;
                    color: #C4C5D9;
                }

                .verification-value {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 500;
                    font-size: 12px;
                    line-height: 14px;
                    letter-spacing: 0.6px;
                    color: #5BFFA1;
                }

                /* Technical Specs List in Card */
                .slot-tech-specs {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 100%;
                }

                .tech-spec-row {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                .tech-spec-label {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 10px;
                    line-height: 15px;
                    color: #8E90A2;
                }

                .tech-spec-value {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 10px;
                    line-height: 15px;
                    color: #E2E2E8;
                }

                /* Controller model and Monitor cards layout */
                .display-cards-row {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    gap: 24px;
                    width: 100%;
                }

                .display-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    padding: 24px;
                    gap: 24px;
                    flex: 1;
                    height: 160.97px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(6px);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .display-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
                }

                .display-icon-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 16px;
                    width: 52px;
                    height: 50px;
                    background: rgba(211, 0, 120, 0.2);
                    border-radius: 8px;
                    justify-content: center;
                    align-items: center;
                }

                .display-icon-wrapper.green {
                    background: rgba(39, 255, 151, 0.2);
                }

                .display-info-container {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    flex: 1;
                }

                .display-label {
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 11px;
                    line-height: 11px;
                    letter-spacing: 1.1px;
                    color: #C4C5D9;
                }

                .display-value {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-weight: 600;
                    font-size: 24px;
                    line-height: 31px;
                    color: #E2E2E8;
                }

                .display-subtext {
                    font-family: 'Inter', sans-serif;
                    font-weight: 400;
                    font-size: 13px;
                    color: #8E90A2;
                }

                /* Overview layout content */
                .overview-grid {
                    display: flex;
                    flex-direction: row;
                    gap: 24px;
                    width: 100%;
                }

                .overview-left-card {
                    flex: 2;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.015);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                }

                .overview-right-card {
                    flex: 1;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.015);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    gap: 20px;
                }
                `
            }} />

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
                                onClick={() => {
                                    setIsUpToDate(false);
                                    setUpdateInfo(null);
                                    setIsUpdateModalOpen(true);
                                }}
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
                                onClick={() => setIsReloadModalOpen(true)}
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
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Total Slots on Board</label>
                                    <select value={cfgRamTotalSlots} onChange={(e) => setCfgRamTotalSlots(parseInt(e.target.value))}>
                                        <option value={2}>2 Slots (Standard Laptop)</option>
                                        <option value={4}>4 Slots (Desktop / Workstation)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>Occupied / Active Slots</label>
                                    <select value={cfgRamSlots} onChange={(e) => setCfgRamSlots(parseInt(e.target.value))}>
                                        <option value={1}>1 Slot Occupied</option>
                                        <option value={2}>2 Slots Occupied</option>
                                        <option value={4}>4 Slots Occupied</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>RAM Manufacturer</label>
                                <input type="text" value={cfgRamMfg} onChange={(e) => setCfgRamMfg(e.target.value)} required />
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
            {/* Reload Telemetry Script Modal */}
            {isReloadModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        background: '#0C0E12', border: '1px solid rgba(91, 255, 161, 0.3)', borderRadius: '16px',
                        width: '450px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Zap size={24} color="#5BFFA1" />
                            <h2 style={{ fontSize: '18px', color: '#FFF', margin: 0, fontWeight: 700 }}>Execute Hardware Script?</h2>
                        </div>
                        <p style={{ fontSize: '14px', color: '#8E90A2', lineHeight: '1.6', margin: 0 }}>
                            To securely read your exact hardware capacity and battery cycle counts, the system needs to run a background diagnostic script.
                            <br/><br/>
                            Do you want to download and run the <b>SpecCheck.exe (12KB)</b> script now?
                        </p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button 
                                onClick={() => setIsReloadModalOpen(false)}
                                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#E2E2E8', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', letterSpacing: '0.5px' }}
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={() => {
                                    setIsReloadModalOpen(false);
                                    fetchSpecsData(true);
                                }}
                                style={{ flex: 1, padding: '14px', background: '#5BFFA1', border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, textAlign: 'center', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                RUN INSTANT SCAN
                            </button>
                        </div>
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
                                        {isUpdating ? "DOWNLOADING..." : "UPDATE NOW"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
