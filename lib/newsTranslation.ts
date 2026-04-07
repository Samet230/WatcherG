import type { AppLanguage } from "@/lib/i18n";

export interface NewsTranslationResult {
    sourceLanguage: AppLanguage | "unknown";
    targetLanguage: AppLanguage;
    translatedTitle: string;
    translatedSummary: string;
    translatedContent?: string;
}

const LANGUAGE_HINTS: Record<AppLanguage, string[]> = {
    tr: [" ve ", " bir ", " için ", " değil ", " haber ", " son dakika", " çatışma ", " deprem "],
    en: [" the ", " and ", " for ", " with ", " breaking ", " conflict ", " earthquake "],
    es: [" el ", " la ", " de ", " que ", " con ", " desde ", " conflicto ", " terremoto "],
    fr: [" le ", " la ", " les ", " des ", " avec ", " depuis ", " conflit ", " seisme "],
    de: [" der ", " die ", " und ", " mit ", " aus ", " konflikt ", " erdbeben "],
    ar: ["ال", " من ", " في ", " على ", " إلى ", " حرب", " زلزال"],
    ru: [" и ", " в ", " на ", " что ", " из ", " конфликт ", " землетрясение "],
};

const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const ARABIC_REGEX = /[\u0600-\u06FF]/;

export function detectNewsLanguage(input: string): AppLanguage | "unknown" {
    const text = ` ${input.toLocaleLowerCase()} `;

    if (ARABIC_REGEX.test(text)) return "ar";
    if (CYRILLIC_REGEX.test(text)) return "ru";

    let bestLanguage: AppLanguage | null = null;
    let bestScore = 0;

    for (const [language, hints] of Object.entries(LANGUAGE_HINTS) as Array<[AppLanguage, string[]]>) {
        const score = hints.reduce((total, hint) => total + (text.includes(hint) ? 1 : 0), 0);
        if (score > bestScore) {
            bestScore = score;
            bestLanguage = language;
        }
    }

    return bestLanguage ?? "unknown";
}

export function buildTranslationLabel(
    sourceLanguage: AppLanguage | "unknown",
    targetLanguage: AppLanguage
): string {
    const source = sourceLanguage === "unknown" ? "??" : sourceLanguage.toUpperCase();
    return `${source}->${targetLanguage.toUpperCase()}`;
}

export function shouldTranslateContent(
    sourceLanguage: AppLanguage | "unknown",
    targetLanguage: AppLanguage
): boolean {
    return sourceLanguage !== targetLanguage;
}
