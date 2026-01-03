'use server';

import si from 'systeminformation';

export async function getCpuDetails() {
    try {
        const [cpu, cpuCache, currentSpeed] = await Promise.all([
            si.cpu(),
            si.cpuCache(),
            si.cpuCurrentSpeed()
        ]);

        return {
            manufacturer: cpu.manufacturer,
            brand: cpu.brand,
            vendor: cpu.vendor,
            family: cpu.family,
            model: cpu.model,
            stepping: cpu.stepping,
            revision: cpu.revision,
            voltage: cpu.voltage,
            speed: cpu.speed,
            speedMin: cpu.speedMin,
            speedMax: cpu.speedMax,
            governor: cpu.governor,
            cores: cpu.cores,
            physicalCores: cpu.physicalCores,
            processors: cpu.processors,
            socket: cpu.socket,
            flags: cpu.flags,
            virtualization: cpu.virtualization,
            cache: {
                l1d: cpuCache.l1d,
                l1i: cpuCache.l1i,
                l2: cpuCache.l2,
                l3: cpuCache.l3,
            },
            currentSpeed: currentSpeed.avg,
            currentSpeedCores: currentSpeed.cores
        };
    } catch (error) {
        console.error("Error fetching CPU info:", error);
        return null;
    }
}
