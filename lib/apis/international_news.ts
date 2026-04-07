// WatcherG — Uluslararası haber RSS kaynakları
// 13 farklı ülke/bölgeden haber çeker
// API key gerektirmez — tüm RSS feed'leri herkese açıktır

// Uluslararası RSS kaynakları - bölge bilgisiyle birlikte
const INTERNATIONAL_FEEDS = [
    // Batı kaynakları
    { name: "BBC World", url: "http://feeds.bbci.co.uk/news/world/rss.xml", reliability: 92, region: "GB" },
    { name: "Reuters", url: "https://www.reuters.com/rssFeed/worldNews", reliability: 95, region: "GLOBAL" },
    { name: "AP News", url: "https://apnews.com/rss", reliability: 93, region: "US" },
    { name: "France24", url: "https://www.france24.com/en/rss", reliability: 85, region: "FR" },
    { name: "DW", url: "https://rss.dw.com/xml/rss-en-world", reliability: 85, region: "DE" },
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", reliability: 85, region: "QA" },
    // Doğu Asya kaynakları
    { name: "CGTN", url: "https://www.cgtn.com/subscribe/rss/section/world.xml", reliability: 75, region: "CN" },
    { name: "Xinhua", url: "http://www.xinhuanet.com/english/rss/worldrss.xml", reliability: 78, region: "CN" },
    { name: "NHK World", url: "https://www3.nhk.or.jp/rss/news/cat0.xml", reliability: 90, region: "JP" },
    { name: "Yonhap", url: "https://en.yna.co.kr/RSS/news.xml", reliability: 88, region: "KR" },
    // Kuzey kaynakları
    { name: "TASS", url: "https://tass.com/rss/v2.xml", reliability: 72, region: "RU" },
    // Güney Asya kaynakları
    { name: "NDTV", url: "https://feeds.feedburner.com/ndtvnews-top-stories", reliability: 82, region: "IN" },
    { name: "The Hindu", url: "https://www.thehindu.com/news/international/feeder/default.rss", reliability: 85, region: "IN" },
];

// RSS'den parse edilmiş uluslararası haber
export interface InternationalArticle {
    title: string;
    link: string;
    description: string;
    content?: string;
    pubDate: string;
    source: string;
    reliability: number;
    region: string;
}

function parseRssItems(
    xmlText: string,
    sourceName: string,
    reliability: number,
    region: string
): InternationalArticle[] {
    const articles: InternationalArticle[] = [];
    const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];

        const title = extractTag(itemContent, "title");
        let link = extractTag(itemContent, "link");

        // Atom feed'lerde <link href="..." /> formatında gelir
        if (!link && itemContent.includes("<link")) {
            const linkMatch = /<link[^>]*href=["']([^"']+)["'][^>]*>/i.exec(itemContent);
            if (linkMatch) link = linkMatch[1];
        }

        const description = extractTag(itemContent, "description") || extractTag(itemContent, "summary");
        const content = extractTag(itemContent, "content:encoded") || extractTag(itemContent, "content");
        const pubDate = extractTag(itemContent, "pubDate") || extractTag(itemContent, "published") || extractTag(itemContent, "updated");

        if (title && link) {
            articles.push({
                title: cleanHtml(title),
                link,
                description: cleanHtml(description || ""),
                content: cleanHtml(content || ""),
                pubDate: pubDate || new Date().toISOString(),
                source: sourceName,
                reliability,
                region,
            });
        }
    }

    return articles;
}

// XML etiketinden içerik çıkar
function extractTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}(?:\\s+[^>]+)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = regex.exec(xml);
    if (!match) return null;

    let content = match[1].trim();
    // CDATA temizliği
    if (content.startsWith("<![CDATA[")) {
        content = content.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
    }
    return content;
}

// HTML etiketlerini temizle
function cleanHtml(text: string): string {
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

// Tüm uluslararası RSS kaynaklarından haberleri çek
export async function fetchInternationalNews(
    maxPerSource: number = 8
): Promise<InternationalArticle[]> {
    const allArticles: InternationalArticle[] = [];

    // Paralel çekme — her kaynak bağımsız, biri hata verirse diğerleri etkilenmez
    const feedResults = await Promise.allSettled(
        INTERNATIONAL_FEEDS.map(async (feed) => {
            try {
                const response = await fetch(feed.url, {
                    next: { revalidate: 300 },
                    headers: {
                        "User-Agent": "WatcherG/1.0 (news-aggregator)",
                    },
                });

                if (!response.ok) {
                    console.warn(`${feed.name} RSS ${response.status} hatası`);
                    return [];
                }

                const xmlText = await response.text();
                const articles = parseRssItems(xmlText, feed.name, feed.reliability, feed.region);
                return articles.slice(0, maxPerSource);
            } catch (fetchError) {
                console.warn(`${feed.name} RSS çekilemedi:`, fetchError);
                return [];
            }
        })
    );

    // Başarılı sonuçları birleştir
    for (const result of feedResults) {
        if (result.status === "fulfilled") {
            allArticles.push(...result.value);
        }
    }

    return allArticles;
}

// Kaynak listesini dışarıya aç (debug/istatistik için)
export function getInternationalFeedList() {
    return INTERNATIONAL_FEEDS.map((feed) => ({
        name: feed.name,
        region: feed.region,
        reliability: feed.reliability,
    }));
}
