// WatcherG — Türkçe haber RSS parse
// Kaynaklar: BBC Türkçe, TRT Haber, Euronews Türkçe
// API key gerektirmez — RSS feed'leri herkese açıktır

// RSS kaynakları
const RSS_FEEDS = [
    {
        name: "BBC Türkçe",
        url: "https://feeds.bbci.co.uk/turkce/rss.xml",
        reliability: 90,
    },
    {
        name: "TRT Haber",
        url: "https://www.trthaber.com/sondakika.rss",
        reliability: 80,
    },
    {
        name: "Euronews Türkçe",
        url: "https://tr.euronews.com/rss",
        reliability: 85,
    },
];

// RSS'den parse edilmiş haber
export interface RssArticle {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
    reliability: number;
}

// Basit XML'den haber çıkar (tam XML parser olmadan)
function parseRssItems(xmlText: string, sourceName: string, reliability: number): RssArticle[] {
    const articles: RssArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];

        const title = extractTag(itemContent, "title");
        const link = extractTag(itemContent, "link");
        const description = extractTag(itemContent, "description");
        const pubDate = extractTag(itemContent, "pubDate");

        if (title && link) {
            articles.push({
                title: cleanHtml(title),
                link,
                description: cleanHtml(description || ""),
                pubDate: pubDate || new Date().toISOString(),
                source: sourceName,
                reliability,
            });
        }
    }

    return articles;
}

// XML tag'ından içerik çıkar
function extractTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tagName}>`, "s");
    const match = regex.exec(xml);
    return match ? match[1].trim() : null;
}

// HTML etiketlerini temizle
function cleanHtml(text: string): string {
    return text.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

// Tüm Türkçe RSS kaynaklarından haberleri çek
export async function fetchTurkishNews(maxPerSource: number = 10): Promise<RssArticle[]> {
    const allArticles: RssArticle[] = [];

    for (const feed of RSS_FEEDS) {
        try {
            const response = await fetch(feed.url, {
                next: { revalidate: 300 },
            });

            if (!response.ok) continue;

            const xmlText = await response.text();
            const articles = parseRssItems(xmlText, feed.name, feed.reliability);
            allArticles.push(...articles.slice(0, maxPerSource));
        } catch (feedError) {
            console.warn(`${feed.name} RSS çekilemedi:`, feedError);
        }
    }

    return allArticles;
}
