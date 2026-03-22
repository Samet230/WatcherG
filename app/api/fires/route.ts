// WatcherG - Yangin API endpoint'i
// NASA FIRMS birincil kaynak, EONET fallback olarak kullanilir

import { NextResponse } from "next/server";
import { fetchNasaEvents } from "@/lib/apis/nasa";
import { fetchFirmsFireRecords } from "@/lib/apis/firms";
import { formatEonetToPins, formatFirmsToPins } from "@/lib/formatter";
import { getCachedData, setCachedData } from "@/lib/cacheUtils";
import type { Pin } from "@/types/pin";

export const dynamic = "force-dynamic";

const CACHE_KEY = "nasa_fires";
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_FIRMS_PINS = 500;

function sortByIntensityDesc(pins: Pin[]): Pin[] {
    return [...pins].sort((left, right) => {
        const leftScore = Number(left.etiketler?.find((item) => item.startsWith("frp:"))?.split(":")[1] || 0);
        const rightScore = Number(right.etiketler?.find((item) => item.startsWith("frp:"))?.split(":")[1] || 0);
        return rightScore - leftScore;
    });
}

export async function GET() {
    try {
        const cached = getCachedData(CACHE_KEY);
        if (cached) {
            return NextResponse.json({ success: true, pins: cached, source: "cache" });
        }

        const firmsKey = process.env.NASA_FIRMS_MAP_KEY;
        if (firmsKey) {
            try {
                const records = await fetchFirmsFireRecords(1);
                const firmsPins = formatFirmsToPins(records)
                    .map((pin, index) => ({
                        ...pin,
                        etiketler: [...(pin.etiketler || []), `frp:${records[index]?.frp ?? 0}`],
                    }));
                const rankedPins = sortByIntensityDesc(firmsPins).slice(0, MAX_FIRMS_PINS);

                if (rankedPins.length > 0) {
                    setCachedData(CACHE_KEY, rankedPins, CACHE_TTL_MS);
                    return NextResponse.json({ success: true, pins: rankedPins, source: "NASA FIRMS" });
                }
            } catch (firmsError) {
                console.warn("NASA FIRMS kullanilamadi, EONET fallback devrede:", firmsError);
            }
        }

        const events = await fetchNasaEvents("wildfires", 14);
        const pins = formatEonetToPins(events);

        setCachedData(CACHE_KEY, pins, CACHE_TTL_MS);

        return NextResponse.json({ success: true, pins, source: "NASA EONET" });
    } catch (e: unknown) {
        console.error("API /fires hatasi:", e);
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : "Yangin verileri alinamadi" },
            { status: 500 }
        );
    }
}
