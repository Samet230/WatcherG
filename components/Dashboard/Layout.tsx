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
    const mobilePanelOpen = useMapStore((state) => state.mobilePanelOpen);
    const setMobilePanelOpen = useMapStore((state) => state.setMobilePanelOpen);
    const themeClass = activeTheme !== "all" ? `theme-${activeTheme}` : "theme-general";
    const stats = getFeedStats(allPins);
    const categories = getCategoryItems(visiblePins);

    return (
        <div className={`w-screen h-[100dvh] flex flex-col overflow-hidden dashboard-theme-wrapper ${themeClass}`} style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
            {!isFullscreen && <TopNav />}

            <div className={`flex-1 flex overflow-hidden relative ${isFullscreen ? "p-0 gap-0" : "p-0 md:p-2 gap-0 md:gap-2"}`}>
                {!isFullscreen && <LeftSidebar />}

                <div className="flex-1 flex flex-col gap-0 md:gap-2 relative h-full min-w-0">
                    <div className={`flex-1 overflow-hidden relative ${isFullscreen ? "" : "md:border dashboard-panel"}`} style={{ backgroundColor: "transparent" }}>
                        {children}

                        {/* Mobile Toggle Buttons & Overlay */}
                        {!isFullscreen && (
                            <>
                                {/* Overlay for closing panels on mobile */}
                                {mobilePanelOpen && (
                                    <div
                                        className="md:hidden absolute inset-0 z-40 bg-transparent"
                                        onClick={() => setMobilePanelOpen(null)}
                                    />
                                )}
                                <div className="md:hidden absolute inset-0 pointer-events-none z-30">
                                    <button
                                        onClick={() => setMobilePanelOpen(mobilePanelOpen === 'left' ? null : 'left')}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/80 border border-[#00FFF1]/30 text-[#00FFF1] px-1.5 py-3 md:p-2 rounded-r pointer-events-auto backdrop-blur-sm text-[9px] md:text-[10px]"
                                    >
                                        ◀ DETAY
                                    </button>
                                    <button
                                        onClick={() => setMobilePanelOpen(mobilePanelOpen === 'right' ? null : 'right')}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/80 border border-[#00FFF1]/30 text-[#00FFF1] px-1.5 py-3 md:p-2 rounded-l pointer-events-auto backdrop-blur-sm text-[9px] md:text-[10px]"
                                    >
                                        AKIŞ ▶
                                    </button>
                                    <button
                                        onClick={() => setMobilePanelOpen(mobilePanelOpen === 'bottom' ? null : 'bottom')}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 border border-[#00FFF1]/30 text-[#00FFF1] px-3 py-1.5 rounded-t pointer-events-auto backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.5)] text-[9px] md:text-[10px]"
                                    >
                                        ▲ KAYNAKLAR
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {!isFullscreen && <BottomPanel />}
                </div>

                {!isFullscreen && <RightSidebar />}
            </div>

            {!isFullscreen && (
                <div className="hidden md:flex h-6 shrink-0 border-t dashboard-panel items-center justify-between px-4 text-[10px] tracking-widest uppercase">
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
