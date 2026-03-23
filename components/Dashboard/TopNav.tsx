"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMapStore } from "@/store/mapStore";
import { getFeedStats } from "@/lib/dashboardFeed";
import { getCurrentUser } from "@/lib/auth";

export default function TopNav() {
    const allPins = useMapStore((state) => state.allPins);
    const stats = getFeedStats(allPins);
    const [utcTime, setUtcTime] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const updateClock = () => {
            setUtcTime(
                new Date().toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "UTC",
                }) + " UTC"
            );
        };

        updateClock();
        const timer = window.setInterval(updateClock, 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        let isMounted = true;
        getCurrentUser().then(({ user }) => {
            if (isMounted) {
                setIsAuthenticated(Boolean(user));
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="h-10 shrink-0 border-b border-[#00FFF1]/30 dashboard-panel flex items-center px-2 md:px-4 gap-2 md:gap-4 relative uppercase text-[10px] tracking-widest overflow-hidden">
            <div className="flex items-center gap-1 md:gap-3 pr-2 md:pr-4 border-r border-[#00FFF1]/30 h-full dashboard-text-accent font-bold shrink-0">
                <span className="animate-pulse hidden md:inline">_</span>
                <span>{`> WATCHERG`}</span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-gray-500 h-full">
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 inline-block" /> SIGNAL_ACTIVE
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 inline-block" /> ENCRYPTED
                </span>
            </div>

            <div className="hidden md:flex flex-1 overflow-hidden h-full items-center justify-center relative whitespace-nowrap mask-image-marquee opacity-70">
                <span className="text-[#00AA55] tracking-[0.2em]">{`// PROTOCOL: WATCHERG/1.0   ENCRYPT: AES-256`}</span>
            </div>

            <div className="flex flex-1 md:flex-none justify-end md:justify-start items-center gap-2 md:gap-4 h-full md:pl-4 md:border-l border-[#00FFF1]/30">
                <div className="hidden lg:flex text-gray-400 items-center gap-2">
                    <span title="Toplam olay">EVENTS: {stats.total}</span>
                    <span title="Kaynak sayısı" className="text-red-400">SOURCES: {stats.sources}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-red-500 font-bold ml-0 md:ml-2 shrink-0">
                    <span className="w-2 h-2 bg-red-500 animate-pulse" /> {stats.critical} <span className="hidden md:inline">CRITICAL</span>
                </div>
                <div className="hidden sm:flex dashboard-text-accent ml-1 md:ml-2 font-bold px-1 md:px-2 py-0.5 border border-[#00FF41]/30 text-[9px] md:text-[10px] shrink-0">
                    {utcTime || "--:--:--"}
                </div>
                <Link
                    href={isAuthenticated ? "/profile" : "/auth/login"}
                    className="border border-[#00FF41]/30 px-2 md:px-3 py-1 text-[#00FF41] hover:bg-[#00FF41]/10 transition-colors ml-1 md:ml-2"
                >
                    {isAuthenticated ? "PROFİL" : "GİRİŞ"}
                </Link>
            </div>
        </div>
    );
}
