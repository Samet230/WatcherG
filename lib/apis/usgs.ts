// WatcherG — USGS Earthquake API bağlantısı
// Dinamik tarih aralığı ile deprem verileri çeker

const USGS_QUERY_URL =
    "https://earthquake.usgs.gov/fdsnws/event/1/query";

// USGS'den gelen ham veri tipi
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
    };
    geometry: {
        type: string;
        coordinates: [number, number, number]; // [longitude, latitude, depth]
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

// Son N saat içindeki depremleri çek (varsayılan: 24 saat, min büyüklük: 2.5)
export async function fetchEarthquakes(
    hoursBack: number = 24,
    minimumMagnitude: number = 2.5
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
            orderby: "time",       // En yeniler önce
            limit: "500",          // Maksimum 500 sonuç
        });

        const response = await fetch(`${USGS_QUERY_URL}?${params}`, {
            next: { revalidate: 300 }, // 5 dakikada bir yeniden doğrula
        });

        if (!response.ok) {
            throw new Error(`USGS API hatası: ${response.status}`);
        }

        const data: UsgsApiResponse = await response.json();
        return data.features;
    } catch (error) {
        console.error("USGS deprem verisi çekilemedi:", error);
        return [];
    }
}

// Belirli bir büyüklük eşiğinin üzerindeki depremleri çek
export async function fetchEarthquakesByMagnitude(
    minimumMagnitude: number = 4.5,
    hoursBack: number = 72
): Promise<UsgsEarthquakeFeature[]> {
    return fetchEarthquakes(hoursBack, minimumMagnitude);
}
