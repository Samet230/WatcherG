"use client";

import { create } from "zustand";
import { APP_LANGUAGES, type AppLanguage } from "@/lib/i18n";

interface LanguageState {
    language: AppLanguage;
    hydrated: boolean;
    setLanguage: (language: AppLanguage) => void;
    hydrateLanguage: () => void;
}

const STORAGE_KEY = "watcherg_language";

function isAppLanguage(value: string | null | undefined): value is AppLanguage {
    return APP_LANGUAGES.some((language) => language === value);
}

function applyDocumentLanguage(language: AppLanguage) {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.lang = language;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    language: "tr",
    hydrated: false,
    setLanguage: (language) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, language);
        }

        applyDocumentLanguage(language);
        set({ language });
    },
    hydrateLanguage: () => {
        if (typeof window === "undefined") {
            set({ hydrated: true });
            return;
        }

        const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
        const language = isAppLanguage(storedLanguage) ? storedLanguage : "tr";
        applyDocumentLanguage(language);
        set({ language, hydrated: true });
    },
}));
