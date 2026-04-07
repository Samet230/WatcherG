import type { NewsCategory } from "@/types/pin";

export interface ScienceArticle {
    title: string;
    link: string;
    description: string;
    content?: string;
    pubDate: string;
    source: string;
    reliability: number;
    region: string;
    kategori: Extract<NewsCategory, "science">;
}

const SCIENCE_FEEDS = [
    { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/all.xml", reliability: 91, region: "US", kategori: "science" as const },
    { name: "Phys.org", url: "https://phys.org/rss-feed/", reliability: 90, region: "GLOBAL", kategori: "science" as const },
    { name: "Nature", url: "https://www.nature.com/nature.rss", reliability: 96, region: "GB", kategori: "science" as const },
    { name: "New Scientist", url: "https://www.newscientist.com/feed/home/", reliability: 90, region: "GB", kategori: "science" as const },
];

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

function parseScienceFeed(
    xmlText: string,
    sourceName: string,
    reliability: number,
    region: string,
    kategori: ScienceArticle["kategori"]
): ScienceArticle[] {
    const articles: ScienceArticle[] = [];
    const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match: RegExpExecArray | null;

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

export async function fetchScienceNews(maxPerSource = 8): Promise<ScienceArticle[]> {
    const allArticles: ScienceArticle[] = [];

    const results = await Promise.allSettled(
        SCIENCE_FEEDS.map(async (feed) => {
            try {
                const response = await fetch(feed.url, {
                    next: { revalidate: 300 },
                    headers: {
                        "User-Agent": "WatcherG/1.0 (science-monitor)",
                    },
                });

                if (!response.ok) {
                    console.warn(`${feed.name} RSS ${response.status} hatasi`);
                    return [];
                }

                const xmlText = await response.text();
                return parseScienceFeed(xmlText, feed.name, feed.reliability, feed.region, feed.kategori).slice(0, maxPerSource);
            } catch (error) {
                console.warn(`${feed.name} cekilemedi:`, error);
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
