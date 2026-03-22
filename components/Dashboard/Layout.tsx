"use client";

import React from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import BottomPanel from "./BottomPanel";
import TopNav from "./TopNav";
import { useMapStore } from "@/store/mapStore";
import { getCategoryItems, getFeedStats } from "@/lib/dashboardFeed";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const activeTheme = useMapStore((state) => state.activeTheme);
    const isFullscreen = useMapStore((state) => state.isFullscreen);
    const allPins = useMapStore((state) => state.allPins);
    const visiblePins = useMapStore((state) => state.visiblePins);
    const themeClass = activeTheme !== "all" ? `theme-${activeTheme}` : "theme-general";
    const stats = getFeedStats(allPins);
    const categories = getCategoryItems(visiblePins);

    return (
        <div className={`w-screen h-screen flex flex-col overflow-hidden dashboard-theme-wrapper ${themeClass}`} style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
            {!isFullscreen && <TopNav />}

            <div className={`flex-1 flex overflow-hidden ${isFullscreen ? "p-0 gap-0" : "p-2 gap-2"}`}>
                {!isFullscreen && <LeftSidebar />}

                <div className="flex-1 flex flex-col gap-2 relative h-full min-w-0">
                    <div className={`flex-1 overflow-hidden relative ${isFullscreen ? "" : "border dashboard-panel"}`} style={{ backgroundColor: "transparent" }}>
                        {children}
                    </div>

                    {!isFullscreen && <BottomPanel />}
                </div>

                {!isFullscreen && <RightSidebar />}
            </div>

            {!isFullscreen && (
                <div className="h-6 shrink-0 border-t dashboard-panel flex items-center justify-between px-4 text-[10px] tracking-widest uppercase">
                    <div className="flex gap-4 opacity-70">
                        <span><span className="dashboard-text-accent">ALL</span> {stats.total}</span>
                        <span><span className="text-red-500">● BREAKING</span> {stats.critical}</span>
                        {categories.map((category) => (
                            <span key={category.key}><span style={{ color: category.color }}>● {category.key.toUpperCase()}</span> {category.value}</span>
                        ))}
                    </div>
                    <div className="flex gap-4 opacity-70">
                        <span className="text-red-500">{stats.critical + stats.high} URGENT</span>
                        <span>{stats.sources} SOURCES</span>
                        <span className="dashboard-text-accent">{stats.mapped} MAPPED</span>
                        <span>{visiblePins.length} VISIBLE</span>
                    </div>
                </div>
            )}
        </div>
    );
}
