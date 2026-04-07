"use client";

import { useEffect } from "react";
import { getLanguageOption } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";

export default function AppLanguageBootstrap() {
    const hydrateLanguage = useLanguageStore((state) => state.hydrateLanguage);
    const language = useLanguageStore((state) => state.language);

    useEffect(() => {
        hydrateLanguage();
    }, [hydrateLanguage]);

    useEffect(() => {
        const option = getLanguageOption(language);
        document.documentElement.lang = language;
        document.documentElement.dir = option.dir;
    }, [language]);

    return null;
}
