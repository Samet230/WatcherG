"use client";

import React from "react";
import { useMapStore } from "@/store/mapStore";
import { getCategoryItems, getFeedItems, getSourceItems } from "@/lib/dashboardFeed";

export default function BottomPanel() {
    const activeTheme = useMapStore((state) => state.activeTheme);
    const visiblePins = useMapStore((state) => state.visiblePins);
    const timelineItems = getFeedItems(visiblePins, 3, "latest");
    const sourceItems = getSourceItems(visiblePins, 4);
    const categoryItems = getCategoryItems(visiblePins);

    return (
        <div className="h-48 shrink-0 flex gap-2 w-full tracking-widest uppercase text-[9px]">
            <div className="w-1/3 border bg-black relative overflow-hidden flex flex-col p-2 dashboard-panel">
                <div className="dashboard-text-accent mb-2 opacity-80">{`+ MEDIA_&_ARCHIVE`}</div>
                <div className="flex-1 bg-black border border-white/10 relative flex flex-col gap-2 p-3 dashboard-panel">
                    {timelineItems.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-white/10 p-2 hover:border-[#00FF41]/30 transition-colors"
                        >
                            <div className="flex items-center justify-between text-gray-500 mb-1">
                                <span>{item.source}</span>
                                <span>{item.timeLabel}</span>
                            </div>
                            <div className="font-bold normal-case" style={{ color: item.highlight }}>{item.title}</div>
                        </a>
                    ))}
                    {timelineItems.length === 0 && (
                        <div className="text-gray-500 normal-case">Zaman akışı için veri yok.</div>
                    )}
                </div>
            </div>

            <div className="flex-1 border bg-black p-2 flex flex-col overflow-hidden dashboard-panel">
                <div className="flex gap-4 mb-2 border-b pb-2 opacity-80 dashboard-panel">
                    <span className="text-white opacity-50">{`SOURCES`}</span>
                    <span className="dashboard-text-accent cursor-pointer border-b border-[#00FF41]">{`> ${activeTheme.toUpperCase()} FLOW`}</span>
                    <span className="text-gray-500">{`LIVE`}</span>
                </div>
                <div className="flex-1 flex gap-2">
                    {sourceItems.map((source) => (
                        <div key={source.name} className="flex-1 bg-black relative border border-white/10 overflow-hidden group hover:border-[#00FF41]/40 transition-colors p-3">
                            <div className="absolute top-2 left-2 flex items-center gap-2 z-10 drop-shadow-md font-bold" style={{ color: source.color }}>
                                <span className="animate-pulse">_</span> {`[${source.name}]`}
                            </div>
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] text-gray-400 z-10 drop-shadow-md bg-black/80 px-1 border border-white/10">
                                {`LAST: ${source.lastSeen}`}
                            </div>
                            <div className="absolute inset-0 border border-white/5 grid grid-cols-4 grid-rows-3 gap-[2px] opacity-20">
                                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="bg-white/5 group-hover:bg-white/10 transition" />)}
                            </div>
                            <div className="absolute bottom-0 w-full p-2 text-white/50 border-t border-white/10 bg-black/60">
                                {`> EVENTS: ${source.value}`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-64 rounded border border-[#00FF88]/20 bg-black/60 p-2 flex flex-col font-mono text-[10px]">
                <div className="flex gap-3 text-[#00FF88]/60 mb-2 border-b border-[#00FF88]/10 pb-1 justify-between">
                    <div className="flex gap-2">
                        <span className="text-[#00FF88]">● CATEGORIES</span>
                        <span className="text-white border-b border-white">ALL</span>
                        <span className="text-gray-500">Live</span>
                        <span className="text-gray-500">View</span>
                    </div>
                    <span className="cursor-pointer">↻</span>
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1 items-start content-start">
                    {categoryItems.slice(0, 4).map((category) => (
                        <div key={category.key} className="p-1 border border-white/5 bg-black/40 rounded">
                            <div className="flex justify-between text-gray-500 text-[8px] mb-1"><span>{category.label}</span><span>live</span></div>
                            <div className="text-[14px]" style={{ color: category.color }}>{category.value}</div>
                            <div className="text-[9px]" style={{ color: category.color }}>{`● ${category.key}`}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
