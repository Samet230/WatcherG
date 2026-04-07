"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pin } from "@/types/pin";
import { CATEGORY_CONFIG } from "@/types/pin";

interface ClusterListPanelProps {
  pins: Pin[];
  onClose: () => void;
  onSelect: (pin: Pin) => void;
}

export default function ClusterListPanel({ pins, onClose, onSelect }: ClusterListPanelProps) {
  const categories = useMemo(
    () => Array.from(new Set(pins.map((pin) => pin.kategori))),
    [pins],
  );
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setVisibleCategories(categories);
    setIsClosing(false);
  }, [categories]);

  const filteredPins = useMemo(() => {
    if (visibleCategories.length === 0) {
      return [];
    }
    return pins.filter((pin) => visibleCategories.includes(pin.kategori));
  }, [pins, visibleCategories]);

  const toggleCategory = (category: string) => {
    setVisibleCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleClose = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 220);
  };

  return (
    <div className={`absolute left-3 top-32 bottom-20 z-[61] w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#1E1E2E] bg-[#12121A]/95 shadow-2xl backdrop-blur-md transition-transform duration-200 ease-out md:w-[24rem] ${isClosing ? "-translate-x-[110%]" : "translate-x-0"}`}>
      <div className="flex items-center justify-between border-b border-[#1E1E2E] px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#666680]">Kume Kayitlari</div>
          <div className="mt-1 text-sm text-[#E9FEEA]">{filteredPins.length} / {pins.length} haber</div>
        </div>
        <button
          onClick={handleClose}
          className="rounded-md border border-[#2A2A3A] px-2 py-1 text-xs text-[#9AC7A8] transition-colors hover:border-[#00FF88]/40 hover:text-[#E9FEEA]"
        >
          X
        </button>
      </div>

      {categories.length > 0 && (
        <div className="border-b border-[#1E1E2E] px-3 py-2">
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#666680]">Kategori Filtresi</div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const config = CATEGORY_CONFIG[category];
              const active = visibleCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all"
                  style={{
                    borderColor: active ? `${config.renk}66` : "rgba(74,136,98,0.2)",
                    background: active ? "rgba(0,255,136,0.08)" : "rgba(10,10,15,0.55)",
                    color: active ? "#E9FEEA" : "#7A9084",
                  }}
                  title={config.etiket}
                >
                  <span>{config.ikon}</span>
                  <span>{config.etiket}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto px-3 py-3 pb-24">
        <div className="space-y-2">
          {filteredPins.map((pin, index) => (
            <button
              key={`${pin.id}-${index}`}
              onClick={() => onSelect(pin)}
              className="block w-full rounded-xl border border-[#1E1E2E] bg-[#0A0A0F]/75 px-3 py-3 text-left transition-all hover:border-[#00FF88]/25 hover:bg-[#11131A]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10px] uppercase tracking-[0.22em] text-[#4A8862]">
                    {CATEGORY_CONFIG[pin.kategori]?.ikon} {pin.kategori} · {pin.kaynak}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-semibold text-[#E9FEEA]">
                    {pin.baslik}
                  </div>
                  <div className="mt-2 line-clamp-3 text-xs leading-5 text-[#93A19A]">
                    {pin.ozet}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#666680]">{pin.oncelik}</div>
                  <div className="mt-1 text-xs text-[#00FF88]">{pin.kaynakSkoru}/100</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[#666680]">
                <span className="truncate">{pin.konum || "Global"}</span>
                <span className="shrink-0">{formatPanelTime(pin.tarih)}</span>
              </div>
            </button>
          ))}

          {filteredPins.length === 0 && (
            <div className="rounded-xl border border-[#1E1E2E] bg-[#0A0A0F]/75 px-3 py-4 text-center text-xs tracking-[0.16em] text-[#666680]">
              Secili kategori filtresinde haber yok
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatPanelTime(value: string): string {
  try {
    return new Date(value).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "yakın zamanda";
  }
}
