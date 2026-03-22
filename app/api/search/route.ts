// WatcherG - Arama API endpoint'i
// Keyword matching ile pinleri filtreler ve dondurur

import { NextRequest, NextResponse } from "next/server";
import { analyzeSearchQuery } from "@/lib/search/keywords";
import { checkRateLimit } from "@/lib/rateLimit";
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

const COUNTRY_CENTERS: Record<string, { lat: number; lng: number; radius: number }> = {
    TR: { lat: 39.0, lng: 35.0, radius: 5 },
    US: { lat: 39.8, lng: -98.5, radius: 20 },
    GB: { lat: 55.3, lng: -3.4, radius: 5 },
    DE: { lat: 51.1, lng: 10.4, radius: 4 },
    FR: { lat: 46.6, lng: 2.2, radius: 5 },
    IT: { lat: 42.5, lng: 12.5, radius: 4 },
    JP: { lat: 36.2, lng: 138.2, radius: 5 },
    CN: { lat: 35.0, lng: 105.0, radius: 15 },
    RU: { lat: 55.7, lng: 37.6, radius: 20 },
    IN: { lat: 20.6, lng: 78.9, radius: 10 },
    BR: { lat: -14.2, lng: -51.9, radius: 15 },
    AU: { lat: -25.2, lng: 133.7, radius: 15 },
    GR: { lat: 39.0, lng: 21.8, radius: 3 },
    PK: { lat: 30.3, lng: 69.3, radius: 5 },
    IR: { lat: 32.4, lng: 53.6, radius: 5 },
    EG: { lat: 26.8, lng: 30.8, radius: 5 },
    MX: { lat: 23.6, lng: -102.5, radius: 8 },
};

function isWithinRadius(
    pinLat: number,
    pinLng: number,
    centerLat: number,
    centerLng: number,
    radius: number
): boolean {
    const latDiff = Math.abs(pinLat - centerLat);
    const lngDiff = Math.abs(pinLng - centerLng);
    return latDiff <= radius && lngDiff <= radius;
}

function dedupePins(pins: Pin[]): Pin[] {
    const seen = new Set<string>();
    return pins.filter((pin) => {
        const key = `${pin.id}:${pin.tarih}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
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

        if (analysis.categories.length > 0) {
            filteredPins = filteredPins.filter((pin) =>
                analysis.categories.includes(pin.kategori)
            );
        }

        if (analysis.countryCodes.length > 0) {
            filteredPins = filteredPins.filter((pin) => {
                return analysis.countryCodes.some((countryCode) => {
                    const center = COUNTRY_CENTERS[countryCode];
                    if (!center) return false;
                    return isWithinRadius(
                        pin.koordinat.lat,
                        pin.koordinat.lng,
                        center.lat,
                        center.lng,
                        center.radius
                    );
                });
            });
        }

        const queryWords = searchQuery
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length >= 2);

        if (
            queryWords.length > 0 &&
            analysis.categories.length === 0 &&
            analysis.countryCodes.length === 0
        ) {
            filteredPins = filteredPins.filter((pin) => {
                const searchableText = `${pin.baslik} ${pin.ozet}`.toLowerCase();
                return queryWords.some((word) => searchableText.includes(word));
            });
        }

        return NextResponse.json({
            success: true,
            data: filteredPins,
            meta: {
                query: searchQuery,
                totalResults: filteredPins.length,
                analysis: {
                    categories: analysis.categories,
                    countryCodes: analysis.countryCodes,
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
