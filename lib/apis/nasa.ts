// WatcherG - NASA EONET API
// Acik API, auth gerekmez. Dogal afetleri ve iklim olaylarini saglar.

import { fetchJsonWithTimeout } from "@/lib/server/fetchWithTimeout";

export interface EonetEvent {
    id: string;
    title: string;
    description: string;
    link: string;
    categories: Array<{ id: string; title: string }>;
    sources: Array<{ id: string; url: string }>;
    geometry: Array<{
        date: string;
        type: "Point" | "Polygon";
        coordinates: number[] | number[][][];
    }>;
}

interface EonetApiResponse {
    events?: EonetEvent[];
}

interface FetchNasaEventsOptions {
    throwOnError?: boolean;
    timeoutMs?: number;
}

const EONET_API_URL = "https://eonet.gsfc.nasa.gov/api/v3/events";

export async function fetchNasaEvents(
    categoryIds?: string,
    days: number = 7,
    options: FetchNasaEventsOptions = {}
): Promise<EonetEvent[]> {
    try {
        let url = `${EONET_API_URL}?days=${days}`;
        if (categoryIds) {
            url += `&category=${categoryIds}`;
        }

        const data = await fetchJsonWithTimeout<EonetApiResponse>(url, {
            source: "NASA EONET API",
            timeoutMs: options.timeoutMs,
            next: { revalidate: 300 },
        });

        const events = data.events || [];

        return events.filter((event) => {
            const hasEarthquake = event.categories.some(
                (category) =>
                    category.id === "earthquakes" ||
                    category.title.toLowerCase().includes("earthquake")
            );

            return !hasEarthquake;
        });
    } catch (error) {
        console.error("NASA API fetch hatasi:", error);

        if (options.throwOnError) {
            throw error;
        }

        return [];
    }
}
