// WatcherG - Bildirim kontrol endpoint'i (Cron Job tarafindan tetiklenir)
// Vercel Cron: her 15 dakikada bir calisir
// Tum kullanicilarin watchlist bolgelerini tarar, yeni olaylar varsa bildirim olusturur

import { NextRequest, NextResponse } from "next/server";
import { createServiceServerClient } from "@/lib/db/server";

const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.warn("SUPABASE_SERVICE_ROLE_KEY tanimli degil, cron job atlaniyor");
            return NextResponse.json({
                success: true,
                message: "Service role key tanimli degil, bildirim kontrolu atlandi",
                notificationsCreated: 0,
            });
        }

        const supabase = createServiceServerClient();

        const { data: watchlistReports, error: watchlistError } = await supabase
            .from("user_watchlist")
            .select("user_id, region_type, region_code, region_name");

        if (watchlistError) {
            console.error("Watchlist sorgusu basarisiz:", watchlistError);
            return NextResponse.json({
                success: false,
                error: "Watchlist sorgusu basarisiz",
            });
        }

        if (!watchlistReports || watchlistReports.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Takip listesi bos, bildirim olusturulmadi",
                notificationsCreated: 0,
            });
        }

        const checkSince = new Date(Date.now() - 15 * 60 * 1000);
        const baseUrl = request.nextUrl.origin;
        const sourceResponses = await Promise.allSettled([
            fetch(`${baseUrl}/api/earthquakes`, { cache: "no-store" }).then((response) => response.json()),
            fetch(`${baseUrl}/api/fires`, { cache: "no-store" }).then((response) => response.json()),
            fetch(`${baseUrl}/api/disasters`, { cache: "no-store" }).then((response) => response.json()),
            fetch(`${baseUrl}/api/conflicts`, { cache: "no-store" }).then((response) => response.json()),
            fetch(`${baseUrl}/api/news`, { cache: "no-store" }).then((response) => response.json()),
        ]);

        const pins = sourceResponses.flatMap((result) => {
            if (result.status !== "fulfilled" || !result.value.success) {
                return [];
            }
            return result.value.data || result.value.pins || [];
        });

        let notificationsCreated = 0;

        for (const watchItem of watchlistReports) {
            const regionText = `${watchItem.region_name} ${watchItem.region_code}`.toLowerCase();
            const matchingPins = pins
                .filter((pin: { baslik: string; ozet: string; etiketler?: string[]; tarih: string }) => {
                    const pinDate = new Date(pin.tarih);
                    if (pinDate <= checkSince) return false;

                    const searchText = [pin.baslik, pin.ozet, ...(pin.etiketler || [])]
                        .join(" ")
                        .toLowerCase();

                    return regionText
                        .split(/\s+/)
                        .filter(Boolean)
                        .some((token) => token.length > 2 && searchText.includes(token));
                })
                .slice(0, 3);

            for (const pin of matchingPins) {
                const title = `${watchItem.region_name} - ${pin.baslik}`;
                const { data: existing } = await supabase
                    .from("user_notifications")
                    .select("id")
                    .eq("user_id", watchItem.user_id)
                    .eq("title", title)
                    .gte("created_at", checkSince.toISOString())
                    .limit(1);

                if (existing && existing.length > 0) {
                    continue;
                }

                const { error: insertError } = await supabase.from("user_notifications").insert({
                    user_id: watchItem.user_id,
                    title,
                    content: pin.ozet.slice(0, 160),
                    category: pin.kategori,
                    source: pin.kaynak,
                    is_read: false,
                });

                if (!insertError) {
                    notificationsCreated++;
                }
            }
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        const { data: deletedOld } = await supabase
            .from("user_notifications")
            .delete()
            .eq("is_read", true)
            .lt("created_at", cutoffDate.toISOString())
            .select("id");

        const cleanedCount = deletedOld?.length || 0;

        return NextResponse.json({
            success: true,
            message: `Cron calisti: ${watchlistReports.length} watchlist ogesi kontrol edildi`,
            notificationsCreated,
            oldNotificationsCleaned: cleanedCount,
            timestamp: new Date().toISOString(),
        });
    } catch (cronError) {
        console.error("Cron job hatasi:", cronError);
        return NextResponse.json(
            { success: false, error: "Bildirim kontrolu basarisiz" },
            { status: 500 }
        );
    }
}
