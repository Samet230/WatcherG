// WatcherG — NASA EONET (Earth Observatory Natural Event Tracker) API
// Açık API, auth gerekmez. Doğal afetleri, iklim olaylarını sağlar.

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

const EONET_API_URL = "https://eonet.gsfc.nasa.gov/api/v3/events";

// NASA EONET verilerini getir
// Kategori ID'leri: 
// - wildfires (10)
// - volcanoes (12)
// - severeStorms (10) - bazen 15
// Not: Depremler (earthquakes) USGS'den alındığı için filtrelenecektir (ID: 14)
export async function fetchNasaEvents(categoryIds?: string, days: number = 7): Promise<EonetEvent[]> {
    try {
        let url = `${EONET_API_URL}?days=${days}`;
        if (categoryIds) {
            url += `&category=${categoryIds}`;
        }

        const res = await fetch(url, { next: { revalidate: 300 } }); // 5 dk cache
        if (!res.ok) {
            console.error(`NASA EONET Hatası: ${res.status}`);
            return [];
        }

        const data = await res.json();

        // Depremleri burada direkt filtreliyoruz (Kullanıcı talebi)
        const events = data.events || [];
        return events.filter((event: EonetEvent) => {
            const hasEarthquake = event.categories.some(c => c.id === "earthquakes" || c.title.toLowerCase().includes("earthquake"));
            return !hasEarthquake;
        });

    } catch (e) {
        console.error("NASA API fetch hatası:", e);
        return [];
    }
}
