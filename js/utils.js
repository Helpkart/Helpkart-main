import { CONFIG } from './config.js';

export async function fetchData() {
    const response = await fetch(CONFIG.DATA_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
}

export function parseTupleData(tupleData) {
    if (!tupleData || tupleData.length < 2) return [];

    const headers = tupleData[0];
    const rows = tupleData.slice(1);

    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });

        // Calculate Ghost Mode status
        const updatedAt = new Date(obj.updated_at).getTime();
        const now = Date.now();
        const isStale = (now - updatedAt) > CONFIG.STALE_THRESHOLD_MS;

        obj._isStale = isStale;
        obj._displayStatus = isStale ? 'stale' : (obj.status || 'normal');

        return obj;
    });
}

export function getMarkerColor(status) {
    switch (status) {
        case 'critical': return '#EF4444';
        case 'surplus': return '#10B981';
        case 'stale': return '#9CA3AF';
        default: return '#3B82F6'; // normal
    }
}
