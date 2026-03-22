"use client";

// WatcherG — Pin detay içeriği
// DetailPanel içinde gösterilen zengin bilgi kartı
// Güvenilirlik barı, kaynak değiştirme okları, zaman bilgisi

import type { Pin } from "@/types/pin";
import { getReliabilityGroup } from "@/types/pin";

interface PinDetailProps {
    pin: Pin;
}

// Güvenilirlik renk ve etiket sabitleri
const RELIABILITY_CONFIG: Record<string, { color: string; label: string }> = {
    unreliable: { color: "#FF4444", label: "Güvenilmez" },
    suspicious: { color: "#FFAA00", label: "Şüpheli" },
    reliable: { color: "#00FF88", label: "Güvenilir" },
    guaranteed: { color: "#44AAFF", label: "Resmi" },
};



export default function PinDetail({ pin }: PinDetailProps) {
    const reliabilityGroup = getReliabilityGroup(pin.kaynakSkoru);
    const config = RELIABILITY_CONFIG[reliabilityGroup];

    // Göreceli zaman hesapla
    const relativeTime = getRelativeTime(pin.tarih);

    return (
        <div className="space-y-3">
            {/* Başlık */}
            <h3 className="text-white text-sm font-semibold leading-snug">
                {pin.baslik}
            </h3>

            {/* Özet */}
            <p className="text-[#888] text-xs leading-relaxed">
                {pin.ozet}
            </p>

            {/* Güvenilirlik barı */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[#666680] text-xs">Güvenilirlik</span>
                    <span
                        className="text-xs font-medium"
                        style={{ color: config.color }}
                    >
                        {config.label} ({pin.kaynakSkoru}/100)
                    </span>
                </div>
                <div className="w-full h-1.5 bg-[#1E1E2E] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${pin.kaynakSkoru}%`,
                            background: `linear-gradient(90deg, ${config.color}88, ${config.color})`,
                        }}
                    />
                </div>
            </div>

            {/* Kaynak bilgisi */}
            <div className="flex items-center gap-2 bg-[#0A0A0F]/50 rounded-lg px-3 py-2">
                <span className="text-[#00FF88] text-xs font-medium">
                    {pin.kaynak}
                </span>
                <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                        color: config.color,
                        backgroundColor: `${config.color}15`,
                        border: `1px solid ${config.color}40`,
                    }}
                >
                    Skor: {pin.kaynakSkoru}
                </span>
            </div>

            {/* Alternatif kaynaklar */}
            {pin.alternatifKaynaklar.length > 0 && (
                <div className="space-y-1">
                    <span className="text-[#666680] text-xs">
                        Alternatif Kaynaklar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {pin.alternatifKaynaklar.map((source, index) => (
                            <span
                                key={index}
                                className="text-[#888] text-xs bg-[#1E1E2E] px-2 py-0.5 rounded"
                            >
                                {source}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Alt bilgi satırı */}
            <div className="flex items-center justify-between text-[#666680] text-xs pt-1 border-t border-[#1E1E2E]/50">
                <span>📅 {relativeTime}</span>
                <span>
                    📍 {pin.koordinat.lat.toFixed(2)}°, {pin.koordinat.lng.toFixed(2)}°
                </span>
            </div>
        </div>
    );
}

// Göreceli zaman çevirici
function getRelativeTime(dateString: string): string {
    try {
        const eventDate = new Date(dateString);
        const now = new Date();
        const differenceInMs = now.getTime() - eventDate.getTime();
        const differenceInMinutes = Math.floor(differenceInMs / 60000);

        if (differenceInMinutes < 1) return "Az önce";
        if (differenceInMinutes < 60) return `${differenceInMinutes} dk önce`;

        const differenceInHours = Math.floor(differenceInMinutes / 60);
        if (differenceInHours < 24) return `${differenceInHours} saat önce`;

        const differenceInDays = Math.floor(differenceInHours / 24);
        if (differenceInDays < 7) return `${differenceInDays} gün önce`;

        return eventDate.toLocaleDateString("tr-TR");
    } catch {
        return dateString;
    }
}
