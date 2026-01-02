'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { readFile, unlink } from 'fs/promises';
import os from 'os';

const execPromise = promisify(exec);

export interface BatteryDetails {
    name: string;
    manufacturer: string;
    serialNumber: string;
    chemistry: string;
    designCapacity: string;
    fullChargeCapacity: string;
    cycleCount: string;
    hostName: string;
}

export async function getBatteryDetails(): Promise<BatteryDetails | null> {
    const reportPath = path.resolve(process.cwd(), `battery_data_${Date.now()}.xml`);

    try {
        // Generate XML report for parsing
        await execPromise(`powercfg /batteryreport /xml /output "${reportPath}"`);

        // Read file content
        const xmlContent = await readFile(reportPath, 'utf-8');

        // Find the <Battery> block (first instance usually contains the main battery info)
        const batteryBlockMatch = xmlContent.match(/<Battery>([\s\S]*?)<\/Battery>/);
        const batteryBlock = batteryBlockMatch ? batteryBlockMatch[1] : xmlContent;

        const extract = (tag: string) => {
            const match = batteryBlock.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1] : 'Not Available';
        };

        // Parse numeric values to format nicely (comma separated)
        const formatNum = (val: string) => {
            const num = parseInt(val);
            return isNaN(num) ? val : num.toLocaleString();
        };

        const details: BatteryDetails = {
            name: "Primary", // Usually generic in the report or extracted if deeper
            manufacturer: extract('Manufacturer'),
            serialNumber: extract('SerialNumber'),
            chemistry: extract('Chemistry'),
            designCapacity: `${formatNum(extract('DesignCapacity'))} mWh`,
            fullChargeCapacity: `${formatNum(extract('FullChargeCapacity'))} mWh`,
            cycleCount: extract('CycleCount'),
            hostName: os.hostname()
        };

        return details;

    } catch (error) {
        console.error("Failed to parse battery details:", error);
        return null;
    } finally {
        // Cleanup the temp XML file
        try {
            await unlink(reportPath);
        } catch (e) { /* ignore */ }
    }
}

export async function generateAndOpenReport() {
    try {
        const reportPath = path.resolve(process.cwd(), 'battery_report.html');
        // Generate HTML version for the user to view manually
        await execPromise(`powercfg /batteryreport /output "${reportPath}"`);
        await execPromise(`cmd /c start "" "${reportPath}"`);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
