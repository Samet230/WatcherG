export interface FirmsFireRecord {
    latitude: number;
    longitude: number;
    brightness?: number;
    bright_ti4?: number;
    bright_ti5?: number;
    frp?: number;
    confidence?: string;
    acq_date: string;
    acq_time: string;
    satellite?: string;
    daynight?: string;
}

const FIRMS_API_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const DEFAULT_SOURCE = "VIIRS_SNPP_NRT";

function parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
        const char = line[index];
        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    result.push(current);
    return result;
}

function toNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export async function fetchFirmsFireRecords(
    days = 1,
    source = DEFAULT_SOURCE
): Promise<FirmsFireRecord[]> {
    const mapKey = process.env.NASA_FIRMS_MAP_KEY;
    if (!mapKey) {
        throw new Error("NASA_FIRMS_MAP_KEY tanimli degil");
    }

    const url = `${FIRMS_API_BASE}/${mapKey}/${source}/world/${days}`;
    const response = await fetch(url, {
        next: { revalidate: 15 * 60 },
    });

    if (!response.ok) {
        throw new Error(`NASA FIRMS hatasi: ${response.status}`);
    }

    const csv = await response.text();
    const lines = csv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length <= 1) {
        return [];
    }

    const headers = parseCsvRow(lines[0]);
    const records: FirmsFireRecord[] = [];

    for (const line of lines.slice(1)) {
        const values = parseCsvRow(line);
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

        const latitude = toNumber(row.latitude);
        const longitude = toNumber(row.longitude);
        const acqDate = row.acq_date;
        const acqTime = row.acq_time;

        if (latitude === undefined || longitude === undefined || !acqDate || !acqTime) {
            continue;
        }

        records.push({
            latitude,
            longitude,
            brightness: toNumber(row.brightness),
            bright_ti4: toNumber(row.bright_ti4),
            bright_ti5: toNumber(row.bright_ti5),
            frp: toNumber(row.frp),
            confidence: row.confidence,
            acq_date: acqDate,
            acq_time: acqTime,
            satellite: row.satellite,
            daynight: row.daynight,
        });
    }

    return records;
}
