// WatcherG — GDELT API bağlantısı
// Küresel haber ve olay veritabanı — API key gerektirmez

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";

// GDELT'den gelen ham haber verisi
export interface GdeltArticle {
    url: string;
    url_mobile: string;
    title: string;
    seendate: string;
    socialimage: string;
    domain: string;
    language: string;
    sourcecountry: string;
}

interface GdeltApiResponse {
    articles: GdeltArticle[];
}

// Son haberleri çek (varsayılan: son 24 saat, 50 sonuç)
export async function fetchGdeltNews(
    query: string = "",
    maxRecords: number = 50
): Promise<GdeltArticle[]> {
    try {
        const params = new URLSearchParams({
            query: query || "crisis OR disaster OR conflict OR earthquake",
            mode: "ArtList",
            maxrecords: maxRecords.toString(),
            format: "json",
            timespan: "24h",
            sort: "DateDesc",
        });

        const response = await fetch(`${GDELT_DOC_API}?${params}`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            throw new Error(`GDELT API hatası: ${response.status}`);
        }

        const data: GdeltApiResponse = await response.json();
        return data.articles || [];
    } catch (error) {
        console.error("GDELT haber verisi çekilemedi:", error);
        return [];
    }
}

// Belirli ülke için haberleri çek
export async function fetchGdeltNewsByCountry(
    countryCode: string,
    maxRecords: number = 30
): Promise<GdeltArticle[]> {
    return fetchGdeltNews(`sourcecountry:${countryCode}`, maxRecords);
}
