// WatcherG — The Guardian API bağlantısı
// Uluslararası haber kaynağı — API key gerektirir (ücretsiz tier)

const GUARDIAN_BASE_URL = "https://content.guardianapis.com/search";

// Guardian'dan gelen ham haber verisi
export interface GuardianArticle {
    id: string;
    webTitle: string;
    webUrl: string;
    webPublicationDate: string;
    sectionName: string;
    pillarName: string;
}

interface GuardianApiResponse {
    response: {
        status: string;
        total: number;
        results: GuardianArticle[];
    };
}

// Guardian'dan son haberleri çek
export async function fetchGuardianNews(
    query: string = "world",
    pageSize: number = 30
): Promise<GuardianArticle[]> {
    const apiKey = process.env.GUARDIAN_API_KEY;

    // API key yoksa boş dön (yedek kaynak zincirinde atlanacak)
    if (!apiKey) {
        console.warn("Guardian API key tanımlı değil, atlanıyor");
        return [];
    }

    try {
        const params = new URLSearchParams({
            q: query,
            "page-size": pageSize.toString(),
            "order-by": "newest",
            "api-key": apiKey,
        });

        const response = await fetch(`${GUARDIAN_BASE_URL}?${params}`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            throw new Error(`Guardian API hatası: ${response.status}`);
        }

        const data: GuardianApiResponse = await response.json();
        return data.response.results || [];
    } catch (error) {
        console.error("Guardian haber verisi çekilemedi:", error);
        return [];
    }
}
