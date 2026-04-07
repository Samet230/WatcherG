"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppLanguage } from "@/lib/i18n";
import {
    buildTranslationLabel,
    detectNewsLanguage,
    shouldTranslateContent,
} from "@/lib/newsTranslation";

interface UseNewsTranslationOptions {
    id: string;
    title: string;
    summary: string;
    content?: string;
    targetLanguage: AppLanguage;
}

interface CachedTranslation {
    sourceLanguage: AppLanguage | "unknown";
    targetLanguage: AppLanguage;
    translatedTitle: string;
    translatedSummary: string;
    translatedContent?: string;
}

const translationCache = new Map<string, CachedTranslation>();

export function useNewsTranslation({
    id,
    title,
    summary,
    content,
    targetLanguage,
}: UseNewsTranslationOptions) {
    const [isTranslated, setIsTranslated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [translated, setTranslated] = useState<CachedTranslation | null>(null);
    const sourceLanguage = useMemo(
        () => detectNewsLanguage(`${title} ${summary} ${content || ""}`),
        [content, summary, title]
    );

    const cacheKey = `${id}::${targetLanguage}`;
    const activeTranslation = translated ?? translationCache.get(cacheKey) ?? null;
    const effectiveSourceLanguage = activeTranslation?.sourceLanguage ?? sourceLanguage;
    const translationLabel = buildTranslationLabel(effectiveSourceLanguage, targetLanguage);
    const canTranslate = shouldTranslateContent(sourceLanguage, targetLanguage);

    const activeTitle = isTranslated && activeTranslation
        ? activeTranslation.translatedTitle
        : title;
    const activeSummary = isTranslated && activeTranslation
        ? activeTranslation.translatedSummary
        : summary;
    const activeContent = isTranslated && activeTranslation
        ? activeTranslation.translatedContent || content
        : content;

    useEffect(() => {
        setIsTranslated(false);
        setIsLoading(false);
        setTranslated(null);
    }, [cacheKey]);

    const toggleTranslation = async () => {
        if (!canTranslate) {
            return;
        }

        if (isTranslated) {
            setIsTranslated(false);
            return;
        }

        const cached = translationCache.get(cacheKey);
        if (cached) {
            setTranslated(cached);
            setIsTranslated(true);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/translate-news", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    summary,
                    content,
                    targetLanguage,
                    sourceLanguage,
                }),
            });

            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || "Çeviri başarısız");
            }

            const nextTranslation: CachedTranslation = {
                sourceLanguage: payload.sourceLanguage,
                targetLanguage: payload.targetLanguage,
                translatedTitle: payload.translatedTitle,
                translatedSummary: payload.translatedSummary,
                translatedContent: payload.translatedContent,
            };

            translationCache.set(cacheKey, nextTranslation);
            setTranslated(nextTranslation);
            setIsTranslated(true);
        } catch (error) {
            console.error("Çeviri alınamadı:", error);
            setIsTranslated(false);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        title: activeTitle,
        summary: activeSummary,
        content: activeContent,
        isTranslated,
        isLoading,
        canTranslate,
        translationLabel,
        toggleTranslation,
    };
}
