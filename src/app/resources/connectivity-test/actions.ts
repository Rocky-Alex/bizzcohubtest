'use server';

import si from 'systeminformation';

export async function getConnectivityData() {
    try {
        const [interfaces, wifi] = await Promise.all([
            si.networkInterfaces(),
            si.wifiConnections()
        ]);

        // Ensure serialization safety
        return {
            interfaces: Array.isArray(interfaces) ? interfaces : [],
            wifi: Array.isArray(wifi) ? wifi : []
        };
    } catch (error) {
        console.error("Failed to fetch connectivity data", error);
        return { interfaces: [], wifi: [] };
    }
}
