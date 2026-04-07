// WatcherG — ReliefWeb API entegrasyonu
// İnsani yardım ve afet raporlarını çeker
// API key gerektirmez — tamamen ücretsiz (1000 istek/gün)

const RELIEFWEB_BASE_URL = "https://api.reliefweb.int/v2";
const APP_NAME = "watcherg";

// ReliefWeb'den dönen rapor verisi
export interface ReliefWebReport {
    id: number;
    title: string;
    body: string;
    url: string;
    date: string;
    source: string;
    country: string;
    countryCode: string;
    disasterType: string;
    disasterName?: string;
}

// ReliefWeb API'den son afet/insani yardım raporlarını çek
export async function fetchReliefWebReports(
    maxResults: number = 20
): Promise<ReliefWebReport[]> {
    try {
        const url = new URL(`${RELIEFWEB_BASE_URL}/reports`);
        url.searchParams.append("appname", APP_NAME);
        url.searchParams.append("filter[field]", "status");
        url.searchParams.append("filter[value]", "published");
        url.searchParams.append("limit", String(maxResults));
        url.searchParams.append("sort", "date.created:desc");

        const fields = ["title", "body", "url", "date.created", "source", "primary_country"];
        fields.forEach(f => url.searchParams.append("fields[include][]", f));

        const response = await fetch(
            url.toString(),
            {
                next: { revalidate: 600 },
                headers: {
                    "Accept": "application/json",
                },
            }
        );

        if (!response.ok) {
            console.warn(`ReliefWeb API ${response.status} hatası`);
            return [];
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
            return [];
        }

        return data.data.map((item: ReliefWebApiItem) => parseReliefWebItem(item)).filter(Boolean) as ReliefWebReport[];
    } catch (apiError) {
        console.error("ReliefWeb API hatası:", apiError);
        return [];
    }
}

// Ham API verisini standart formata çevir
interface ReliefWebApiItem {
    id: number;
    fields?: {
        title?: string;
        body?: string;
        url?: string;
        date?: { created?: string };
        source?: Array<{ name?: string }>;
        country?: Array<{ name?: string; iso3?: string }>;
        disaster_type?: Array<{ name?: string }>;
        disaster?: Array<{ name?: string }>;
    };
}

function parseReliefWebItem(item: ReliefWebApiItem): ReliefWebReport | null {
    const fields = item.fields;
    if (!fields || !fields.title) {
        return null;
    }

    // Ülke bilgisini al (ilk ülke)
    const countryInfo = fields.country?.[0];
    const countryName = countryInfo?.name || "Global";
    const countryCode = countryInfo?.iso3 || "";

    // Afet türünü al
    const disasterType = fields.disaster_type?.[0]?.name || "Other";
    const disasterName = fields.disaster?.[0]?.name;

    // Kaynak adını al
    const sourceName = fields.source?.[0]?.name || "ReliefWeb";

    // Gövde metninden kısa özet oluştur (ilk 300 karakter)
    const rawBody = fields.body || "";
    const cleanBody = rawBody
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const summary = cleanBody.length > 300
        ? `${cleanBody.substring(0, 297)}...`
        : cleanBody;

    return {
        id: item.id,
        title: fields.title,
        body: summary,
        url: fields.url || `https://reliefweb.int/node/${item.id}`,
        date: fields.date?.created || new Date().toISOString(),
        source: sourceName,
        country: countryName,
        countryCode,
        disasterType,
        disasterName,
    };
}
