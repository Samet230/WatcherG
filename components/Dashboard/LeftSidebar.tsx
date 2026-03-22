"use client";

import React from "react";
import { useMapStore } from "@/store/mapStore";
import { buildSparklinePath, getCategoryItems, getFeedItems, getFeedStats, getRegionItems } from "@/lib/dashboardFeed";

export default function LeftSidebar() {
    const visiblePins = useMapStore((state) => state.visiblePins);
    const isFeedLoading = useMapStore((state) => state.isFeedLoading);

    const stats = getFeedStats(visiblePins);
    const items = getFeedItems(visiblePins, 5, "priority");
    const regions = getRegionItems(visiblePins, 5);
    const categories = getCategoryItems(visiblePins);
    const sparklinePath = buildSparklinePath(visiblePins);

    return (
        <div className="w-64 shrink-0 flex flex-col gap-3 border bg-black p-3 overflow-y-auto overflow-x-hidden relative custom-scrollbar dashboard-panel uppercase tracking-widest text-[9px]">
            <div className="flex justify-between items-start mb-4 border-b pb-3 dashboard-panel">
                <div>
                    <div className="text-[#FF4444] font-bold mb-1 flex items-center gap-2">
                        <span className="animate-pulse">_</span>
                        {stats.critical} CRITICAL
                    </div>
                    <div className="text-gray-500 opacity-80 mt-1">{`> TOTAL: ${stats.total}`}</div>
                    <div className="text-gray-500 opacity-80">{`> SRC: ${stats.sources}`}</div>
                </div>
                <div className="text-right">
                    <div className="dashboard-text-accent font-bold mb-1 flex items-center justify-end gap-2">
                        <span className="opacity-50">+</span>
                        {stats.high} HIGH_PRIO
                    </div>
                    <div className="text-gray-500 opacity-80 mt-1">{`> PEAK: ${stats.peakHour}/H`}</div>
                    <div className="text-gray-500 opacity-80">{`> MAP: ${stats.mapped}`}</div>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="dashboard-text-accent mb-3 opacity-80">{`+ ÖNEMLİ GELİŞMELER`}</h3>
                <div className="space-y-4">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="leading-tight flex flex-col gap-1 border-l-2 pl-2 hover:bg-white/[0.03] transition-colors"
                            style={{ borderColor: item.highlight }}
                        >
                            <div className="flex justify-between text-gray-500 opacity-70">
                                <span>{`ID_${item.sourceCode}`}</span>
                                <span>{item.timeLabel}</span>
                            </div>
                            <span style={{ color: item.highlight }}>{`> ${item.title}`}</span>
                            <span className="text-[8px] text-gray-500 normal-case">{item.location}</span>
                        </a>
                    ))}
                    {!isFeedLoading && items.length === 0 && (
                        <div className="text-gray-500 opacity-70 normal-case">
                            Görüntülenecek canlı kayıt yok.
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="dashboard-text-accent mb-3 opacity-80">{`+ ETKİLENEN BÖLGELER`}</h3>
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
                            Bölge dağılımı henüz oluşmadı.
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="dashboard-text-accent mb-3 opacity-80">{`+ SYSTEM_STATUS`}</h3>
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
                <h3 className="dashboard-text-accent mb-2 opacity-80">{`+ 24H_ACTIVITY_LOG`}</h3>
                <div className="h-12 w-full relative pt-2 border border-white/5 bg-black/50">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-current dashboard-text-accent fill-none" strokeWidth="1">
                        <path d={sparklinePath} vectorEffect="non-scaling-stroke" />
                    </svg>
                </div>
                <div className="text-right text-gray-500 opacity-60 mt-1">{`// PEAK_RATE: ${stats.peakHour} EVT/HR`}</div>
            </div>
        </div>
    );
}
