// WatcherG - Afet API endpoint'i
// NASA EONET uzerinden afet verilerini getirir.

import { NextResponse } from "next/server";
import { fetchNasaEvents } from "@/lib/apis/nasa";
import { formatEonetToPins } from "@/lib/formatter";
import { getCachedData, peekCachedData, setCachedData } from "@/lib/cacheUtils";

export const dynamic = "force-dynamic";

const CACHE_KEY = "nasa_disasters";
const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;

export async function GET(request: Request) {
    const url = new URL(request.url);
    const debugEnabled = url.searchParams.get("debug") === "1";
    const cacheSnapshot = peekCachedData(CACHE_KEY);
    const fetchedAt = new Date().toISOString();

    try {
        const cached = getCachedData(CACHE_KEY);
        if (cached) {
            return NextResponse.json({
                success: true,
                pins: cached,
                cached: true,
                stale: false,
                degraded: false,
                meta: {
                    source: "NASA EONET",
                    cache: {
                        key: CACHE_KEY,
                        hit: true,
                        stale: false,
                        ttlMs: CACHE_TTL_MS,
                        expiresAt: cacheSnapshot.expiry ? new Date(cacheSnapshot.expiry).toISOString() : null,
                    },
                    degraded: false,
                    fetchedAt,
                },
                ...(debugEnabled ? {
                    debug: {
                        timeoutMs: FETCH_TIMEOUT_MS,
                        hasStaleFallback: Boolean(cacheSnapshot.data),
                    },
                } : {}),
            });
        }

        const categoryIds = "volcanoes,seaLakeIce,snow,tempExtremes,manmade,landslides,floods,severeStorms,drought,iceberg";

        const events = await fetchNasaEvents(categoryIds, 30, {
            throwOnError: true,
            timeoutMs: FETCH_TIMEOUT_MS,
        });

        const pins = formatEonetToPins(events);

        setCachedData(CACHE_KEY, pins, CACHE_TTL_MS);

        return NextResponse.json({
            success: true,
            pins,
            cached: false,
            stale: false,
            degraded: false,
            meta: {
                source: "NASA EONET",
                cache: {
                    key: CACHE_KEY,
                    hit: false,
                    stale: false,
                    ttlMs: CACHE_TTL_MS,
                    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
                },
                degraded: false,
                fetchedAt,
            },
            ...(debugEnabled ? {
                debug: {
                    timeoutMs: FETCH_TIMEOUT_MS,
                    rawEventCount: events.length,
                    formattedPinCount: pins.length,
                    hasStaleFallback: Boolean(cacheSnapshot.data),
                },
            } : {}),
        });
    } catch (error: unknown) {
        console.error("API /disasters hatasi:", error);

        if (cacheSnapshot.data) {
            return NextResponse.json({
                success: true,
                pins: cacheSnapshot.data,
                cached: true,
                stale: cacheSnapshot.isExpired,
                degraded: true,
                error: error instanceof Error ? error.message : "NASA EONET verisi gecici olarak alinamadi",
                meta: {
                    source: "NASA EONET",
                    cache: {
                        key: CACHE_KEY,
                        hit: true,
                        stale: cacheSnapshot.isExpired,
                        ttlMs: CACHE_TTL_MS,
                        expiresAt: cacheSnapshot.expiry ? new Date(cacheSnapshot.expiry).toISOString() : null,
                    },
                    degraded: true,
                    fetchedAt,
                },
                ...(debugEnabled ? {
                    debug: {
                        timeoutMs: FETCH_TIMEOUT_MS,
                        fallbackReason: error instanceof Error ? error.message : "unknown",
                    },
                } : {}),
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Afet verileri alinamadi",
                degraded: false,
                meta: {
                    source: "NASA EONET",
                    cache: {
                        key: CACHE_KEY,
                        hit: false,
                        stale: false,
                        ttlMs: CACHE_TTL_MS,
                        expiresAt: null,
                    },
                    degraded: false,
                    fetchedAt,
                },
                ...(debugEnabled ? {
                    debug: {
                        timeoutMs: FETCH_TIMEOUT_MS,
                        hasStaleFallback: false,
                    },
                } : {}),
            },
            { status: 503 }
        );
    }
}
