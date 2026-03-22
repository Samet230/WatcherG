"use client";

import React from "react";
import { useMapStore } from "@/store/mapStore";
import { formatSyncLabel, getFeedItems } from "@/lib/dashboardFeed";

export default function RightSidebar() {
    const activeTheme = useMapStore((state) => state.activeTheme);
    const visiblePins = useMapStore((state) => state.visiblePins);
    const lastUpdated = useMapStore((state) => state.lastUpdated);
    const feedItems = getFeedItems(visiblePins, 8, "latest");

    return (
        <div className="w-80 shrink-0 flex flex-col border p-3 relative overflow-hidden bg-black dashboard-panel tracking-widest uppercase text-[9px]">
            <div className="flex justify-between items-center mb-4 border-b pb-3 dashboard-panel">
                <div className="flex items-center gap-2">
                    <span className="dashboard-text-accent opacity-80">{`+ LIVE_FEED`}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 opacity-80">
                    <span className="border border-white/20 px-1">24H</span>
                    <span className="border border-white/20 px-1">{activeTheme === "all" ? "ALL" : activeTheme.toUpperCase()}</span>
                    <span className="dashboard-text-accent ml-2">{`${visiblePins.length}_EVT`}</span>
                </div>
            </div>

            <div className="text-gray-500 mb-3 opacity-60 flex items-center gap-2">
                <span className="animate-pulse">_</span> {`LAST_SYNC: ${formatSyncLabel(lastUpdated)}`}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                {feedItems.map((item) => (
                    <div key={item.id} className="border bg-black p-2 relative transition-colors group" style={{ borderColor: `${item.highlight}40` }}>
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: `${item.highlight}60` }} />

                        <div className="flex justify-between mb-2 pl-2">
                            <div className="flex items-center gap-1 opacity-70">
                                <span className="border border-white/20 px-1 text-[8px]">
                                    {item.sourceCode}
                                </span>
                                {item.source}
                            </div>
                            <span className="text-gray-500 opacity-70">{item.timeLabel}</span>
                        </div>

                        <div className="font-bold mb-2 flex items-center gap-2 pl-2" style={{ color: item.highlight }}>
                            <span className="w-1.5 h-1.5" style={{ backgroundColor: item.highlight }} />
                            {item.categoryLabel} UPDATE
                        </div>

                        <p className="leading-tight text-white/90 mb-3 pl-2 normal-case font-mono">
                            {item.title}
                        </p>

                        <div className="flex justify-between text-gray-500 mt-2 border-t border-white/10 pt-2 pl-2 opacity-70 gap-3">
                            <span className="truncate">{`LOC: ${item.location}`}</span>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors shrink-0"
                                style={{ color: item.highlight }}
                            >
                                {`> OPEN_SOURCE`}
                            </a>
                        </div>
                    </div>
                ))}

                {feedItems.length === 0 && (
                    <div className="border border-white/10 bg-black p-3 text-gray-500 opacity-70 normal-case">
                        Canlı akış için veri bekleniyor.
                    </div>
                )}
            </div>
        </div>
    );
}
