// WatcherG — Deprem API endpoint'i
// USGS verilerini cache'li olarak istemciye sunar — son 24 saat

import { NextResponse } from "next/server";
import { fetchEarthquakes } from "@/lib/apis/usgs";
import { formatEarthquakesToPins } from "@/lib/formatter";
import { getFromCache, setToCache } from "@/lib/cache";
import type { Pin } from "@/types/pin";

export const dynamic = "force-dynamic";

const CACHE_KEY = "earthquakes_pins";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 dakika

export async function GET() {
    try {
        // Önce cache'e bak
        const cachedPins = getFromCache<Pin[]>(CACHE_KEY);
        if (cachedPins) {
            return NextResponse.json({
                success: true,
                data: cachedPins,
                cached: true,
                count: cachedPins.length,
            });
        }

        // Cache'de yoksa USGS'den son 24 saati çek
        const rawFeatures = await fetchEarthquakes(24, 2.5);

        if (rawFeatures.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                cached: false,
                count: 0,
            });
        }

        // Standart pin formatına çevir
        const pins = formatEarthquakesToPins(rawFeatures);

        // Cache'e kaydet
        setToCache(CACHE_KEY, pins, CACHE_TTL_MS);

        return NextResponse.json({
            success: true,
            data: pins,
            cached: false,
            count: pins.length,
        });
    } catch (error: unknown) {
        console.error("Deprem API hatası:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Deprem verileri alınamadı",
                data: [],
            },
            { status: 500 }
        );
    }
}
