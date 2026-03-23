"use client";

import { useState } from "react";
import type { PinCategory } from "@/types/pin";
import { CATEGORY_CONFIG } from "@/types/pin";
import { useMapStore } from "@/store/mapStore";

interface TagBarProps {
    selectedCategories: PinCategory[];
    onToggleCategory: (category: PinCategory) => void;
}

const TAGS: PinCategory[] = [
    "conflict",
    "disaster",
    "health",
    "politics",
    "economy",
    "general",
];

export default function TagBar({ selectedCategories, onToggleCategory }: TagBarProps) {
    const setActiveTheme = useMapStore((state) => state.setActiveTheme);
    const [hoveredTag, setHoveredTag] = useState<PinCategory | null>(null);

    return (
        <div style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            padding: "6px 10px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
        }}>
            {TAGS.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isSelected = selectedCategories.includes(cat);
                const isExpanded = hoveredTag === cat;

                return (
                    <button
                        key={cat}
                        onClick={() => {
                            onToggleCategory(cat);
                            setActiveTheme(cat);
                        }}
                        onMouseEnter={() => setHoveredTag(cat)}
                        onMouseLeave={() => setHoveredTag(null)}
                        onFocus={() => setHoveredTag(cat)}
                        onBlur={() => setHoveredTag(null)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: isExpanded ? "5px" : "0px",
                            padding: isExpanded ? "5px 13px" : "5px 10px",
                            minWidth: isExpanded ? "124px" : "40px",
                            flexShrink: 0,
                            justifyContent: "center",
                            background: isSelected ? `${cfg.renk}18` : "transparent",
                            border: `1px solid ${isSelected ? cfg.renk : "rgba(0,255,136,0.12)"}`,
                            color: isSelected ? cfg.renk : "#4A8862",
                            fontFamily: "monospace",
                            fontSize: "9px",
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            cursor: "crosshair",
                            transition: "all .2s",
                            boxShadow: isSelected ? `0 0 10px ${cfg.renk}22` : "none",
                        }}
                    >
                        <span>{cfg.ikon}</span>
                        <span style={{
                            maxWidth: isExpanded ? "120px" : "0px",
                            opacity: isExpanded ? 1 : 0,
                            overflow: "hidden",
                            transition: "all .18s",
                        }}>
                            {cfg.etiket}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
