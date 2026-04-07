import { NextResponse } from "next/server";
import { getFromCache, setToCache } from "@/lib/cache";
import { detectNewsLanguage } from "@/lib/newsTranslation";
import type { AppLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface TranslationRequestBody {
    title: string;
    summary: string;
    content?: string;
    targetLanguage: AppLanguage;
    sourceLanguage?: AppLanguage | "unknown";
}

interface MyMemoryResponse {
    responseData?: {
        translatedText?: string;
    };
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CHUNK_LENGTH = 420;

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as TranslationRequestBody;
        const title = body.title?.trim() || "";
        const summary = body.summary?.trim() || "";
        const content = body.content?.trim() || "";
        const targetLanguage = body.targetLanguage;

        if (!title || !summary || !targetLanguage) {
            return NextResponse.json(
                { success: false, error: "Eksik çeviri girdisi" },
                { status: 400 }
            );
        }

        const detectedSourceLanguage = body.sourceLanguage && body.sourceLanguage !== "unknown"
            ? body.sourceLanguage
            : detectNewsLanguage(`${title} ${summary} ${content}`);

        const sourceLanguage = detectedSourceLanguage === "unknown"
            ? "en"
            : detectedSourceLanguage;

        const cacheKey = [
            "news-translation-v1",
            sourceLanguage,
            targetLanguage,
            title,
            summary,
            content,
        ].join("::");

        const cached = getFromCache(cacheKey);
        if (cached) {
            return NextResponse.json({ success: true, ...(cached as object), cached: true });
        }

        if (sourceLanguage === targetLanguage) {
            const passthrough = {
                sourceLanguage,
                targetLanguage,
                translatedTitle: title,
                translatedSummary: summary,
                translatedContent: content || undefined,
            };
            setToCache(cacheKey, passthrough, CACHE_TTL_MS);
            return NextResponse.json({ success: true, ...passthrough, cached: false });
        }

        const translatedTitle = await translateText(title, sourceLanguage, targetLanguage);
        const translatedSummary = await translateText(summary, sourceLanguage, targetLanguage);
        const translatedContent = content
            ? await translateText(content, sourceLanguage, targetLanguage)
            : undefined;

        const payload = {
            sourceLanguage,
            targetLanguage,
            translatedTitle: translatedTitle || title,
            translatedSummary: translatedSummary || summary,
            translatedContent: translatedContent || content || undefined,
        };

        setToCache(cacheKey, payload, CACHE_TTL_MS);

        return NextResponse.json({
            success: true,
            ...payload,
            cached: false,
        });
    } catch (error: unknown) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Çeviri alınamadı",
            },
            { status: 500 }
        );
    }
}

async function translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
): Promise<string> {
    if (!text.trim()) return text;

    const chunks = splitIntoChunks(text, MAX_CHUNK_LENGTH).slice(0, 12);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
        const params = new URLSearchParams({
            q: chunk,
            langpair: `${sourceLanguage}|${targetLanguage}`,
        });

        const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Çeviri servisi hatası: ${response.status}`);
        }

        const data = (await response.json()) as MyMemoryResponse;
        translatedChunks.push(data.responseData?.translatedText?.trim() || chunk);
    }

    return translatedChunks.join(" ").trim();
}

function splitIntoChunks(text: string, maxLength: number): string[] {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) {
        return [normalized];
    }

    const chunks: string[] = [];
    let remaining = normalized;

    while (remaining.length > maxLength) {
        let splitIndex = remaining.lastIndexOf(". ", maxLength);
        if (splitIndex < maxLength * 0.6) {
            splitIndex = remaining.lastIndexOf(" ", maxLength);
        }
        if (splitIndex < maxLength * 0.5) {
            splitIndex = maxLength;
        }

        chunks.push(remaining.slice(0, splitIndex).trim());
        remaining = remaining.slice(splitIndex).trim();
    }

    if (remaining) {
        chunks.push(remaining);
    }

    return chunks.filter(Boolean);
}
