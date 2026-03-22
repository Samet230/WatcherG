import { NextResponse } from "next/server";
import { fetchNasaEvents } from "@/lib/apis/nasa";
import { formatEonetToPins } from "@/lib/formatter";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const events = await fetchNasaEvents("wildfires", 14);
        const pins = formatEonetToPins(events);

        return NextResponse.json({
            success: true,
            rawEventCount: events.length,
            formattedPinCount: pins.length,
            firstRawEventGeometry: events.length > 0 ? events[0].geometry : null,
            pins: pins
        });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" });
    }
}
