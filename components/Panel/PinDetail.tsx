"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pin } from "@/types/pin";
import { getReliabilityGroup } from "@/types/pin";
import { translate } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";
import type { AppLanguage, TranslationKey } from "@/lib/i18n";
import { useNewsTranslation } from "@/hooks/useNewsTranslation";
import TranslateToggleButton from "@/components/Translation/TranslateToggleButton";

interface PinDetailProps {
    pin: Pin;
    relatedVideos?: Pin[];
}

const RELIABILITY_CONFIG: Record<string, { color: string; labelKey: TranslationKey }> = {
    unreliable: { color: "#FF4444", labelKey: "unreliable" },
    suspicious: { color: "#FFAA00", labelKey: "suspicious" },
    reliable: { color: "#00FF88", labelKey: "reliable" },
    guaranteed: { color: "#44AAFF", labelKey: "official_source" },
};

const EARTHQUAKE_SEVERITY_CONFIG = {
    minor: { label: "MINOR", color: "#FFCC44" },
    moderate: { label: "MODERATE", color: "#FFAA00" },
    strong: { label: "STRONG", color: "#FF8800" },
    major: { label: "MAJOR", color: "#FF5500" },
    great: { label: "GREAT", color: "#FF2222" },
} as const;

export default function PinDetail({ pin, relatedVideos = [] }: PinDetailProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const language = useLanguageStore((state) => state.language);
    const newsTranslation = useNewsTranslation({
        id: pin.id,
        title: pin.baslik,
        summary: pin.ozet,
        content: pin.icerik,
        targetLanguage: language,
    });
    const reliabilityGroup = getReliabilityGroup(pin.kaynakSkoru);
    const config = RELIABILITY_CONFIG[reliabilityGroup];
    const relativeTime = getRelativeTime(pin.tarih, language);
    const earthquakeMeta = pin.eventMeta?.type === "earthquake" ? pin.eventMeta : null;
    const severityConfig = earthquakeMeta
        ? EARTHQUAKE_SEVERITY_CONFIG[earthquakeMeta.severity]
        : null;
    const fullText = useMemo(
        () => newsTranslation.content?.trim() || newsTranslation.summary,
        [newsTranslation.content, newsTranslation.summary]
    );
    const collapsedText = useMemo(() => {
        if (fullText.length <= 560) {
            return fullText;
        }

        return `${fullText.slice(0, 560).trimEnd()}...`;
    }, [fullText]);
    const shouldShowExpand = fullText.length > collapsedText.length;

    useEffect(() => {
        setIsExpanded(false);
    }, [pin.id]);

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold leading-snug text-white">
                {newsTranslation.title}
            </h3>

            <p className="text-xs leading-relaxed text-[#888]">
                {isExpanded ? fullText : collapsedText}
            </p>

            <div className="flex justify-end">
                <TranslateToggleButton
                    label={newsTranslation.translationLabel}
                    isTranslated={newsTranslation.isTranslated}
                    isLoading={newsTranslation.isLoading}
                    disabled={!newsTranslation.canTranslate}
                    onClick={newsTranslation.toggleTranslation}
                />
            </div>

            {shouldShowExpand && (
                <button
                    type="button"
                    onClick={() => setIsExpanded((current) => !current)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1E1E2E] bg-[#0A0A0F]/60 px-3 py-2 text-[11px] tracking-[0.18em] text-[#C8FEDA] transition-colors hover:border-[#00FF88]/25 hover:text-[#00FF88]"
                >
                    <span>{isExpanded ? "↑" : "↓"}</span>
                    <span>{isExpanded ? translate(language, "collapse_summary").toUpperCase() : translate(language, "expand_news").toUpperCase()}</span>
                </button>
            )}

            {/* YouTube Video Embed Player */}
            {pin.detayUrl?.includes("youtube.com/watch") && (() => {
                const ytVideoId = pin.detayUrl.match(/[?&]v=([^&]+)/)?.[1];
                return ytVideoId ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[#1E1E2E] bg-[#0A0A0F]">
                        <iframe
                            src={`https://www.youtube.com/embed/${ytVideoId}?rel=0&modestbranding=1`}
                            title={pin.baslik}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>
                ) : null;
            })()}

            {!pin.detayUrl?.includes("youtube.com/watch") && relatedVideos.length > 0 && (
                <div className="space-y-2 rounded-xl border border-[#1E1E2E] bg-[#0A0A0F]/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-[0.24em] text-[#666680]">
                            Related Video Feed
                        </span>
                        <span className="text-[10px] text-[#FF6666]">
                            {relatedVideos.length} video
                        </span>
                    </div>

                    {(() => {
                        const featuredVideo = relatedVideos[0];
                        const ytVideoId = featuredVideo.detayUrl?.match(/[?&]v=([^&]+)/)?.[1];
                        return ytVideoId ? (
                            <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-[#1E1E2E] bg-[#05070A]">
                                <iframe
                                    src={`https://www.youtube.com/embed/${ytVideoId}?rel=0&modestbranding=1`}
                                    title={featuredVideo.baslik}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 h-full w-full"
                                />
                            </div>
                        ) : null;
                    })()}

                    <div className="space-y-2">
                        {relatedVideos.slice(0, 3).map((video) => (
                            <a
                                key={video.id}
                                href={video.detayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg border border-[#1E1E2E] bg-[#05070A] px-3 py-2 transition-colors hover:border-[#FF4444]/40"
                            >
                                <div className="text-[10px] uppercase tracking-[0.18em] text-[#666680]">
                                    {video.kaynak}
                                </div>
                                <div className="mt-1 text-xs font-medium leading-5 text-[#E9FEEA]">
                                    {video.baslik}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {pin.konum && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1E1E2E] bg-[#0A0A0F]/60 px-3 py-2">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#666680]">
                        {translate(language, "location")}
                    </span>
                    <span className="text-right text-xs text-[#C8FEDA]">
                        {pin.konum}
                    </span>
                </div>
            )}

            {earthquakeMeta && severityConfig && (
                <div className="space-y-2 rounded-xl border border-[#FF8800]/20 bg-[#0A0A0F]/70 p-3 shadow-[0_0_18px_rgba(255,136,0,0.08)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.28em] text-[#666680]">
                            Seismic Telemetry
                        </span>
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.2em]"
                            style={{
                                color: severityConfig.color,
                                backgroundColor: `${severityConfig.color}18`,
                                border: `1px solid ${severityConfig.color}50`,
                            }}
                        >
                            {severityConfig.label}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <TelemetryCell
                            label="Magnitude"
                            value={earthquakeMeta.magnitude.toFixed(1)}
                            accent="#FF8800"
                        />
                        <TelemetryCell
                            label="Depth"
                            value={`${Math.round(earthquakeMeta.depthKm)} km`}
                            accent="#44AAFF"
                        />
                        <TelemetryCell
                            label="Alert"
                            value={earthquakeMeta.alertLevel ? earthquakeMeta.alertLevel.toUpperCase() : "NONE"}
                            accent={getAlertColor(earthquakeMeta.alertLevel)}
                        />
                        <TelemetryCell
                            label="Tsunami"
                            value={earthquakeMeta.tsunami ? "RISK" : "CLEAR"}
                            accent={earthquakeMeta.tsunami ? "#FF4444" : "#00FF88"}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1E1E2E] bg-[#05070A] px-3 py-2">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-[#666680]">
                            {translate(language, "event_time")}
                        </span>
                        <span className="text-right text-xs text-[#E0E0E0]">
                            {formatEventTime(earthquakeMeta.eventTime)}
                        </span>
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#666680]">{translate(language, "reliability")}</span>
                    <span
                        className="text-xs font-medium"
                        style={{ color: config.color }}
                    >
                        {translate(language, config.labelKey)} ({pin.kaynakSkoru}/100)
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E1E2E]">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${pin.kaynakSkoru}%`,
                            background: `linear-gradient(90deg, ${config.color}88, ${config.color})`,
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-[#0A0A0F]/50 px-3 py-2">
                <span className="text-xs font-medium text-[#00FF88]">
                    {pin.kaynak}
                </span>
                <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                        color: config.color,
                        backgroundColor: `${config.color}15`,
                        border: `1px solid ${config.color}40`,
                    }}
                >
                    {translate(language, "score")}: {pin.kaynakSkoru}
                </span>
            </div>

            {pin.alternatifKaynaklar.length > 0 && (
                <div className="space-y-1">
                    <span className="text-xs text-[#666680]">
                        {translate(language, "alt_sources")}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {pin.alternatifKaynaklar.map((source, index) => (
                            <span
                                key={index}
                                className="rounded bg-[#1E1E2E] px-2 py-0.5 text-xs text-[#888]"
                            >
                                {source}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-[#1E1E2E]/50 pt-1 text-xs text-[#666680]">
                <span>📅 {relativeTime}</span>
                <span>
                    📍 {pin.koordinat.lat.toFixed(2)}°, {pin.koordinat.lng.toFixed(2)}°
                </span>
            </div>
        </div>
    );
}

function TelemetryCell({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent: string;
}) {
    return (
        <div className="rounded-lg border border-[#1E1E2E] bg-[#05070A] px-3 py-2">
            <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[#666680]">
                {label}
            </div>
            <div
                className="text-sm font-semibold tracking-[0.08em]"
                style={{ color: accent }}
            >
                {value}
            </div>
        </div>
    );
}

function getAlertColor(alertLevel: "green" | "yellow" | "orange" | "red" | null): string {
    switch (alertLevel) {
        case "green":
            return "#00FF88";
        case "yellow":
            return "#FFD700";
        case "orange":
            return "#FF8800";
        case "red":
            return "#FF4444";
        default:
            return "#666680";
    }
}

function formatEventTime(dateString: string): string {
    try {
        return new Date(dateString).toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateString;
    }
}

function getRelativeTime(dateString: string, language: AppLanguage = "tr"): string {
    try {
        const eventDate = new Date(dateString);
        const now = new Date();
        const differenceInMs = now.getTime() - eventDate.getTime();
        const differenceInMinutes = Math.floor(differenceInMs / 60000);

        if (differenceInMinutes < 1) return translate(language, "time_just_now");
        if (differenceInMinutes < 60) return `${differenceInMinutes} ${translate(language, "time_minutes_ago")}`;

        const differenceInHours = Math.floor(differenceInMinutes / 60);
        if (differenceInHours < 24) return `${differenceInHours} ${translate(language, "time_hours_ago")}`;

        const differenceInDays = Math.floor(differenceInHours / 24);
        if (differenceInDays < 7) return `${differenceInDays} ${translate(language, "time_days_ago")}`;

        const localeMap: Record<string, string> = {
            tr: "tr-TR", en: "en-US", es: "es-ES",
            fr: "fr-FR", de: "de-DE", ar: "ar-SA", ru: "ru-RU"
        };
        return eventDate.toLocaleDateString(localeMap[language] || "tr-TR");
    } catch {
        return dateString;
    }
}
