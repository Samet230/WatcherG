// WatcherG — Resmi sağlık / salgın haber akışı
// Kaynaklar: CDC Travel Notices, CDC EID, ECDC epidemiological feeds
// Ücretsiz ve resmi kaynaklar

export interface HealthArticle {
    title: string;
    link: string;
    description: string;
    content?: string;
    pubDate: string;
    source: string;
    reliability: number;
    region: string;
}

const HEALTH_FEEDS = [
    {
        name: "CDC Travel Notices",
        url: "https://wwwnc.cdc.gov/travel/rss/notices.xml",
        reliability: 97,
        region: "US",
    },
    {
        name: "CDC EID Ahead of Print",
        url: "https://wwwnc.cdc.gov/eid/rss/ahead-of-print.xml",
        reliability: 96,
        region: "US",
    },
    {
        name: "ECDC Epidemiological Updates",
        url: "https://www.ecdc.europa.eu/en/taxonomy/term/1310/feed",
        reliability: 95,
        region: "EU",
    },
    {
        name: "ECDC Threats Report",
        url: "https://www.ecdc.europa.eu/en/taxonomy/term/1505/feed",
        reliability: 94,
        region: "EU",
    },
    // Yeni eklenen sağlık kaynakları
    {
        name: "WHO News",
        url: "https://www.who.int/rss-feeds/news-english.xml",
        reliability: 98,
        region: "GLOBAL",
    },
    {
        name: "NHS Health News",
        url: "https://www.nhs.uk/rss/health-news",
        reliability: 94,
        region: "GB",
    },
    {
        name: "MedlinePlus Health Topics",
        url: "https://medlineplus.gov/feeds/topic.xml",
        reliability: 93,
        region: "US",
    },
    {
        name: "WHO Disease Outbreak",
        url: "https://www.who.int/rss-feeds/disease-outbreak-news.xml",
        reliability: 97,
        region: "GLOBAL",
    },
];

function parseHealthFeed(
    xmlText: string,
    sourceName: string,
    reliability: number,
    region: string
): HealthArticle[] {
    const articles: HealthArticle[] = [];
    const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        const title = extractTag(itemContent, "title");
        let link = extractTag(itemContent, "link");

        if (!link && itemContent.includes("<link")) {
            const linkMatch = /<link[^>]*href=["']([^"']+)["'][^>]*>/i.exec(itemContent);
            if (linkMatch) link = linkMatch[1];
        }

        const description = extractTag(itemContent, "description") || extractTag(itemContent, "summary");
        const content = extractTag(itemContent, "content:encoded") || extractTag(itemContent, "content");
        const pubDate =
            extractTag(itemContent, "pubDate")
            || extractTag(itemContent, "published")
            || extractTag(itemContent, "updated");

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

function extractTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}(?:\\s+[^>]+)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = regex.exec(xml);
    if (!match) return null;

    let content = match[1].trim();
    if (content.startsWith("<![CDATA[")) {
        content = content.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
    }
    return content;
}

function cleanHtml(text: string): string {
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

export async function fetchHealthNews(maxPerSource = 12): Promise<HealthArticle[]> {
    const allArticles: HealthArticle[] = [];

    const feedResults = await Promise.allSettled(
        HEALTH_FEEDS.map(async (feed) => {
            try {
                const response = await fetch(feed.url, {
                    next: { revalidate: 300 },
                    headers: {
                        "User-Agent": "WatcherG/1.0 (health-monitor)",
                    },
                });

                if (!response.ok) {
                    console.warn(`${feed.name} RSS ${response.status} hatası`);
                    return [];
                }

                const xmlText = await response.text();
                return parseHealthFeed(xmlText, feed.name, feed.reliability, feed.region).slice(0, maxPerSource);
            } catch (error) {
                console.warn(`${feed.name} çekilemedi:`, error);
                return [];
            }
        })
    );

    for (const result of feedResults) {
        if (result.status === "fulfilled") {
            allArticles.push(...result.value);
        }
    }

    return allArticles;
}

export function getHealthFeedList() {
    return HEALTH_FEEDS.map((feed) => ({
        name: feed.name,
        region: feed.region,
        reliability: feed.reliability,
    }));
}
