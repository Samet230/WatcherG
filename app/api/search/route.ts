// WatcherG - Arama API endpoint'i
// Keyword matching, geo lookup ve skorlamali sonuc siralama

import { NextRequest, NextResponse } from "next/server";
import { analyzeSearchQuery } from "@/lib/search/keywords";
import { checkRateLimit } from "@/lib/rateLimit";
import {
    buildPinSearchText,
    doesTextContainToken,
    getGeoLookups,
    getMatchedCities,
    matchesCity,
    matchesCountry,
    normalizeText,
} from "@/lib/server/geo";
import type { Pin } from "@/types/pin";

export const dynamic = "force-dynamic";

let cachedPins: Pin[] = [];
let lastFetchTime = 0;

const CACHE_DURATION_MS = 3 * 60 * 1000;

async function getAllPins(baseUrl: string): Promise<Pin[]> {
    const now = Date.now();
    if (cachedPins.length > 0 && now - lastFetchTime < CACHE_DURATION_MS) {
        return cachedPins;
    }

    try {
        const responses = await Promise.allSettled([
            fetch(`${baseUrl}/api/earthquakes`).then((response) => response.json()),
            fetch(`${baseUrl}/api/fires`).then((response) => response.json()),
            fetch(`${baseUrl}/api/disasters`).then((response) => response.json()),
            fetch(`${baseUrl}/api/conflicts`).then((response) => response.json()),
            fetch(`${baseUrl}/api/news`).then((response) => response.json()),
        ]);

        const allPins: Pin[] = [];
        for (const response of responses) {
            if (response.status !== "fulfilled" || !response.value.success) {
                continue;
            }

            const payload = response.value.data || response.value.pins || [];
            allPins.push(...payload);
        }

        cachedPins = dedupePins(allPins);
        lastFetchTime = now;
        return cachedPins;
    } catch (fetchError: unknown) {
        console.error("Arama icin pin verisi cekilemedi:", fetchError);
        return cachedPins;
    }
}

function dedupePins(pins: Pin[]): Pin[] {
    const seen = new Set<string>();
    return pins.filter((pin) => {
        const key = `${pin.id}:${pin.tarih}`;
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function getRecencyScore(dateValue: string): number {
    const pinTime = new Date(dateValue).getTime();
    if (Number.isNaN(pinTime)) {
        return 0;
    }

    const hoursAgo = (Date.now() - pinTime) / (1000 * 60 * 60);
    if (hoursAgo <= 6) return 12;
    if (hoursAgo <= 24) return 8;
    if (hoursAgo <= 72) return 4;
    return 0;
}

function scorePin(
    pin: Pin,
    normalizedQuery: string,
    queryWords: string[],
    analysis: ReturnType<typeof analyzeSearchQuery>,
    geoLookups: Awaited<ReturnType<typeof getGeoLookups>>,
    matchedCities: ReturnType<typeof getMatchedCities>
): number {
    const searchableText = buildPinSearchText(pin);
    let score = getRecencyScore(pin.tarih);

    if (analysis.categories.includes(pin.kategori)) {
        score += 40;
    }

    if (normalizedQuery.length >= 3 && searchableText.includes(normalizedQuery)) {
        score += 35;
    }

    const matchedQueryWords = queryWords.filter((word) => doesTextContainToken(searchableText, word));
    score += matchedQueryWords.length * 8;

    if (analysis.countryCodes.some((countryCode) => matchesCountry(pin, countryCode, geoLookups))) {
        score += 30;
    }

    if (matchedCities.some((city) => matchesCity(pin, city))) {
        score += 30;
    }

    if (pin.konum) {
        const normalizedLocation = normalizeText(pin.konum);
        if (queryWords.some((word) => doesTextContainToken(normalizedLocation, word))) {
            score += 12;
        }
    }

    return score;
}

export async function GET(request: NextRequest) {
    const searchQuery = request.nextUrl.searchParams.get("q");
    if (!searchQuery || searchQuery.trim().length < 2) {
        return NextResponse.json({
            success: false,
            error: "Arama sorgusu en az 2 karakter olmalidir.",
        });
    }

    try {
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;
        const analysis = analyzeSearchQuery(searchQuery);
        const geoLookups = await getGeoLookups();

        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "anonymous";

        const rateLimitResult = checkRateLimit(clientIp);
        if (!rateLimitResult.allowed) {
            const cachedResults = await getAllPins(baseUrl);
            return NextResponse.json(
                {
                    success: true,
                    data: cachedResults,
                    meta: {
                        query: searchQuery,
                        totalResults: cachedResults.length,
                        analysis: {
                            categories: analysis.categories,
                            countryCodes: analysis.countryCodes,
                            scopeLevel: analysis.scopeLevel,
                            matchedKeywords: analysis.matchedKeywords,
                        },
                        rateLimitRemaining: rateLimitResult.remainingRequests,
                        fallback: "cache",
                    },
                    message: "Lutfen biraz bekleyin. Son bilinen veriler gosteriliyor.",
                    retryAfterMs: rateLimitResult.retryAfterMs,
                },
                {
                    headers: {
                        "Retry-After": String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
                        "X-RateLimit-Remaining": String(rateLimitResult.remainingRequests),
                    },
                }
            );
        }

        const allPins = await getAllPins(baseUrl);
        let filteredPins = allPins;
        const normalizedQuery = normalizeText(searchQuery);
        const queryWords = normalizedQuery
            .split(/\s+/)
            .filter((word) => word.length >= 2);
        const matchedCities = getMatchedCities(queryWords, geoLookups);

        if (analysis.categories.length > 0) {
            filteredPins = filteredPins.filter((pin) =>
                analysis.categories.includes(pin.kategori)
            );
        }

        if (analysis.countryCodes.length > 0) {
            filteredPins = filteredPins.filter((pin) =>
                analysis.countryCodes.some((countryCode) => matchesCountry(pin, countryCode, geoLookups))
            );
        }

        if (matchedCities.length > 0) {
            filteredPins = filteredPins.filter((pin) =>
                matchedCities.some((city) => matchesCity(pin, city))
            );
        }

        if (
            queryWords.length > 0 &&
            analysis.categories.length === 0 &&
            analysis.countryCodes.length === 0 &&
            matchedCities.length === 0
        ) {
            filteredPins = filteredPins.filter((pin) => {
                const searchableText = buildPinSearchText(pin);
                return queryWords.some((word) => doesTextContainToken(searchableText, word));
            });
        }

        filteredPins = [...filteredPins].sort((left, right) => {
            const rightScore = scorePin(right, normalizedQuery, queryWords, analysis, geoLookups, matchedCities);
            const leftScore = scorePin(left, normalizedQuery, queryWords, analysis, geoLookups, matchedCities);
            return rightScore - leftScore;
        });

        return NextResponse.json({
            success: true,
            data: filteredPins,
            meta: {
                query: searchQuery,
                totalResults: filteredPins.length,
                analysis: {
                    categories: analysis.categories,
                    countryCodes: analysis.countryCodes,
                    cityMatches: matchedCities.map((city) => city.name),
                    scopeLevel: analysis.scopeLevel,
                    matchedKeywords: analysis.matchedKeywords,
                },
                rateLimitRemaining: rateLimitResult.remainingRequests,
            },
        });
    } catch (searchError: unknown) {
        console.error("Arama hatasi:", searchError);
        return NextResponse.json({
            success: false,
            error: searchError instanceof Error ? searchError.message : "Arama sirasinda bir hata olustu.",
        });
    }
}
