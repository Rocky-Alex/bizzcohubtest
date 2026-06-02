import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [system, cpu, mem, os, graphics, diskLayout, battery, memLayout] = await Promise.all([
            si.system(),
            si.cpu(),
            si.mem(),
            si.osInfo(),
            si.graphics(),
            si.diskLayout(),
            si.battery(),
            si.memLayout()
        ]);

        const data = {
            system: {
                manufacturer: system.manufacturer || 'N/A',
                model: system.model || 'N/A',
                version: system.version || 'N/A',
                serial: system.serial || 'N/A',
                uuid: system.uuid || 'N/A',
                sku: system.sku || 'N/A',
            },
            cpu: {
                manufacturer: cpu.manufacturer || 'N/A',
                brand: cpu.brand || 'N/A',
                speed: cpu.speed || 0,
                cores: cpu.cores || 0,
                physicalCores: cpu.physicalCores || 0,
            },
            mem: {
                total: mem.total || 0,
                free: mem.free || 0,
                used: mem.used || 0,
                active: mem.active || 0,
                available: mem.available || 0,
            },
            os: {
                platform: os.platform || 'N/A',
                distro: os.distro || 'N/A',
                release: os.release || 'N/A',
                arch: os.arch || 'N/A',
                hostname: os.hostname || 'N/A',
                uefi: os.uefi ?? null,
            },
            graphics: {
                controllers: (graphics.controllers || []).map(c => ({
                    vendor: c.vendor || 'N/A',
                    model: c.model || 'N/A',
                    vram: c.vram || 0,
                })),
                displays: (graphics.displays || []).map(d => ({
                    vendor: d.vendor || 'N/A',
                    model: d.model || 'N/A',
                    resolutionX: d.resolutionX || 0,
                    resolutionY: d.resolutionY || 0,
                    currentRefreshRate: d.currentRefreshRate || 0,
                })),
            },
            diskLayout: (diskLayout || []).map(d => ({
                type: d.type || 'N/A',
                name: d.name || 'N/A',
                vendor: d.vendor || 'N/A',
                size: d.size || 0,
                smartStatus: d.smartStatus || 'Ok',
            })),
            battery: {
                hasBattery: battery.hasBattery ?? false,
                isCharging: battery.isCharging ?? false,
                percent: battery.percent ?? 0,
                designedCapacity: battery.designedCapacity || 0,
                maxCapacity: battery.maxCapacity || 0,
                currentCapacity: battery.currentCapacity || 0,
                acConnected: battery.acConnected ?? false,
            },
            ramLayout: (memLayout || []).map(r => ({
                size: r.size || 0,
                bank: r.bank || 'N/A',
                type: r.type || 'N/A',
                ecc: r.ecc ?? false,
                clockSpeed: r.clockSpeed || 0,
                formFactor: r.formFactor || 'N/A',
                manufacturer: r.manufacturer || 'N/A',
                partNum: r.partNum || 'N/A',
                serialNum: r.serialNum || 'N/A',
                voltageConfigured: r.voltageConfigured || 0,
            }))
        };

        const res = NextResponse.json(data);
        res.headers.set('Access-Control-Allow-Origin', '*');
        res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res;
    } catch (error: any) {
        const res = NextResponse.json({
            status: 'error',
            error: error.message
        }, { status: 500 });
        res.headers.set('Access-Control-Allow-Origin', '*');
        return res;
    }
}

export async function OPTIONS() {
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
}
