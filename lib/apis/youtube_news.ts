// WatcherG - YouTube Video Haberleri
// Agent-Reach yaklasimina uyumlu olarak once yt-dlp (varsa),
// sonra YouTube kanal RSS, en son HTML scrape fallback'i kullanilir.

import { execFile } from "node:child_process";
import type { NewsCategory } from "@/types/pin";

export interface YouTubeVideoArticle {
    videoId: string;
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    thumbnail: string;
    link: string;
    reliability: number;
    region: string;
    kategori: NewsCategory;
}

export interface YouTubeChannelStatus {
    name: string;
    kategori: NewsCategory;
    region: string;
    status: "fulfilled" | "empty" | "rejected";
    count: number;
}

export interface YouTubeFetchResult {
    articles: YouTubeVideoArticle[];
    channelStatus: YouTubeChannelStatus[];
}

interface YouTubeChannel {
    name: string;
    channelId?: string;
    channelPath?: string;
    reliability: number;
    region: string;
    kategori: NewsCategory;
}

interface YtDlpEntry {
    id?: string;
    title?: string;
    description?: string;
    timestamp?: number;
    upload_date?: string;
}

export interface ScrapedVideo {
    videoId: string;
    title: string;
    description: string;
    publishedTimeText: string;
}

const YOUTUBE_CHANNELS: YouTubeChannel[] = [
    { name: "Al Jazeera English", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", reliability: 85, region: "QA", kategori: "conflict" },
    { name: "CNN", channelId: "UCupvZG-5ko_eiXAupbDfxWw", reliability: 88, region: "US", kategori: "conflict" },
    { name: "Fox News", channelId: "UCXIJgqnII2ZOINSWNOGFThA", reliability: 82, region: "US", kategori: "conflict" },
    { name: "Sky News", channelId: "UCoMdktPbSTixAyNGwb-UYkQ", reliability: 90, region: "GB", kategori: "conflict" },

    { name: "USGS", channelPath: "@USGS", reliability: 97, region: "US", kategori: "disaster" },
    { name: "NOAA", channelPath: "@NOAA", reliability: 96, region: "US", kategori: "disaster" },
    { name: "FEMA", channelPath: "@FEMA", reliability: 95, region: "US", kategori: "disaster" },
    { name: "Weather.com", channelPath: "@weather", reliability: 86, region: "US", kategori: "disaster" },
    { name: "AccuWeather", channelPath: "@accuweather", reliability: 88, region: "US", kategori: "disaster" },
    { name: "WeatherNation", channelPath: "@WeatherNation", reliability: 85, region: "US", kategori: "disaster" },
    { name: "LastQuake", channelPath: "@LastQuake", reliability: 93, region: "EU", kategori: "disaster" },
    { name: "UNDRR", channelPath: "@UNDRR", reliability: 92, region: "GLOBAL", kategori: "disaster" },
    { name: "ABC News", channelId: "UCBi2mrWuNuyYy4gbM6fU18Q", reliability: 92, region: "US", kategori: "disaster" },
    { name: "CNA", channelId: "UC83jt4dlz1Gjl58fzQrrKZg", reliability: 89, region: "SG", kategori: "disaster" },
    { name: "TRT World", channelId: "UC7fWeaHhqgM4Lba1lBcJGBg", reliability: 88, region: "TR", kategori: "disaster" },
    { name: "DW News", channelId: "UCknLrEdhRCp1aegoMqRaCZg", reliability: 85, region: "DE", kategori: "disaster" },

    { name: "WHO", channelId: "UC07-dOwgza1IguKA86jqxNA", reliability: 98, region: "GLOBAL", kategori: "health" },
    { name: "Global Health Media", channelId: "UCmKdSsyJ-yKSgkny56sNGSw", reliability: 90, region: "GLOBAL", kategori: "health" },
    { name: "CDC", channelId: "UCcGqKZ3B0b43_x8Ygf3tPnQ", reliability: 97, region: "US", kategori: "health" },

    { name: "WION", channelId: "UC_gUM8rL-Lrg6O3adPW9K1g", reliability: 82, region: "IN", kategori: "politics" },
    { name: "France 24 English", channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", reliability: 86, region: "FR", kategori: "politics" },
    { name: "United Nations", channelPath: "@UnitedNations", reliability: 96, region: "GLOBAL", kategori: "politics" },
    { name: "NATO", channelPath: "@NATO", reliability: 94, region: "EU", kategori: "politics" },
    { name: "UK Parliament", channelPath: "@ukparliament", reliability: 93, region: "GB", kategori: "politics" },
    { name: "European Parliament", channelPath: "@europeanparliament", reliability: 94, region: "EU", kategori: "politics" },

    { name: "CNBC", channelId: "UCvJJ_dzjViJCoLf5uKUTwoA", reliability: 90, region: "US", kategori: "economy" },
    { name: "Bloomberg Television", channelId: "UCIALMKvObZNtJ6AmdCLP7Lg", reliability: 92, region: "US", kategori: "economy" },
    { name: "Yahoo Finance", channelId: "UCEAZeUIeJs0IjQiqTCdVSIg", reliability: 85, region: "US", kategori: "economy" },

    { name: "BBC News", channelId: "UC16niRr50-MSBwiO3YDb3RA", reliability: 94, region: "GB", kategori: "general" },
    { name: "TechCrunch", channelPath: "@TechCrunch", reliability: 92, region: "US", kategori: "technology" },
    { name: "Engadget", channelPath: "@engadget", reliability: 90, region: "US", kategori: "technology" },
    { name: "MIT Technology Review", channelPath: "@technologyreview", reliability: 94, region: "US", kategori: "technology" },
    { name: "NASA", channelId: "UCtI0Hodo5o5dUb67FeUjDeA", channelPath: "@NASA", reliability: 98, region: "US", kategori: "science" },
    { name: "SciShow", channelId: "UCZYTClx2T1of7BRZ86-8fow", channelPath: "@SciShow", reliability: 90, region: "US", kategori: "science" },
    { name: "Veritasium", channelId: "UCHnyfMqiRRG1u-2MsSQLbXA", channelPath: "@veritasium", reliability: 91, region: "AU", kategori: "science" },
    { name: "PBS Space Time", channelPath: "@pbsspacetime", reliability: 90, region: "US", kategori: "science" },
    { name: "Science Channel", channelPath: "@ScienceChannel", reliability: 88, region: "US", kategori: "science" },
];

let ytDlpBinaryPromise: Promise<string | null> | null = null;

async function scrapeChannelVideos(channel: YouTubeChannel, maxItems: number): Promise<YouTubeVideoArticle[]> {
    const ytDlpVideos = await fetchChannelVideosViaYtDlp(channel, maxItems);
    if (ytDlpVideos.length > 0) {
        console.log(`[YouTube] ${channel.name}: ${ytDlpVideos.length} video (yt-dlp)`);
        return ytDlpVideos;
    }

    const rssVideos = await fetchChannelVideosViaRss(channel, maxItems);
    if (rssVideos.length > 0) {
        console.log(`[YouTube] ${channel.name}: ${rssVideos.length} video (RSS)`);
        return rssVideos;
    }

    return scrapeChannelVideosViaHtml(channel, maxItems);
}

async function fetchChannelVideosViaYtDlp(
    channel: YouTubeChannel,
    maxItems: number
): Promise<YouTubeVideoArticle[]> {
    const ytDlpBinary = await resolveYtDlpBinary();
    if (!ytDlpBinary) {
        return [];
    }

    try {
        const output = await execFileAsync(
            ytDlpBinary,
            [
                "--flat-playlist",
                "--dump-single-json",
                "--playlist-end",
                String(maxItems),
                getYouTubeVideosUrl(channel),
            ],
            20000
        );
        const payload = JSON.parse(output) as { entries?: YtDlpEntry[] };
        const entries = Array.isArray(payload.entries) ? payload.entries : [];

        return entries
            .filter((entry) => !!entry.id)
            .slice(0, maxItems)
            .map((entry) => ({
                videoId: entry.id as string,
                title: cleanHtmlEntities(entry.title || `${channel.name} Video`),
                description: cleanHtmlEntities(entry.description || entry.title || "").substring(0, 1000),
                publishedAt: normalizeYtDlpPublishedAt(entry),
                channelTitle: channel.name,
                thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
                link: `https://www.youtube.com/watch?v=${entry.id}`,
                reliability: channel.reliability,
                region: channel.region,
                kategori: channel.kategori,
            }));
    } catch (error) {
        console.warn(`[YouTube] ${channel.name} yt-dlp stratejisi basarisiz:`, error);
        return [];
    }
}

async function fetchChannelVideosViaRss(
    channel: YouTubeChannel,
    maxItems: number
): Promise<YouTubeVideoArticle[]> {
    try {
        const feedUrl = getYouTubeFeedUrl(channel);
        if (!feedUrl) {
            return [];
        }

        const response = await fetch(feedUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
            },
            signal: AbortSignal.timeout(12000),
        });

        if (!response.ok) {
            return [];
        }

        const xmlText = await response.text();
        return parseYouTubeFeed(xmlText, channel).slice(0, maxItems);
    } catch (error) {
        console.warn(`[YouTube] ${channel.name} RSS stratejisi basarisiz:`, error);
        return [];
    }
}

async function scrapeChannelVideosViaHtml(
    channel: YouTubeChannel,
    maxItems: number
): Promise<YouTubeVideoArticle[]> {
    try {
        const channelUrl = `${getYouTubeVideosUrl(channel)}?view=0&sort=dd&flow=grid`;
        const response = await fetch(channelUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml",
                "Cookie": "CONSENT=PENDING+987",
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            console.warn(`[YouTube] ${channel.name}: HTTP ${response.status}`);
            return [];
        }

        const html = await response.text();
        const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
        if (!dataMatch) {
            return simpleVideoIdScrape(html, channel, maxItems);
        }

        try {
            const ytData = JSON.parse(dataMatch[1]) as Record<string, unknown>;
            return extractVideosFromYtData(ytData, channel, maxItems);
        } catch {
            return simpleVideoIdScrape(html, channel, maxItems);
        }
    } catch (error) {
        console.warn(`[YouTube] ${channel.name} HTML stratejisi basarisiz:`, error);
        return [];
    }
}

function extractVideosFromYtData(
    ytData: Record<string, unknown>,
    channel: YouTubeChannel,
    maxItems: number
): YouTubeVideoArticle[] {
    const articles: YouTubeVideoArticle[] = [];

    try {
        const jsonStr = JSON.stringify(ytData);
        const videoRegex = /"videoId":"([^"]{11})"[^}]*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
        let match: RegExpExecArray | null;
        const seenIds = new Set<string>();

        while ((match = videoRegex.exec(jsonStr)) !== null && articles.length < maxItems) {
            const videoId = match[1];
            const title = match[2];

            if (seenIds.has(videoId)) continue;
            seenIds.add(videoId);

            const descriptionMatch = jsonStr.match(
                new RegExp(`"videoId":"${videoId}"[\\s\\S]{0,2000}?"descriptionSnippet":\\{"runs":\\[\\{"text":"([^"]*)"`),
            );
            const description = descriptionMatch?.[1] || title;

            articles.push({
                videoId,
                title: cleanHtmlEntities(title),
                description: cleanHtmlEntities(description).substring(0, 1000),
                publishedAt: new Date().toISOString(),
                channelTitle: channel.name,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                link: `https://www.youtube.com/watch?v=${videoId}`,
                reliability: channel.reliability,
                region: channel.region,
                kategori: channel.kategori,
            });
        }
    } catch {
        // noop
    }

    return articles;
}

function simpleVideoIdScrape(
    html: string,
    channel: YouTubeChannel,
    maxItems: number
): YouTubeVideoArticle[] {
    const articles: YouTubeVideoArticle[] = [];
    const seenIds = new Set<string>();
    const videoIdRegex = /"videoId":"([^"]{11})"/g;
    let videoIdMatch: RegExpExecArray | null;

    const titleMap = new Map<string, string>();
    const titleRegex = /"videoId":"([^"]{11})"[^}]*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
    let titleMatch: RegExpExecArray | null;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
        titleMap.set(titleMatch[1], titleMatch[2]);
    }

    const simpleTitleRegex = /"videoId":"([^"]{11})"[^}]*?"title":\{"simpleText":"([^"]+)"/g;
    while ((titleMatch = simpleTitleRegex.exec(html)) !== null) {
        if (!titleMap.has(titleMatch[1])) {
            titleMap.set(titleMatch[1], titleMatch[2]);
        }
    }

    while ((videoIdMatch = videoIdRegex.exec(html)) !== null) {
        if (articles.length >= maxItems) break;
        const videoId = videoIdMatch[1];
        if (seenIds.has(videoId)) continue;
        seenIds.add(videoId);

        const title = titleMap.get(videoId) || `${channel.name} Video`;
        articles.push({
            videoId,
            title: cleanHtmlEntities(title),
            description: cleanHtmlEntities(title).substring(0, 1000),
            publishedAt: new Date().toISOString(),
            channelTitle: channel.name,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            link: `https://www.youtube.com/watch?v=${videoId}`,
            reliability: channel.reliability,
            region: channel.region,
            kategori: channel.kategori,
        });
    }

    if (articles.length > 0) {
        console.log(`[YouTube] ${channel.name}: ${articles.length} video (HTML scrape)`);
    }

    return articles;
}

function parseYouTubeFeed(xmlText: string, channel: YouTubeChannel): YouTubeVideoArticle[] {
    const entries: YouTubeVideoArticle[] = [];
    const entryRegex = /<entry\b[\s\S]*?<\/entry>/gi;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(xmlText)) !== null) {
        const entryXml = match[0];
        const videoId = extractXmlTag(entryXml, "yt:videoId") || extractXmlTag(entryXml, "videoId");
        const title = extractXmlTag(entryXml, "title");
        const description = extractXmlTag(entryXml, "media:description") || extractXmlTag(entryXml, "description") || title;
        const publishedAt = extractXmlTag(entryXml, "published") || new Date().toISOString();

        if (!videoId || !title) {
            continue;
        }

        entries.push({
            videoId,
            title: cleanHtmlEntities(stripCdata(title)),
            description: cleanHtmlEntities(stripCdata(description || "")).substring(0, 1000),
            publishedAt,
            channelTitle: channel.name,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            link: `https://www.youtube.com/watch?v=${videoId}`,
            reliability: channel.reliability,
            region: channel.region,
            kategori: channel.kategori,
        });
    }

    return entries;
}

function extractXmlTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = regex.exec(xml);
    return match ? match[1].trim() : null;
}

function stripCdata(value: string): string {
    return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function cleanHtmlEntities(text: string): string {
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/\\u0026/g, "&")
        .replace(/\\"/g, '"');
}

export async function fetchYouTubeNews(maxPerChannel = 15): Promise<YouTubeVideoArticle[]> {
    const result = await fetchYouTubeNewsDetailed(maxPerChannel);
    return result.articles;
}

export async function fetchYouTubeNewsDetailed(maxPerChannel = 15): Promise<YouTubeFetchResult> {
    const allArticles: YouTubeVideoArticle[] = [];
    const channelStatus: YouTubeChannelStatus[] = [];

    const BATCH_SIZE = 3;
    const BATCH_DELAY_MS = 1000;

    for (let i = 0; i < YOUTUBE_CHANNELS.length; i += BATCH_SIZE) {
        const batch = YOUTUBE_CHANNELS.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map((channel) => scrapeChannelVideos(channel, maxPerChannel)));

        for (let batchIndex = 0; batchIndex < results.length; batchIndex++) {
            const result = results[batchIndex];
            const channel = batch[batchIndex];

            if (result.status === "fulfilled" && result.value.length > 0) {
                allArticles.push(...result.value);
                channelStatus.push({
                    name: channel.name,
                    kategori: channel.kategori,
                    region: channel.region,
                    status: "fulfilled",
                    count: result.value.length,
                });
                continue;
            }

            channelStatus.push({
                name: channel.name,
                kategori: channel.kategori,
                region: channel.region,
                status: result.status === "fulfilled" ? "empty" : "rejected",
                count: 0,
            });
        }

        if (i + BATCH_SIZE < YOUTUBE_CHANNELS.length) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
    }

    console.log(`[YouTube] Toplam ${allArticles.length} video cekildi (${YOUTUBE_CHANNELS.length} kanal)`);
    return { articles: allArticles, channelStatus };
}

export function getYouTubeChannelList() {
    return YOUTUBE_CHANNELS.map((channel) => ({
        name: channel.name,
        region: channel.region,
        kategori: channel.kategori,
        reliability: channel.reliability,
    }));
}

function getYouTubeVideosUrl(channel: YouTubeChannel): string {
    if (channel.channelPath) {
        return `https://www.youtube.com/${channel.channelPath}/videos`;
    }

    return `https://www.youtube.com/channel/${channel.channelId}/videos`;
}

function getYouTubeFeedUrl(channel: YouTubeChannel): string | null {
    if (!channel.channelId) {
        return null;
    }

    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
}

async function resolveYtDlpBinary(): Promise<string | null> {
    if (!ytDlpBinaryPromise) {
        ytDlpBinaryPromise = (async () => {
            for (const candidate of ["yt-dlp", "yt-dlp.exe"]) {
                try {
                    await execFileAsync(candidate, ["--version"], 5000);
                    return candidate;
                } catch {
                    // try next
                }
            }

            return null;
        })();
    }

    return ytDlpBinaryPromise;
}

function normalizeYtDlpPublishedAt(entry: YtDlpEntry): string {
    if (typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp)) {
        return new Date(entry.timestamp * 1000).toISOString();
    }

    if (entry.upload_date && /^\d{8}$/.test(entry.upload_date)) {
        const year = entry.upload_date.slice(0, 4);
        const month = entry.upload_date.slice(4, 6);
        const day = entry.upload_date.slice(6, 8);
        return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
    }

    return new Date().toISOString();
}

function execFileAsync(command: string, args: string[], timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile(
            command,
            args,
            {
                timeout: timeoutMs,
                windowsHide: true,
                maxBuffer: 4 * 1024 * 1024,
            },
            (error, stdout) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(stdout);
            }
        );
    });
}
