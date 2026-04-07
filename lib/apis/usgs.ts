// WatcherG - USGS Earthquake API baglantisi
// Dinamik tarih araligi ile deprem verileri ceker

import { fetchJsonWithTimeout } from "@/lib/server/fetchWithTimeout";

const USGS_QUERY_URL =
    "https://earthquake.usgs.gov/fdsnws/event/1/query";

export interface UsgsEarthquakeFeature {
    id: string;
    properties: {
        mag: number;
        place: string;
        time: number;
        updated: number;
        url: string;
        title: string;
        status: string;
        type: string;
        alert: string | null;
        tsunami: number;
        source?: string;
    };
    geometry: {
        type: string;
        coordinates: [number, number, number];
    };
}

interface UsgsApiResponse {
    type: string;
    metadata: {
        generated: number;
        url: string;
        title: string;
        count: number;
    };
    features: UsgsEarthquakeFeature[];
}

interface FetchEarthquakesOptions {
    throwOnError?: boolean;
    timeoutMs?: number;
}

export async function fetchEarthquakes(
    hoursBack: number = 24,
    minimumMagnitude: number = 2.5,
    options: FetchEarthquakesOptions = {}
): Promise<UsgsEarthquakeFeature[]> {
    try {
        const endTime = new Date().toISOString();
        const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        const startTime = startDate.toISOString();

        const params = new URLSearchParams({
            format: "geojson",
            starttime: startTime,
            endtime: endTime,
            minmagnitude: minimumMagnitude.toString(),
            orderby: "time",
            limit: "500",
        });

        const data = await fetchJsonWithTimeout<UsgsApiResponse>(`${USGS_QUERY_URL}?${params}`, {
            source: "USGS Earthquake API",
            timeoutMs: options.timeoutMs,
            next: { revalidate: 300 },
        });

        return data.features;
    } catch (error) {
        console.error("USGS deprem verisi cekilemedi:", error);

        if (options.throwOnError) {
            throw error;
        }

        return [];
    }
}

export async function fetchEarthquakesByMagnitude(
    minimumMagnitude: number = 4.5,
    hoursBack: number = 72,
    options: FetchEarthquakesOptions = {}
): Promise<UsgsEarthquakeFeature[]> {
    return fetchEarthquakes(hoursBack, minimumMagnitude, options);
}
