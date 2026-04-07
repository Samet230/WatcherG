"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import {
    getCategoryItems,
    getCommandPanelMetrics,
    getFeedItems,
    getFeedStats,
    getRegionItems,
} from "@/lib/dashboardFeed";
import { translate, type AppLanguage } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";
import { useNewsTranslation } from "@/hooks/useNewsTranslation";
import TranslateToggleButton from "@/components/Translation/TranslateToggleButton";

export default function LeftSidebar() {
    const visiblePins = useMapStore((state) => state.visiblePins);
    const isFeedLoading = useMapStore((state) => state.isFeedLoading);
    const mobilePanelOpen = useMapStore((state) => state.mobilePanelOpen);
    const setMobilePanelOpen = useMapStore((state) => state.setMobilePanelOpen);
    const isFullscreen = useMapStore((state) => state.isFullscreen);
    const language = useLanguageStore((state) => state.language);

    const stats = getFeedStats(visiblePins);
    const metrics = getCommandPanelMetrics(visiblePins);
    const allPriorityItems = useMemo(
        () => getFeedItems(visiblePins, Math.max(visiblePins.length, 24), "priority"),
        [visiblePins]
    );
    const regions = getRegionItems(visiblePins, 5);
    const categories = getCategoryItems(visiblePins);
    const [displayLimit, setDisplayLimit] = useState(8);
    const updatesContainerRef = useRef<HTMLDivElement>(null);
    const updatesSentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDisplayLimit(8);
    }, [language, visiblePins]);

    useEffect(() => {
        const root = updatesContainerRef.current;
        const sentinel = updatesSentinelRef.current;
        if (!root || !sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry?.isIntersecting) return;

                setDisplayLimit((current) => {
                    if (current >= allPriorityItems.length) return current;
                    return Math.min(current + 8, allPriorityItems.length);
                });
            },
            {
                root,
                threshold: 0.2,
                rootMargin: "0px 0px 120px 0px",
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [allPriorityItems.length]);

    const items = allPriorityItems.slice(0, displayLimit);

    const mobileClass = mobilePanelOpen === "left"
        ? "flex absolute left-0 top-0 h-[100dvh] w-[90vw] max-w-[320px] z-50 shadow-[4px_0_24px_rgba(0,0,0,0.8)]"
        : "hidden md:flex";

    return (
        <div className={`${mobileClass} ${isFullscreen ? "md:hidden" : "md:w-64"} shrink-0 flex-col gap-3 border bg-black/95 backdrop-blur-md md:bg-black p-3 overflow-y-auto overflow-x-hidden custom-scrollbar dashboard-panel uppercase tracking-widest text-[9px] transition-transform duration-300 overscroll-y-contain pb-48 max-h-[100dvh]`}>
            <button
                className="md:hidden absolute top-3 right-3 text-gray-400 hover:text-white mt-1 mr-1 p-2 scale-150"
                onClick={() => setMobilePanelOpen(null)}
            >
                ✕
            </button>

            <div className="flex justify-between items-start mb-4 border-b pb-3 dashboard-panel pr-6">
                <div>
                    <div className="text-[#FF4444] font-bold mb-1 flex items-center gap-2">
                        <span className="animate-pulse">_</span>
                        {stats.critical} {translate(language, "critical")}
                    </div>
                    <div className="text-gray-500 opacity-80 mt-1">{`> ${translate(language, "total")}: ${stats.total}`}</div>
                    <div className="text-gray-500 opacity-80">{`> ${translate(language, "sources")}: ${stats.sources}`}</div>
                </div>
                <div className="text-right">
                    <div className="dashboard-text-accent font-bold mb-1 flex items-center justify-end gap-2">
                        <span className="opacity-50">+</span>
                        {stats.high} {translate(language, "high_priority")}
                    </div>
                    <div className="text-gray-500 opacity-80 mt-1">{`> ${translate(language, "peak")}: ${stats.peakHour}/H`}</div>
                    <div className="text-gray-500 opacity-80">{`> ${translate(language, "mapped")}: ${stats.mapped}`}</div>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="dashboard-text-accent mb-3 opacity-80">{`+ ${translate(language, "major_updates")}`}</h3>
                <div
                    ref={updatesContainerRef}
                    className="max-h-[270px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 space-y-4"
                >
                    {items.map((item) => (
                        <MajorUpdateItem key={item.id} item={item} language={language} />
                    ))}
                    {!isFeedLoading && items.length === 0 && (
                        <div className="text-gray-500 opacity-70 normal-case">
                            {translate(language, "no_live_records")}
                        </div>
                    )}
                    {items.length > 0 && items.length < allPriorityItems.length && (
                        <div
                            ref={updatesSentinelRef}
                            className="h-6 w-full flex items-center justify-center text-[8px] text-gray-500 opacity-60"
                        >
                            {"// MORE_UPDATES"}
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="dashboard-text-accent mb-3 opacity-80">{`+ ${translate(language, "affected_regions")}`}</h3>
                <div className="space-y-3 text-[9px]">
                    {regions.map((region) => (
                        <div key={`${region.code}-${region.name}`} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="opacity-80">{`[${region.code}] ${region.name}`}</span>
                                <span style={{ color: region.color }} className="font-bold">{region.value}</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 relative">
                                <div className="absolute top-0 left-0 h-full" style={{ width: `${region.pct}%`, backgroundColor: region.color }} />
                            </div>
                        </div>
                    ))}
                    {!isFeedLoading && regions.length === 0 && (
                        <div className="text-gray-500 opacity-70 normal-case">
                            {translate(language, "no_regions_yet")}
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="dashboard-text-accent mb-3 opacity-80">{`+ ${translate(language, "system_status")}`}</h3>
                <div className="space-y-1">
                    {categories.map((category) => (
                        <div key={category.key} className="flex items-center justify-between opacity-80">
                            <div className="flex items-center gap-2"><span style={{ color: category.color }}>_</span> {category.label}</div>
                            <div style={{ color: category.color }}>{category.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t dashboard-panel">
                <h3 className="dashboard-text-accent mb-2 opacity-80">{`+ ${translate(language, "activity_log")}`}</h3>
                <div className="border border-white/5 bg-black/50 p-2 space-y-2">
                    <div className="grid grid-cols-6 gap-1 h-16 items-end">
                        {metrics.buckets.map((bucket) => (
                            <div key={bucket.label} className="flex flex-col items-center gap-1">
                                <div className="w-full h-12 bg-white/[0.04] relative overflow-hidden border border-white/5">
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-[#00FF88]/80 shadow-[0_0_10px_rgba(0,255,136,0.25)]"
                                        style={{ height: `${bucket.pct}%` }}
                                    />
                                </div>
                                <span className="text-[8px] text-gray-500">{bucket.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                        <CommandMetricCard label="PEAK" value={`${metrics.peakLabel} · ${metrics.peakValue}`} />
                        <CommandMetricCard label="MAPPED" value={`${metrics.mappedRatio}%`} />
                        <CommandMetricCard label="DOMINANT" value={metrics.dominantCategory} />
                        <CommandMetricCard
                            label="SURGE"
                            value={`${metrics.surgePct >= 0 ? "+" : ""}${metrics.surgePct}%`}
                            valueClassName={metrics.surgePct >= 0 ? "text-[#00FF88]" : "text-[#FF4444]"}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between text-gray-500 opacity-60 mt-1">
                    <span>{`// CRIT:${metrics.critical} HIGH:${metrics.high}`}</span>
                    <span>{`PEAK_RATE:${stats.peakHour}/HR`}</span>
                </div>
            </div>
        </div>
    );
}

function MajorUpdateItem({
    item,
    language,
}: {
    item: ReturnType<typeof getFeedItems>[number];
    language: AppLanguage;
}) {
    const newsTranslation = useNewsTranslation({
        id: item.id,
        title: item.title,
        summary: item.title,
        targetLanguage: language,
    });

    return (
        <div
            className="leading-tight flex flex-col gap-1 border-l-2 pl-2 hover:bg-white/[0.03] transition-colors"
            style={{ borderColor: item.highlight }}
        >
            <div className="flex justify-between text-gray-500 opacity-70">
                <span>{`ID_${item.sourceCode}`}</span>
                <span>{item.timeLabel}</span>
            </div>
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: item.highlight }}
            >
                {`> ${newsTranslation.title}`}
            </a>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] text-gray-500 normal-case">{item.location}</span>
                <TranslateToggleButton
                    label={newsTranslation.translationLabel}
                    isTranslated={newsTranslation.isTranslated}
                    isLoading={newsTranslation.isLoading}
                    disabled={!newsTranslation.canTranslate}
                    onClick={newsTranslation.toggleTranslation}
                    compact
                />
            </div>
        </div>
    );
}

function CommandMetricCard({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="border border-white/5 bg-black/40 p-2">
            <div className="text-gray-500 opacity-70">{label}</div>
            <div className={valueClassName || "dashboard-text-accent"}>{value}</div>
        </div>
    );
}
