// WatcherG — NewsData.io API bağlantısı
// Küresel haber API — API key gerektirir (ücretsiz tier, 200 istek/gün)

const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/latest";

// NewsData'dan gelen ham haber verisi
export interface NewsDataArticle {
    article_id: string;
    title: string;
    link: string;
    description: string | null;
    pubDate: string;
    source_id: string;
    source_name: string;
    country: string[];
    category: string[];
    language: string;
    image_url: string | null;
}

interface NewsDataApiResponse {
    status: string;
    totalResults: number;
    results: NewsDataArticle[];
}

// NewsData'dan son haberleri çek
export async function fetchNewsDataArticles(
    query: string = "crisis disaster",
    language: string = "en",
    size: number = 30
): Promise<NewsDataArticle[]> {
    const apiKey = process.env.NEWSDATA_API_KEY;

    // API key yoksa boş dön
    if (!apiKey) {
        console.warn("NewsData API key tanımlı değil, atlanıyor");
        return [];
    }

    try {
        const params = new URLSearchParams({
            apikey: apiKey,
            q: query,
            language,
            size: size.toString(),
        });

        const response = await fetch(`${NEWSDATA_BASE_URL}?${params}`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            throw new Error(`NewsData API hatası: ${response.status}`);
        }

        const data: NewsDataApiResponse = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("NewsData haber verisi çekilemedi:", error);
        return [];
    }
}
