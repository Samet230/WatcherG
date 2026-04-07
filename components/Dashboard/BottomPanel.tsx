"use client";

import React from "react";
import { useMapStore } from "@/store/mapStore";
import type { AppLanguage } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";
import { translateAllCategoriesLabel, translateCategoryLabel } from "@/lib/i18n";
import { useNewsTranslation } from "@/hooks/useNewsTranslation";
import TranslateToggleButton from "@/components/Translation/TranslateToggleButton";
import type { NewsCategory } from "@/types/pin";
import { CATEGORY_CONFIG } from "@/types/pin";

export default function BottomPanel() {
    const mobilePanelOpen = useMapStore((state) => state.mobilePanelOpen);
    const setMobilePanelOpen = useMapStore((state) => state.setMobilePanelOpen);
    const isFullscreen = useMapStore((state) => state.isFullscreen);
    const language = useLanguageStore((state) => state.language);
    const [videoPins, setVideoPins] = React.useState<Array<{
        id: string;
        baslik: string;
        kaynak: string;
        gorsel?: string;
        detayUrl?: string;
        tarih: string;
        kategori: NewsCategory;
        renk: string;
    }>>([]);
    const [isVideoLoading, setIsVideoLoading] = React.useState(true);
    const [videoError, setVideoError] = React.useState<string | null>(null);

    // Kullanıcının her zaman görmek istediği sabit tüm etiketler
    const ALL_TABS: (NewsCategory | "all")[] = [
        "all", "conflict", "disaster", "health", "politics", "economy", "technology", "science", "general", "flight", "marine"
    ];

    const [activeVideoTab, setActiveVideoTab] = React.useState<string>("all");
    const [fullScreenVideoId, setFullScreenVideoId] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        const fetchVideoFeed = async () => {
            setIsVideoLoading(true);
            setVideoError(null);
            try {
                const response = await fetch("/api/videos");
                const payload = await response.json();
                if (!response.ok || !payload.success) {
                    throw new Error(payload.error || "Video akisi alinamadi");
                }
                if (!cancelled) {
                    setVideoPins(payload.data || []);
                }
            } catch (error: unknown) {
                if (!cancelled) {
                    setVideoPins([]);
                    setVideoError(error instanceof Error ? error.message : "Video akisi alinamadi");
                }
            } finally {
                if (!cancelled) {
                    setIsVideoLoading(false);
                }
            }
        };

        fetchVideoFeed();
        const interval = window.setInterval(fetchVideoFeed, 15 * 60 * 1000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    const filteredVideos = React.useMemo(() => {
        if (activeVideoTab === "all") return videoPins;
        return videoPins.filter((pin) => pin.kategori === activeVideoTab);
    }, [videoPins, activeVideoTab]);

    // Modal kontrolcüsü: ESC tuşuyla kapat
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFullScreenVideoId(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Eğer mobil panel "bottom" değilse, ekranda mobilde gizle
    const mobileClass = mobilePanelOpen === 'bottom'
        ? "flex absolute bottom-0 left-0 right-0 h-[50dvh] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.8)]"
        : "hidden md:flex";

    return (
        <>
            <div className={`${mobileClass} ${isFullscreen ? 'md:hidden' : 'md:h-52'} shrink-0 flex-col w-full tracking-widest uppercase text-[9px] bg-black/95 backdrop-blur-md md:bg-black/80 overflow-y-auto md:overflow-visible transition-transform duration-300 p-2 md:p-1`}>
                {/* Mobile Close Button */}
                <button
                    className="md:hidden absolute top-2 right-2 text-gray-400 hover:text-white p-2 scale-150 z-50 bg-black/50 rounded"
                    onClick={() => setMobilePanelOpen(null)}
                >
                    ✕
                </button>

                {/* YALNIZCA YOUTUBE VİDEO AKIŞI (TAM GENİŞLİK) */}
                <div className="flex-1 border bg-black p-2 flex flex-col overflow-hidden dashboard-panel shrink-0 h-full">

                    {/* Header ve Filter Tabları */}
                    <div className="flex items-center justify-between mb-2 border-b pb-2 dashboard-panel">
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 text-[11px] animate-pulse">▶</span>
                            <span className="dashboard-text-accent font-bold">WATCHER TV - GLOBAL FEED</span>
                            <span className="text-gray-500">{`${videoPins.length} LIVE VIDEOS`}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                            {ALL_TABS.map((tab) => {
                                const count = tab === "all" ? videoPins.length : videoPins.filter(p => p.kategori === tab).length;
                                const etiket = tab === "all" ? translateAllCategoriesLabel(language) : translateCategoryLabel(language, tab);
                                const renk = tab === "all" ? "#FFFFFF" : CATEGORY_CONFIG[tab]?.renk || "#888888";
                                const isActive = activeVideoTab === tab;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveVideoTab(tab)}
                                        className="px-2 py-0.5 text-[8px] border transition-all uppercase flex items-center gap-1 font-bold tracking-wider rounded-sm"
                                        style={{
                                            borderColor: isActive ? renk : `${renk}30`,
                                            backgroundColor: isActive ? `${renk}20` : "transparent",
                                            color: isActive ? renk : `${renk}80`,
                                        }}
                                    >
                                        {etiket}
                                        <span className="text-[6px] opacity-70">({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Video Kartları Grid - Wrapper eklenerek sıkışma engellendi */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {filteredVideos.map((pin) => (
                                <div key={pin.id} className="min-h-[140px] h-full">
                                    <VideoCard
                                        pin={pin}
                                        language={language}
                                        onPlay={(vId) => setFullScreenVideoId(vId)}
                                    />
                                </div>
                            ))}
                            {filteredVideos.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center text-gray-500 normal-case text-[10px] h-32 border border-white/5 bg-black/40">
                                    <span className="text-2xl mb-2 grayscale opacity-50">🎬</span>
                                    {isVideoLoading
                                        ? "Video akisi yukleniyor..."
                                        : videoError
                                            ? `Video akisi hatasi: ${videoError}`
                                            : videoPins.length === 0
                                                ? "Sistemde canli video haberi yok."
                                                : "Bu kategoride su an yayin yok"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* EKRANIN ORTASINDA AÇILAN TAM EKRAN (MODAL) VİDEO OYNATICI */}
            {fullScreenVideoId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden relative shadow-[0_0_50px_rgba(255,0,0,0.2)] border border-white/10">
                        {/* Kapat Butonu */}
                        <button
                            className="absolute z-10 top-4 right-6 text-white/50 hover:text-white bg-black/60 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110"
                            onClick={() => setFullScreenVideoId(null)}
                            title="Kapat (ESC)"
                        >
                            ✕
                        </button>
                        {/* Video İframe */}
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${fullScreenVideoId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

function VideoCard({
    pin,
    language,
    onPlay,
}: {
    pin: { id: string; baslik: string; kaynak: string; gorsel?: string; detayUrl?: string; tarih: string; kategori: NewsCategory; renk: string };
    language: AppLanguage;
    onPlay: (videoId: string) => void;
}) {
    const newsTranslation = useNewsTranslation({
        id: pin.id,
        title: pin.baslik,
        summary: pin.baslik,
        targetLanguage: language,
    });

    const videoId = pin.detayUrl?.match(/[?&]v=([^&]+)/)?.[1] || "";
    const thumbnailUrl = pin.gorsel || (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : "");

    return (
        <div className="group relative border border-white/10 bg-black/60 overflow-hidden hover:border-[#FF4444]/60 hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all flex flex-col h-full rounded shadow-md">
            {/* Thumbnail */}
            <div className="relative w-full aspect-video bg-[#0A0A0F] overflow-hidden cursor-pointer" onClick={() => onPlay(videoId)}>
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={pin.baslik}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <span className="text-2xl">▶</span>
                    </div>
                )}

                {/* Oynat İkonu (Tam Ekran Modal Tetikleyici) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-10 h-10 rounded-full bg-red-600 shadow-[0_0_15px_rgba(255,0,0,0.6)] flex items-center justify-center hover:scale-110 transition-transform">
                        <span className="text-white text-lg ml-0.5 pointer-events-none">▶</span>
                    </div>
                </div>

                {/* Kategori Rozeti */}
                <div
                    className="absolute top-1 left-1 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider border rounded bg-black/80 backdrop-blur-md shadow"
                    style={{
                        borderColor: `${pin.renk}50`,
                        color: pin.renk,
                    }}
                >
                    {translateCategoryLabel(language, pin.kategori)}
                </div>

                {/* YouTube Rozeti */}
                <div className="absolute top-1 right-1 px-1.5 py-0.5 text-[7px] bg-[#FF0000] text-white font-bold rounded shadow shadow-red-500/50">
                    YT / LIVE
                </div>
            </div>

            {/* Başlık & Bilgi */}
            <div className="p-2 flex-1 flex flex-col gap-1">
                <p className="text-[10px] text-white/95 normal-case leading-snug line-clamp-3 font-medium" title={pin.baslik}>
                    {newsTranslation.title}
                </p>
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/5">
                    <span className="text-[8px] text-gray-400 font-bold truncate max-w-[65%]" title={pin.kaynak}>{pin.kaynak}</span>
                    <TranslateToggleButton
                        label={newsTranslation.translationLabel}
                        isTranslated={newsTranslation.isTranslated}
                        isLoading={newsTranslation.isLoading}
                        disabled={!newsTranslation.canTranslate}
                        onClick={() => { newsTranslation.toggleTranslation(); }}
                        compact
                    />
                </div>
            </div>
        </div>
    );
}
