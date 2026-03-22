// WatcherG — Haber API endpoint'i
// Yedek kaynak zinciri: GDELT → Guardian → NewsData → Türkçe RSS

import { NextResponse } from "next/server";
import { fetchGdeltNews } from "@/lib/apis/gdelt";
import { fetchGuardianNews } from "@/lib/apis/guardian";
import { fetchNewsDataArticles } from "@/lib/apis/newsdata";
import { fetchTurkishNews } from "@/lib/apis/turkish_news";
import {
    formatGdeltToPins,
    formatGuardianToPins,
    formatNewsDataToPin,
    formatRssToPins,
} from "@/lib/formatter";
import { getFromCache, setToCache } from "@/lib/cache";
import type { Pin } from "@/types/pin";

export const dynamic = "force-dynamic";

const CACHE_KEY = "news_pins";
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 dakika

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

        const allPins: Pin[] = [];

        // Haber zinciri — GDELT birincil, ardından NewsData, Guardian ve RSS
        const [gdeltArticles, newsDataArticles, guardianArticles, turkishArticles] =
            await Promise.allSettled([
                fetchGdeltNews("", 40),
                fetchNewsDataArticles("crisis OR disaster OR conflict", "en", 20),
                fetchGuardianNews("crisis OR disaster OR conflict", 20),
                fetchTurkishNews(10),
            ]);

        // GDELT sonuçlarını ekle (birincil kaynak)
        if (gdeltArticles.status === "fulfilled" && gdeltArticles.value.length > 0) {
            allPins.push(...formatGdeltToPins(gdeltArticles.value));
        }

        // Guardian sonuçlarını ekle
        if (guardianArticles.status === "fulfilled" && guardianArticles.value.length > 0) {
            allPins.push(...formatGuardianToPins(guardianArticles.value));
        }

        if (newsDataArticles.status === "fulfilled" && newsDataArticles.value.length > 0) {
            allPins.push(
                ...newsDataArticles.value.map((article) => formatNewsDataToPin(article))
            );
        }

        // Türkçe RSS sonuçlarını ekle
        if (turkishArticles.status === "fulfilled" && turkishArticles.value.length > 0) {
            allPins.push(...formatRssToPins(turkishArticles.value));
        }

        const dedupedPins = Array.from(
            new Map(allPins.map((pin) => [pin.detayUrl || pin.id, pin])).values()
        ).sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());

        // Cache'e kaydet
        if (dedupedPins.length > 0) {
            setToCache(CACHE_KEY, dedupedPins, CACHE_TTL_MS);
        }

        return NextResponse.json({
            success: true,
            data: dedupedPins,
            cached: false,
            count: dedupedPins.length,
            sources: {
                gdelt: gdeltArticles.status === "fulfilled" ? gdeltArticles.value.length : 0,
                newsData: newsDataArticles.status === "fulfilled" ? newsDataArticles.value.length : 0,
                guardian: guardianArticles.status === "fulfilled" ? guardianArticles.value.length : 0,
                turkish: turkishArticles.status === "fulfilled" ? turkishArticles.value.length : 0,
            },
        });
    } catch (error: unknown) {
        console.error("Haber API hatası:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Haber verileri alınamadı", data: [] },
            { status: 500 }
        );
    }
}
