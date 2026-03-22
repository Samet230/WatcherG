"use client";

// WatcherG — Detay paneli
// Pine tıklayınca açılan bilgi paneli
// Kaynak değiştirme okları ile pinler arası gezinti

import type { Pin } from "@/types/pin";
import PinDetail from "./PinDetail";

// Kategori ikonları
const CATEGORY_ICONS: Record<string, string> = {
    earthquake: "🔴",
    fire: "🔥",
    news: "📰",
    disaster: "🌊",
    conflict: "⚔️",
    health: "🏥",
    flight: "✈️",
    marine: "🚢",
};

interface DetailPanelProps {
    pin: Pin | null;
    onClose: () => void;
    allPins?: Pin[];
    onNavigate?: (pin: Pin) => void;
    onStar?: (pin: Pin) => void;
    isStarred?: boolean;
}

export default function DetailPanel({
    pin,
    onClose,
    allPins = [],
    onNavigate,
    onStar,
    isStarred = false,
}: DetailPanelProps) {
    if (!pin) return null;

    // Aynı kategorideki pinlerin indexini bul (kaynak değiştirme okları için)
    const sameCategoryPins = allPins.filter(
        (p) => p.kategori === pin.kategori
    );
    const currentIndex = sameCategoryPins.findIndex((p) => p.id === pin.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < sameCategoryPins.length - 1;

    // Önceki/sonraki pine git
    const goToPrevious = () => {
        if (hasPrevious && onNavigate) {
            onNavigate(sameCategoryPins[currentIndex - 1]);
        }
    };

    const goToNext = () => {
        if (hasNext && onNavigate) {
            onNavigate(sameCategoryPins[currentIndex + 1]);
        }
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 z-50 md:absolute md:right-4 md:bottom-auto md:top-16 md:left-auto md:w-96 animate-slide-up">
            <div className="bg-[#12121A]/95 border border-[#1E1E2E] rounded-t-2xl md:rounded-2xl backdrop-blur-md shadow-2xl overflow-hidden">
                {/* Başlık barı */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E2E]">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">
                            {CATEGORY_ICONS[pin.kategori] || "📌"}
                        </span>
                        <span className="text-[#666680] text-xs uppercase tracking-wider">
                            {pin.kategori}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#666680] hover:text-white transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Pin detay içeriği */}
                <div className="px-4 py-3">
                    <PinDetail pin={pin} />
                </div>

                {/* Kaynak değiştirme okları + alt butonlar */}
                <div className="px-4 py-3 border-t border-[#1E1E2E] space-y-2">
                    {/* Gezinti okları — aynı kategorideki pinler arası */}
                    {sameCategoryPins.length > 1 && (
                        <div className="flex items-center justify-between">
                            <button
                                onClick={goToPrevious}
                                disabled={!hasPrevious}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${hasPrevious
                                    ? "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                    : "bg-[#0A0A0F] text-[#333] cursor-not-allowed"
                                    }`}
                            >
                                ← Önceki
                            </button>
                            <span className="text-[#666680] text-xs">
                                {currentIndex + 1} / {sameCategoryPins.length}
                            </span>
                            <button
                                onClick={goToNext}
                                disabled={!hasNext}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${hasNext
                                    ? "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                    : "bg-[#0A0A0F] text-[#333] cursor-not-allowed"
                                    }`}
                            >
                                Sonraki →
                            </button>
                        </div>
                    )}

                    {/* Alt butonlar — Yıldızla + Kaynağa git */}
                    <div className="flex gap-2">
                        {onStar && (
                            <button
                                onClick={() => onStar(pin)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-colors ${isStarred
                                        ? "bg-[#FFAA00]/10 text-[#FFAA00] border border-[#FFAA00]/30"
                                        : "bg-[#1E1E2E] text-[#E0E0E0] hover:bg-[#2A2A3A]"
                                    }`}
                            >
                                {isStarred ? "★ Yıldızlı" : "☆ Yıldızla"}
                            </button>
                        )}
                        <a
                            href={pin.detayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center px-3 py-2 bg-[#4488FF] text-white text-xs rounded-lg hover:bg-[#5599FF] transition-colors"
                        >
                            🔗 Kaynağa Git ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
