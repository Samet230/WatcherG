import type { NewsCategory } from "@/types/pin";

export interface TopicArticle {
    title: string;
    link: string;
    description: string;
    content?: string;
    pubDate: string;
    source: string;
    reliability: number;
    region: string;
    kategori: Extract<NewsCategory, "politics" | "economy">;
}

const TOPIC_FEEDS = [
    {
        name: "Turkiye MFA",
        url: "https://www.mfa.gov.tr/rss.en.mfa",
        reliability: 97,
        region: "TR",
        kategori: "politics" as const,
    },
    {
        name: "TCMB Press Releases",
        url: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS/BasinDuyurulariRss",
        reliability: 97,
        region: "TR",
        kategori: "economy" as const,
    },
    {
        name: "TCMB MPC Decisions",
        url: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS/PPKKararlariRss",
        reliability: 98,
        region: "TR",
        kategori: "economy" as const,
    },
    {
        name: "BBC Politics",
        url: "http://feeds.bbci.co.uk/news/politics/rss.xml",
        reliability: 94,
        region: "GB",
        kategori: "politics" as const,
    },
    {
        name: "BBC Business",
        url: "http://feeds.bbci.co.uk/news/business/rss.xml",
        reliability: 94,
        region: "GB",
        kategori: "economy" as const,
    },
    // Yeni eklenen kaynaklar
    {
        name: "DW Politics",
        url: "https://rss.dw.com/xml/rss-en-pol",
        reliability: 85,
        region: "DE",
        kategori: "politics" as const,
    },
    {
        name: "France24 Politics",
        url: "https://www.france24.com/en/politics/rss",
        reliability: 86,
        region: "FR",
        kategori: "politics" as const,
    },
    {
        name: "CNBC World Economy",
        url: "https://www.cnbc.com/id/100727362/device/rss/rss.html",
        reliability: 88,
        region: "US",
        kategori: "economy" as const,
    },
    {
        name: "NHK Business",
        url: "https://www3.nhk.or.jp/rss/news/cat5.xml",
        reliability: 90,
        region: "JP",
        kategori: "economy" as const,
    },
    {
        name: "Al Jazeera Economy",
        url: "https://www.aljazeera.com/xml/rss/all.xml",
        reliability: 84,
        region: "QA",
        kategori: "economy" as const,
    },
    {
        name: "Politico EU",
        url: "https://www.politico.eu/feed/",
        reliability: 89,
        region: "EU",
        kategori: "politics" as const,
    },
    {
        name: "Ekonomi Haberleri TR",
        url: "https://www.bloomberght.com/rss",
        reliability: 86,
        region: "TR",
        kategori: "economy" as const,
    },
];

function parseTopicFeed(
    xmlText: string,
    sourceName: string,
    reliability: number,
    region: string,
    kategori: TopicArticle["kategori"]
): TopicArticle[] {
    const articles: TopicArticle[] = [];
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
                kategori,
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

export async function fetchTopicNews(maxPerSource = 8): Promise<TopicArticle[]> {
    const allArticles: TopicArticle[] = [];

    const results = await Promise.allSettled(
        TOPIC_FEEDS.map(async (feed) => {
            try {
                const response = await fetch(feed.url, {
                    next: { revalidate: 300 },
                    headers: {
                        "User-Agent": "WatcherG/1.0 (topic-monitor)",
                    },
                });

                if (!response.ok) {
                    console.warn(`${feed.name} RSS ${response.status} hatası`);
                    return [];
                }

                const xmlText = await response.text();
                return parseTopicFeed(
                    xmlText,
                    feed.name,
                    feed.reliability,
                    feed.region,
                    feed.kategori
                ).slice(0, maxPerSource);
            } catch (error) {
                console.warn(`${feed.name} çekilemedi:`, error);
                return [];
            }
        })
    );

    for (const result of results) {
        if (result.status === "fulfilled") {
            allArticles.push(...result.value);
        }
    }

    return allArticles;
}
