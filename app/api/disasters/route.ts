// WatcherG — Afet API endpoint'i
// NASA EONET üzerinden volkan (12), sel / fırtına / çığ (disaster) verilerini getirir

import { NextResponse } from "next/server";
import { fetchNasaEvents } from "@/lib/apis/nasa";
import { formatEonetToPins } from "@/lib/formatter";
import { getCachedData, setCachedData } from "@/lib/cacheUtils";

export const dynamic = "force-dynamic";

const CACHE_KEY = "nasa_disasters";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 dakika

export async function GET() {
    try {
        const cached = getCachedData(CACHE_KEY);
        if (cached) {
            return NextResponse.json({ success: true, pins: cached });
        }

        // NASA EONET kategorileri
        // 12: Volcanoes -> volcanoes
        // 15: Sea and Lake Ice -> seaLakeIce
        // 16: Earthquakes -> earthquakes
        // 17: Snow -> snow
        // 18: Temperature Extremes -> tempExtremes
        // 19: Manmade -> manmade
        const categoryIds = "volcanoes,seaLakeIce,snow,tempExtremes,manmade,landslides,floods,severeStorms,drought,iceberg";

        // Son 30 günlük afet verisi
        const events = await fetchNasaEvents(categoryIds, 30);

        const pins = formatEonetToPins(events);

        setCachedData(CACHE_KEY, pins, CACHE_TTL_MS);

        return NextResponse.json({ success: true, pins });
    } catch (e: unknown) {
        console.error("API /disasters hatası:", e);
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : "Afet verileri alınamadı" },
            { status: 500 }
        );
    }
}
