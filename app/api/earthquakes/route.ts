// WatcherG - Deprem API endpoint'i
// USGS verilerini cache'li olarak istemciye sunar.

import { NextResponse } from "next/server";
import { fetchEarthquakes } from "@/lib/apis/usgs";
import { formatEarthquakesToPins } from "@/lib/formatter";
import { getFromCache, peekCache, setToCache } from "@/lib/cache";
import type { Pin } from "@/types/pin";

export const dynamic = "force-dynamic";

const CACHE_KEY = "earthquakes_pins";
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;

export async function GET(request: Request) {
    const url = new URL(request.url);
    const debugEnabled = url.searchParams.get("debug") === "1";
    const cacheSnapshot = peekCache<Pin[]>(CACHE_KEY);
    const fetchedAt = new Date().toISOString();

    try {
        const cachedPins = getFromCache<Pin[]>(CACHE_KEY);
        if (cachedPins) {
            return NextResponse.json({
                success: true,
                data: cachedPins,
                cached: true,
                stale: false,
                degraded: false,
                count: cachedPins.length,
                meta: {
                    source: "USGS",
                    cache: {
                        key: CACHE_KEY,
                        hit: true,
                        stale: false,
                        ttlMs: CACHE_TTL_MS,
                        expiresAt: cacheSnapshot.expireAt ? new Date(cacheSnapshot.expireAt).toISOString() : null,
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

        const rawFeatures = await fetchEarthquakes(24, 2.5, {
            throwOnError: true,
            timeoutMs: FETCH_TIMEOUT_MS,
        });

        const pins = formatEarthquakesToPins(rawFeatures);

        setToCache(CACHE_KEY, pins, CACHE_TTL_MS);

        return NextResponse.json({
            success: true,
            data: pins,
            cached: false,
            stale: false,
            degraded: false,
            count: pins.length,
            meta: {
                source: "USGS",
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
                    rawFeatureCount: rawFeatures.length,
                    hasStaleFallback: Boolean(cacheSnapshot.data),
                },
            } : {}),
        });
    } catch (error: unknown) {
        console.error("Deprem API hatasi:", error);

        if (cacheSnapshot.data) {
            return NextResponse.json({
                success: true,
                data: cacheSnapshot.data,
                cached: true,
                stale: cacheSnapshot.isExpired,
                degraded: true,
                count: cacheSnapshot.data.length,
                error: error instanceof Error ? error.message : "USGS verisi gecici olarak alinamadi",
                meta: {
                    source: "USGS",
                    cache: {
                        key: CACHE_KEY,
                        hit: true,
                        stale: cacheSnapshot.isExpired,
                        ttlMs: CACHE_TTL_MS,
                        expiresAt: cacheSnapshot.expireAt ? new Date(cacheSnapshot.expireAt).toISOString() : null,
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
                error: error instanceof Error ? error.message : "Deprem verileri alinamadi",
                data: [],
                degraded: false,
                meta: {
                    source: "USGS",
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
