"use client";

import React from "react";
import type { Pin } from "@/types/pin";

interface TimelinePanelProps {
    pins: Pin[];
    onClose: () => void;
    onPinSelect: (pin: Pin) => void;
}

// Zaman çizelgesini gruplamak için tarih formatlayıcı
function formatTimelineDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
        return `Bugün, ${date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("tr-TR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TimelinePanel({ pins, onClose, onPinSelect }: TimelinePanelProps) {
    // Son 50 pini tarihe göre yeniden eskiye sıralayalım
    const sortedPins = [...pins]
        .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
        .slice(0, 50);

    return (
        <div className="absolute right-4 top-20 w-80 max-h-[70vh] bg-[#12121A]/95 border border-[#1E1E2E] rounded-xl backdrop-blur-md shadow-2xl flex flex-col z-40 overflow-hidden transform transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#1E1E2E]">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    ⏱️ Zaman Çizelgesi
                </h3>
                <button
                    onClick={onClose}
                    className="text-[#666680] hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {sortedPins.length === 0 ? (
                    <div className="text-center text-[#666680] py-8 text-sm">
                        Henüz veri bulunmuyor.
                    </div>
                ) : (
                    <div className="relative border-l border-[#1E1E2E] ml-3 pl-4 space-y-6">
                        {sortedPins.map((pin) => (
                            <div
                                key={pin.id}
                                className="relative cursor-pointer group"
                                onClick={() => onPinSelect(pin)}
                            >
                                {/* Çizgi Üzerindeki Nokta */}
                                <div
                                    className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#12121A] transition-transform group-hover:scale-150"
                                    style={{ backgroundColor: pin.renk }}
                                />

                                {/* İçerik */}
                                <div className="bg-[#1E1E2E]/30 rounded-lg p-3 border border-[#1E1E2E] hover:border-[#3A3A4A] transition-colors">
                                    <div className="text-[10px] text-[#666680] mb-1">
                                        {formatTimelineDate(pin.tarih)}
                                    </div>
                                    <h4 className="text-[#E0E0E0] text-xs font-semibold line-clamp-2 leading-tight mb-1">
                                        {pin.baslik}
                                    </h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span
                                            className="text-[9px] px-1.5 py-0.5 rounded font-medium tracking-wide uppercase"
                                            style={{ backgroundColor: `${pin.renk}20`, color: pin.renk }}
                                        >
                                            {pin.kategori}
                                        </span>
                                        <span className="text-[9px] text-[#8888AA]">
                                            {pin.kaynak}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
