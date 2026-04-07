// WatcherG - Haber API endpoint'i
// Yedek kaynak zinciri: GDELT -> Guardian -> NewsData -> Turkce RSS

import { NextResponse } from "next/server";
import { fetchGdeltNews } from "@/lib/apis/gdelt";
import { fetchGuardianNews } from "@/lib/apis/guardian";
import { fetchNewsDataArticles } from "@/lib/apis/newsdata";
import { fetchTurkishNews } from "@/lib/apis/turkish_news";
import { fetchInternationalNews } from "@/lib/apis/international_news";
import { fetchHealthNews } from "@/lib/apis/health_news";
import { fetchTopicNews } from "@/lib/apis/topic_news";
import { fetchTechnologyNews } from "@/lib/apis/technology_news";
import { fetchScienceNews } from "@/lib/apis/science_news";
import { fetchReliefWebReports } from "@/lib/apis/reliefweb";
import {
    formatGdeltToPins,
    formatGuardianToPins,
    formatHealthArticlesToPins,
    formatNewsDataToPin,
    formatRssToPins,
    formatInternationalRssToPins,
    formatTopicArticlesToPins,
    formatTechnologyArticlesToPins,
    formatScienceArticlesToPins,
    formatReliefWebToPins,
} from "@/lib/formatter";
import { clusterNewsPins } from "@/lib/server/newsClustering";
import { getFromCache, setToCache } from "@/lib/cache";
import type { Pin } from "@/types/pin";
import { normalizeLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface NewsRoutePayload {
    data: Pin[];
    count: number;
    sources: {
        gdelt: number;
        newsData: number;
        guardian: number;
        turkish: number;
        international: number;
        healthOfficial: number;
        topicOfficial: number;
        technologyOfficial: number;
        scienceOfficial: number;
        reliefWeb: number;
        youtube: number;
    };
    meta: {
        clustered: boolean;
        rawCount: number;
        clusteredCount: number;
        mergedCount: number;
        multiSourceClusterCount: number;
        fetchedAt: string;
    };
}

const CACHE_TTL_MS = 20 * 60 * 1000;
const RELIEFWEB_NEWS_ENABLED = process.env.ENABLE_RELIEFWEB_NEWS === "true";
const TURKISH_SOURCES = ["bbc turkce", "trt haber", "euronews turkce"];
const TURKEY_KEYWORDS = [
    "turkiye",
    "ankara",
    "istanbul",
    "izmir",
    "tbmm",
    "aihm",
    "mahkeme",
    "danistay",
    "anayasa",
    "erdogan",
    "disisleri",
];
const STRATEGIC_KEYWORDS = [
    "deprem",
    "earthquake",
    "conflict",
    "war",
    "savas",
    "missile",
    "fuze",
    "flood",
    "sel",
    "yangin",
    "outbreak",
    "salgin",
    "pandemic",
    "technology",
    "tech",
    "science",
    "research",
    "ai",
    "chip",
    "quantum",
    "vaccine",
    "hospital",
    "medical",
    "health",
    "doctor",
    "patient",
    "disease",
    "infection",
    "who",
    "cdc",
    "ecdc",
    "election",
    "secim",
    "nato",
    "sanction",
    "yaptirim",
    "court",
    "mahkeme",
    "aihm",
    "economy",
    "ekonomi",
    "inflation",
    "enflasyon",
    "protest",
    "darbe",
    "kriz",
    "crisis",
];

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const debugMode = url.searchParams.get("debug") === "1";
        const preferredLanguage = normalizeLanguage(url.searchParams.get("lang"));
        const cacheKey = `news_pins_clustered_v5_${preferredLanguage}`;
        const buildClusterDebug = (pins: Pin[]) =>
            pins
                .filter((pin) => pin.eventMeta?.type === "news")
                .map((pin) => ({
                    title: pin.baslik,
                    clusterSize: pin.eventMeta?.type === "news" ? pin.eventMeta.clusterSize : 1,
                    sourceCount: pin.eventMeta?.type === "news" ? pin.eventMeta.sourceCount : 1,
                    sourceNames: pin.eventMeta?.type === "news" ? pin.eventMeta.sourceNames : [pin.kaynak],
                }))
                .filter((item) => item.clusterSize > 1 || item.sourceCount > 1)
                .slice(0, 5);

        const cachedPayload = getFromCache<NewsRoutePayload>(cacheKey);

        if (cachedPayload && !debugMode) {
            return NextResponse.json({
                success: true,
                ...cachedPayload,
                cached: true,
            });
        }

        const allPins: Pin[] = [];
        const [
            gdeltArticles,
            newsDataArticles,
            guardianArticles,
            turkishArticles,
            intlArticles,
            healthArticles,
            topicArticles,
            technologyArticles,
            scienceArticles,
            reliefWebArticles,
        ] = await Promise.allSettled([
            fetchGdeltNews("disaster OR conflict OR turkey OR health OR economy OR election OR politics OR technology OR science", 60),
            fetchNewsDataArticles(buildNewsQuery(preferredLanguage), preferredLanguage, 20),
            fetchGuardianNews("disaster OR conflict OR turkey", 20),
            preferredLanguage === "tr" ? fetchTurkishNews(15) : Promise.resolve([]),
            fetchInternationalNews(8),
            fetchHealthNews(20),
            fetchTopicNews(20),
            fetchTechnologyNews(18),
            fetchScienceNews(18),
            RELIEFWEB_NEWS_ENABLED ? fetchReliefWebReports(15) : Promise.resolve([]),
        ]);

        if (gdeltArticles.status === "fulfilled" && gdeltArticles.value.length > 0) {
            allPins.push(...formatGdeltToPins(gdeltArticles.value));
        }

        if (guardianArticles.status === "fulfilled" && guardianArticles.value.length > 0) {
            allPins.push(...formatGuardianToPins(guardianArticles.value));
        }

        if (newsDataArticles.status === "fulfilled" && newsDataArticles.value.length > 0) {
            allPins.push(...newsDataArticles.value.map((article) => formatNewsDataToPin(article)));
        }

        if (turkishArticles.status === "fulfilled" && turkishArticles.value.length > 0) {
            allPins.push(...formatRssToPins(turkishArticles.value));
        }

        if (intlArticles.status === "fulfilled" && intlArticles.value.length > 0) {
            allPins.push(...formatInternationalRssToPins(intlArticles.value));
        }

        if (healthArticles.status === "fulfilled" && healthArticles.value.length > 0) {
            allPins.push(...formatHealthArticlesToPins(healthArticles.value));
        }

        if (topicArticles.status === "fulfilled" && topicArticles.value.length > 0) {
            allPins.push(...formatTopicArticlesToPins(topicArticles.value));
        }

        if (technologyArticles.status === "fulfilled" && technologyArticles.value.length > 0) {
            allPins.push(...formatTechnologyArticlesToPins(technologyArticles.value));
        }

        if (scienceArticles.status === "fulfilled" && scienceArticles.value.length > 0) {
            allPins.push(...formatScienceArticlesToPins(scienceArticles.value));
        }

        if (reliefWebArticles.status === "fulfilled" && reliefWebArticles.value.length > 0) {
            allPins.push(...formatReliefWebToPins(reliefWebArticles.value));
        }

        const dedupedPins = Array.from(
            new Map(allPins.map((pin) => [pin.detayUrl || pin.id, pin])).values()
        ).sort((left, right) => new Date(right.tarih).getTime() - new Date(left.tarih).getTime());

        const filteredPins = filterRelevantNewsPins(dedupedPins, preferredLanguage);
        const clusteredResult = clusterNewsPins(filteredPins);
        const payload: NewsRoutePayload = {
            data: clusteredResult.pins,
            count: clusteredResult.pins.length,
            sources: {
                gdelt: gdeltArticles.status === "fulfilled" ? gdeltArticles.value.length : 0,
                newsData: newsDataArticles.status === "fulfilled" ? newsDataArticles.value.length : 0,
                guardian: guardianArticles.status === "fulfilled" ? guardianArticles.value.length : 0,
                turkish: turkishArticles.status === "fulfilled" ? turkishArticles.value.length : 0,
                international: intlArticles.status === "fulfilled" ? intlArticles.value.length : 0,
                healthOfficial: healthArticles.status === "fulfilled" ? healthArticles.value.length : 0,
                topicOfficial: topicArticles.status === "fulfilled" ? topicArticles.value.length : 0,
                technologyOfficial: technologyArticles.status === "fulfilled" ? technologyArticles.value.length : 0,
                scienceOfficial: scienceArticles.status === "fulfilled" ? scienceArticles.value.length : 0,
                reliefWeb: RELIEFWEB_NEWS_ENABLED && reliefWebArticles.status === "fulfilled" ? reliefWebArticles.value.length : 0,
                youtube: 0,
            },
            meta: {
                clustered: true,
                rawCount: clusteredResult.meta.rawCount,
                clusteredCount: clusteredResult.meta.clusteredCount,
                mergedCount: clusteredResult.meta.mergedCount,
                multiSourceClusterCount: clusteredResult.meta.multiSourceClusterCount,
                fetchedAt: new Date().toISOString(),
            },
        };

        if (payload.data.length > 0) {
            setToCache(cacheKey, payload, CACHE_TTL_MS);
        }

        return NextResponse.json({
            success: true,
            ...payload,
            cached: false,
            debug: debugMode
                ? {
                    providerStatus: {
                        gdelt: gdeltArticles.status,
                        newsData: newsDataArticles.status,
                        guardian: guardianArticles.status,
                        turkish: turkishArticles.status,
                        international: intlArticles.status,
                        healthOfficial: healthArticles.status,
                        topicOfficial: topicArticles.status,
                        technologyOfficial: technologyArticles.status,
                        scienceOfficial: scienceArticles.status,
                        reliefWeb: RELIEFWEB_NEWS_ENABLED ? reliefWebArticles.status : "disabled",
                        youtube: "separate-route",
                    },
                    clusterPreview: buildClusterDebug(payload.data),
                    filteredOutCount: Math.max(dedupedPins.length - filteredPins.length, 0),
                }
                : undefined,
        });
    } catch (error: unknown) {
        console.error("Haber API hatasi:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Haber verileri alinamadi",
                data: [],
            },
            { status: 500 }
        );
    }
}

function filterRelevantNewsPins(pins: Pin[], preferredLanguage: string): Pin[] {
    return pins
        .filter((pin) => {
            const searchableText = normalizeNewsText(
                `${pin.baslik} ${pin.ozet} ${pin.icerik || ""} ${pin.konum || ""} ${(pin.etiketler || []).join(" ")}`
            );
            const normalizedSource = normalizeNewsText(pin.kaynak);
            const isOfficialHealthSource =
                normalizedSource.includes("cdc")
                || normalizedSource.includes("ecdc")
                || normalizedSource.includes("who");
            const isOfficialTopicSource =
                normalizedSource.includes("turkiye mfa")
                || normalizedSource.includes("tcmb")
                || normalizedSource.includes("bbc politics")
                || normalizedSource.includes("bbc business")
                || normalizedSource.includes("guardian");
            const isOfficialTechnologySource =
                normalizedSource.includes("techcrunch")
                || normalizedSource.includes("engadget")
                || normalizedSource.includes("ars technica")
                || normalizedSource.includes("verge")
                || normalizedSource.includes("cnet");
            const isOfficialScienceSource =
                normalizedSource.includes("sciencedaily")
                || normalizedSource.includes("phys.org")
                || normalizedSource.includes("nature")
                || normalizedSource.includes("new scientist");
            const isTurkishSource = TURKISH_SOURCES.some((source) => normalizedSource.includes(source));
            const isTurkeyFocused = TURKEY_KEYWORDS.some((keyword) => searchableText.includes(keyword));
            const hasStrategicSignal = STRATEGIC_KEYWORDS.some((keyword) => searchableText.includes(keyword));
            const isCriticalCategory = ["conflict", "disaster"].includes(pin.kategori);
            const isContextualCategory = ["politics", "economy"].includes(pin.kategori);
            const hasHighReliability = pin.kaynakSkoru >= 88;
            const hasGoodReliability = pin.kaynakSkoru >= 80;
            const hasSpecificLocation = Boolean(pin.konum && pin.konum.trim() && pin.konum !== "Global");
            const isFresh = getHoursAgo(pin.tarih) <= 18;
            const isPreferredLanguageSource = preferredLanguage === "tr" ? isTurkishSource : true;

            if (pin.kategori === "health") {
                return (
                    isOfficialHealthSource
                    || (hasStrategicSignal && hasHighReliability)
                    || (hasGoodReliability && hasSpecificLocation && isFresh)
                );
            }

            if (pin.kategori === "politics") {
                return (
                    isOfficialTopicSource
                    || (hasStrategicSignal && hasHighReliability)
                    || (hasGoodReliability && (hasSpecificLocation || isTurkeyFocused) && isFresh)
                );
            }

            if (pin.kategori === "economy") {
                return (
                    isOfficialTopicSource
                    || (hasStrategicSignal && hasHighReliability)
                    || (hasGoodReliability && (hasSpecificLocation || isTurkeyFocused) && isFresh)
                );
            }

            if (pin.kategori === "technology") {
                return (
                    isOfficialTechnologySource
                    || (hasStrategicSignal && hasHighReliability)
                    || (hasGoodReliability && hasSpecificLocation && isFresh)
                );
            }

            if (pin.kategori === "science") {
                return (
                    isOfficialScienceSource
                    || (hasStrategicSignal && hasHighReliability)
                    || (hasGoodReliability && hasSpecificLocation && isFresh)
                );
            }

            if (isTurkishSource || isTurkeyFocused) {
                return true;
            }

            if (isCriticalCategory) {
                return (
                    (isPreferredLanguageSource && (hasStrategicSignal || hasHighReliability))
                    || (!isPreferredLanguageSource && hasStrategicSignal && hasGoodReliability && hasSpecificLocation)
                );
            }

            if (isContextualCategory) {
                return (
                    (isPreferredLanguageSource && hasStrategicSignal && hasGoodReliability)
                    || (!isPreferredLanguageSource && hasStrategicSignal && hasHighReliability && isFresh)
                );
            }

            if (pin.kategori !== "general") {
                return (
                    (isPreferredLanguageSource && hasGoodReliability)
                    || (!isPreferredLanguageSource && hasHighReliability && hasSpecificLocation)
                );
            }

            return (
                (isPreferredLanguageSource && hasHighReliability && !hasStrategicSignal)
                || (!isPreferredLanguageSource && hasHighReliability && isFresh && !hasStrategicSignal && hasSpecificLocation)
            );
        })
        .sort((left, right) => getNewsPriorityScore(right) - getNewsPriorityScore(left));
}

function getNewsPriorityScore(pin: Pin): number {
    const searchableText = normalizeNewsText(
        `${pin.baslik} ${pin.ozet} ${pin.icerik || ""} ${pin.konum || ""}`
    );
    const normalizedSource = normalizeNewsText(pin.kaynak);
    const isTurkishSource = TURKISH_SOURCES.some((source) => normalizedSource.includes(source));
    const isOfficialHealthSource =
        normalizedSource.includes("cdc")
        || normalizedSource.includes("ecdc")
        || normalizedSource.includes("who");
    const turkeyBoost = TURKEY_KEYWORDS.some((keyword) => searchableText.includes(keyword))
        ? 16
        : 0;
    const categoryBoost =
        pin.kategori === "conflict" || pin.kategori === "disaster"
            ? 18
                : pin.kategori === "health"
                    ? 16
                    : pin.kategori === "politics" || pin.kategori === "economy"
                        ? 10
                        : pin.kategori === "technology" || pin.kategori === "science"
                            ? 9
                    : 0;
    const sourceBoost = isTurkishSource ? 18 : isOfficialHealthSource ? 16 : 0;
    const reliabilityBoost = pin.kaynakSkoru / 10;
    const strategicBoost = STRATEGIC_KEYWORDS.some((keyword) => searchableText.includes(keyword))
        ? 12
        : 0;
    const recencyBoost = Math.max(0, 18 - getHoursAgo(pin.tarih));

    return sourceBoost + turkeyBoost + categoryBoost + strategicBoost + reliabilityBoost + recencyBoost;
}

function getHoursAgo(dateString: string): number {
    const timestamp = new Date(dateString).getTime();
    if (!Number.isFinite(timestamp)) {
        return 24;
    }

    return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));
}

function normalizeNewsText(value: string): string {
    return value
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ı/g, "i")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function buildNewsQuery(language: string): string {
    if (language === "tr") {
        return "deprem OR afet OR catisma OR secim OR mahkeme OR teknoloji OR bilim OR Turkiye OR Ankara OR Istanbul";
    }

    if (language === "ar") {
        return "conflict OR war OR earthquake OR disaster OR outbreak OR election OR court OR technology OR science";
    }

    if (language === "ru") {
        return "conflict OR war OR earthquake OR disaster OR election OR crisis OR technology OR science";
    }

    return "conflict OR war OR earthquake OR disaster OR outbreak OR election OR court OR technology OR science OR Turkey OR Ankara OR Istanbul";
}
