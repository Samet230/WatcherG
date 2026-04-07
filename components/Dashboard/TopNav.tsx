"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMapStore } from "@/store/mapStore";
import { getFeedStats } from "@/lib/dashboardFeed";
import { getCurrentUser } from "@/lib/auth";
import LanguagePicker from "@/components/LanguagePicker";
import { translate } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";

const LOGO_B64 = "data:image/png;base64,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";

export default function TopNav() {
    const allPins = useMapStore((state) => state.allPins);
    const stats = getFeedStats(allPins);
    const [utcTime, setUtcTime] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const language = useLanguageStore((state) => state.language);

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
            <Link href="/" className="flex items-center pr-2 md:pr-4 border-r border-[#00FFF1]/30 h-full shrink-0 no-underline hover:brightness-125 transition-all">
                <img src={LOGO_B64} alt="WatcherG" style={{ height: "26px", filter: "drop-shadow(0 0 6px rgba(0,255,136,0.5))" }} />
            </Link>

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
                    {isAuthenticated ? translate(language, "profile") : translate(language, "login")}
                </Link>
                {!isAuthenticated && (
                    <LanguagePicker compact />
                )}
                {isAuthenticated && <LanguagePicker compact />}
            </div>
        </div>
    );
}
