"use client";

// WatcherG - Detay paneli
// Pine tiklayinca acilan bilgi paneli
// Haber event cluster icinde kaynaklar arasi gecis yapabilir

import { useEffect, useMemo, useState } from "react";
import type { NewsAlternativeSource, Pin } from "@/types/pin";
import PinDetail from "./PinDetail";
import { translate } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";

const CATEGORY_ICONS: Record<string, string> = {
    earthquake: "🔴",
    fire: "🔥",
    news: "📰",
    disaster: "🌊",
    conflict: "⚔️",
    health: "🏥",
    flight: "✈️",
    marine: "🚢",
};

interface DetailPanelProps {
    pin: Pin | null;
    onClose: () => void;
    allPins?: Pin[];
    relatedVideos?: Pin[];
    onNavigate?: (pin: Pin) => void;
    onStar?: (pin: Pin) => void;
    isStarred?: boolean;
}

export default function DetailPanel({
    pin,
    onClose,
    allPins = [],
    relatedVideos = [],
    onNavigate,
    onStar,
    isStarred = false,
}: DetailPanelProps) {
    const [activeSourceIndex, setActiveSourceIndex] = useState(0);
    const [isClosing, setIsClosing] = useState(false);
    const language = useLanguageStore((state) => state.language);

    useEffect(() => {
        setActiveSourceIndex(0);
        setIsClosing(false);
    }, [pin?.id]);
    const sourceEntries = useMemo(() => {
        if (!pin || pin.eventMeta?.type !== "news") {
            return [];
        }

        const primarySource: NewsAlternativeSource = {
            sourceName: pin.kaynak,
            url: pin.detayUrl,
            publishedAt: pin.tarih,
            title: pin.baslik,
            summary: pin.ozet,
            location: pin.konum,
            reliabilityScore: pin.kaynakSkoru,
            imageUrl: pin.gorsel,
        };

        return [primarySource, ...pin.eventMeta.alternativeSources];
    }, [pin]);

    if (!pin) return null;

    const handleClose = () => {
        setIsClosing(true);
        window.setTimeout(() => {
            onClose();
        }, 220);
    };

    const isSourceSwitchingEnabled = sourceEntries.length > 1;
    const activeSource = isSourceSwitchingEnabled
        ? sourceEntries[Math.min(activeSourceIndex, sourceEntries.length - 1)]
        : null;

    const displayPin: Pin = activeSource
        ? {
            ...pin,
            id: activeSourceIndex === 0 ? pin.id : `${pin.id}::source:${activeSourceIndex}`,
            baslik: activeSource.title || pin.baslik,
            ozet: activeSource.summary || pin.ozet,
            tarih: activeSource.publishedAt || pin.tarih,
            kaynak: activeSource.sourceName || pin.kaynak,
            kaynakSkoru: activeSource.reliabilityScore ?? pin.kaynakSkoru,
            detayUrl: activeSource.url || pin.detayUrl,
            konum: activeSource.location || pin.konum,
            gorsel: activeSource.imageUrl || pin.gorsel,
        }
        : pin;

    const sameCategoryPins = allPins.filter((item) => item.kategori === pin.kategori);
    const isNewsPin = pin.eventMeta?.type === "news";
    const currentIndex = sameCategoryPins.findIndex((item) => item.id === pin.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < sameCategoryPins.length - 1;
    const hasPreviousSource = activeSourceIndex > 0;
    const hasNextSource = activeSourceIndex < sourceEntries.length - 1;

    const goToPrevious = () => {
        if (isSourceSwitchingEnabled) {
            if (hasPreviousSource) {
                setActiveSourceIndex((current) => current - 1);
            }
            return;
        }

        if (isNewsPin) {
            return;
        }

        if (hasPrevious && onNavigate) {
            onNavigate(sameCategoryPins[currentIndex - 1]);
        }
    };

    const goToNext = () => {
        if (isSourceSwitchingEnabled) {
            if (hasNextSource) {
                setActiveSourceIndex((current) => current + 1);
            }
            return;
        }

        if (isNewsPin) {
            return;
        }

        if (hasNext && onNavigate) {
            onNavigate(sameCategoryPins[currentIndex + 1]);
        }
    };

    return (
        <div className={`absolute bottom-0 left-0 right-0 z-[60] md:bottom-4 md:left-auto md:right-3 md:top-28 md:w-[22rem] lg:top-32 lg:w-[23rem] xl:w-96 max-h-[70dvh] md:max-h-[calc(100dvh-9rem)] transition-transform duration-200 ease-out ${isClosing ? "translate-y-full md:translate-y-0 md:translate-x-full" : "translate-y-0 md:translate-x-0"}`}>
            <div className="overflow-hidden overflow-y-auto rounded-t-2xl border border-[#1E1E2E] bg-[#12121A]/95 shadow-2xl backdrop-blur-md md:flex md:h-full md:max-h-[calc(100dvh-5rem)] md:flex-col md:rounded-2xl">
                <div className="flex items-center justify-between border-b border-[#1E1E2E] px-4 py-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">
                            {CATEGORY_ICONS[displayPin.kategori] || "📌"}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-[#666680]">
                            {displayPin.kategori}
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 text-[#666680] transition-colors hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-4 py-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
                    <PinDetail pin={displayPin} relatedVideos={relatedVideos} />
                </div>

                <div className="space-y-2 border-t border-[#1E1E2E] px-4 py-3 shrink-0">
                    {isSourceSwitchingEnabled && activeSource && (
                        <div className="rounded-lg border border-[#1E1E2E] bg-[#0A0A0F]/60 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-[0.22em] text-[#666680]">
                                    {translate(language, "source_switch").toUpperCase()}
                                </span>
                                <span className="text-[11px] text-[#C8FEDA]">
                                    {activeSourceIndex + 1} / {sourceEntries.length}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                                <span className="truncate text-[#00FF88]">
                                    {activeSource.sourceName}
                                </span>
                                <span className="text-[#666680]">
                                    {formatSourceTime(activeSource.publishedAt, language)}
                                </span>
                            </div>
                        </div>
                    )}

                    {(isSourceSwitchingEnabled || (!isNewsPin && sameCategoryPins.length > 1)) && (
                        <div className="flex items-center justify-between">
                            <button
                                onClick={goToPrevious}
                                disabled={isSourceSwitchingEnabled ? !hasPreviousSource : !hasPrevious}
                                className={`rounded-lg px-3 py-1.5 text-xs transition-all ${isSourceSwitchingEnabled
                                    ? hasPreviousSource
                                        ? "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                        : "cursor-not-allowed bg-[#0A0A0F] text-[#333]"
                                    : hasPrevious
                                        ? "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                        : "cursor-not-allowed bg-[#0A0A0F] text-[#333]"
                                    }`}
                            >
                                ← {isSourceSwitchingEnabled ? translate(language, "source") : translate(language, "previous")}
                            </button>
                            <span className="text-xs text-[#666680]">
                                {isSourceSwitchingEnabled
                                    ? `${activeSourceIndex + 1} / ${sourceEntries.length}`
                                    : `${currentIndex + 1} / ${sameCategoryPins.length}`}
                            </span>
                            <button
                                onClick={goToNext}
                                disabled={isSourceSwitchingEnabled ? !hasNextSource : !hasNext}
                                className={`rounded-lg px-3 py-1.5 text-xs transition-all ${isSourceSwitchingEnabled
                                    ? hasNextSource
                                        ? "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                        : "cursor-not-allowed bg-[#0A0A0F] text-[#333]"
                                    : hasNext
                                        ? "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                        : "cursor-not-allowed bg-[#0A0A0F] text-[#333]"
                                    }`}
                            >
                                {isSourceSwitchingEnabled ? `${translate(language, "source")} →` : `${translate(language, "next")} →`}
                            </button>
                        </div>
                    )}

                    {isNewsPin && !isSourceSwitchingEnabled && (
                        <div className="rounded-lg border border-[#1E1E2E] bg-[#0A0A0F]/60 px-3 py-2 text-center text-[11px] tracking-[0.12em] text-[#666680]">
                            {translate(language, "no_alt_source").toUpperCase()}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {onStar && (
                            <button
                                onClick={() => onStar(pin)}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${isStarred
                                    ? "border border-[#FFAA00]/30 bg-[#FFAA00]/10 text-[#FFAA00]"
                                    : "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                    }`}
                            >
                                {isStarred ? `★ ${translate(language, "starred")}` : `☆ ${translate(language, "star_event")}`}
                            </button>
                        )}
                        <a
                            href={displayPin.detayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-lg bg-[#4488FF] px-3 py-2 text-center text-xs text-white transition-colors hover:bg-[#5599FF]"
                        >
                            🔗 {translate(language, "go_to_source")} ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatSourceTime(dateString: string, language: string = "tr"): string {
    const LOCALE_MAP: Record<string, string> = {
        tr: "tr-TR", en: "en-US", es: "es-ES", fr: "fr-FR",
        de: "de-DE", ar: "ar-SA", ru: "ru-RU",
    };
    const locale = LOCALE_MAP[language] || "tr-TR";
    try {
        return new Date(dateString).toLocaleString(locale, {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateString;
    }
}
