"use client";

import { useMemo } from "react";
import { LANGUAGE_OPTIONS, translate } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";

interface LanguagePickerProps {
    onChange?: (language: string) => void;
    compact?: boolean;
}

export default function LanguagePicker({ onChange, compact = false }: LanguagePickerProps) {
    const language = useLanguageStore((state) => state.language);
    const setLanguage = useLanguageStore((state) => state.setLanguage);

    const label = useMemo(() => translate(language, "language"), [language]);

    return (
        <label
            className={`flex items-center gap-2 border border-[#00FF88]/15 bg-[rgba(3,10,6,0.9)] px-2 py-1 text-[#C0FFD8] ${
                compact ? "text-[10px]" : "text-xs"
            }`}
            title={translate(language, "language_selector")}
        >
            <span className="font-mono tracking-[0.18em] text-[#4A8862]">{label}</span>
            <select
                value={language}
                onChange={(event) => {
                    const nextLanguage = event.target.value as typeof language;
                    setLanguage(nextLanguage);
                    onChange?.(nextLanguage);
                }}
                className="bg-transparent font-mono text-[#E0E0E0] outline-none"
            >
                {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code} className="bg-[#0A0A0F] text-[#E0E0E0]">
                        {option.nativeLabel}
                    </option>
                ))}
            </select>
        </label>
    );
}
