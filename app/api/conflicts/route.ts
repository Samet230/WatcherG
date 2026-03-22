import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { fetchGdeltNews } from "@/lib/apis/gdelt";
import { formatGdeltConflictToPin } from "@/lib/formatter";
import { getCachedData, setCachedData } from "@/lib/cacheUtils";
import type { Pin } from "@/types/pin";

export const dynamic = "force-dynamic";

interface ReliefWebCountry {
    name?: string;
    shortname?: string;
    iso3?: string;
}

interface ReliefWebDate {
    created?: string;
    original?: string;
}

interface ReliefWebReport {
    id: string;
    href: string;
    fields: {
        title: string;
        body?: string;
        primary_country?: ReliefWebCountry | ReliefWebCountry[];
        country?: ReliefWebCountry[];
        date?: ReliefWebDate;
    };
}

interface CountryLookupItem {
    code?: string;
    name: string;
    nameTr?: string;
    lat?: number;
    lng?: number;
}

interface CountryCenter {
    lat: number;
    lng: number;
    label: string;
}

const CACHE_KEY = "gdelt_conflicts";
const CACHE_TTL_MS = 30 * 60 * 1000;
const RELIEFWEB_API_URL = "https://api.reliefweb.int/v1/reports";
const RELIEFWEB_LIMIT = 10;

const COUNTRY_ALIASES: Record<string, string> = {
    "syrian arab republic": "syria",
    "republic of turkiye": "turkey",
    "tuerkiye": "turkey",
    "usa": "united states",
    "u.s.": "united states",
    "united states of america": "united states",
    "uk": "united kingdom",
    "democratic republic of the congo": "dr congo",
    "congo, democratic republic of the": "dr congo",
    "drc": "dr congo",
    "russian federation": "russia",
    "iran, islamic republic of": "iran",
    "venezuela, bolivarian republic of": "venezuela",
    "moldova, republic of": "moldova",
    "viet nam": "vietnam",
    "czechia": "czech republic",
};

let countryLookupPromise: Promise<Map<string, CountryCenter>> | null = null;

function normalizeCountryKey(value: string): string {
    return value.trim().toLowerCase();
}

async function getCountryLookup(): Promise<Map<string, CountryCenter>> {
    if (!countryLookupPromise) {
        countryLookupPromise = (async () => {
            const countriesPath = path.join(process.cwd(), "public", "data", "countries.json");
            const raw = await readFile(countriesPath, "utf8");
            const countries = JSON.parse(raw) as CountryLookupItem[];
            const lookup = new Map<string, CountryCenter>();

            countries.forEach((country) => {
                if (typeof country.lat !== "number" || typeof country.lng !== "number") {
                    return;
                }

                const center = {
                    lat: country.lat,
                    lng: country.lng,
                    label: country.name,
                };

                const keys = [country.name, country.nameTr, country.code]
                    .filter((item): item is string => Boolean(item))
                    .map(normalizeCountryKey);

                keys.forEach((key) => {
                    lookup.set(key, center);
                });
            });

            Object.entries(COUNTRY_ALIASES).forEach(([alias, canonical]) => {
                const canonicalCenter = lookup.get(normalizeCountryKey(canonical));
                if (canonicalCenter) {
                    lookup.set(normalizeCountryKey(alias), canonicalCenter);
                }
            });

            return lookup;
        })();
    }

    return countryLookupPromise;
}

function stripHtml(value: string): string {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function collectCountryCandidates(report: ReliefWebReport): string[] {
    const primaryCountries = Array.isArray(report.fields.primary_country)
        ? report.fields.primary_country
        : report.fields.primary_country
            ? [report.fields.primary_country]
            : [];

    const countries = report.fields.country || [];

    return [...primaryCountries, ...countries]
        .flatMap((item) => [item.name, item.shortname, item.iso3])
        .filter((item): item is string => Boolean(item))
        .map((item) => item.trim());
}

function resolveCountryCenter(
    candidates: string[],
    countryLookup: Map<string, CountryCenter>
): CountryCenter | null {
    for (const candidate of candidates) {
        const normalizedCandidate = normalizeCountryKey(candidate);
        const aliasCandidate = COUNTRY_ALIASES[normalizedCandidate] || normalizedCandidate;
        const match =
            countryLookup.get(normalizedCandidate) ||
            countryLookup.get(aliasCandidate);

        if (match) {
            return match;
        }
    }

    return null;
}

async function fetchReliefWebPins(): Promise<Pin[]> {
    const reliefWebAppName = process.env.RELIEFWEB_APPNAME;
    if (!reliefWebAppName) {
        return [];
    }

    const params = new URLSearchParams();
    params.set("appname", reliefWebAppName);
    params.set("limit", String(RELIEFWEB_LIMIT));
    params.set("profile", "full");
    params.set("query[value]", "conflict");
    params.append("fields[include][]", "title");
    params.append("fields[include][]", "body");
    params.append("fields[include][]", "country");
    params.append("fields[include][]", "primary_country");
    params.append("fields[include][]", "date");

    const response = await fetch(`${RELIEFWEB_API_URL}?${params.toString()}`, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        throw new Error(`ReliefWeb hatasi: ${response.status}`);
    }

    const payload = (await response.json()) as { data?: ReliefWebReport[] };
    const countryLookup = await getCountryLookup();

    return (payload.data || []).flatMap((report) => {
        const countryCandidates = collectCountryCandidates(report);
        const center = resolveCountryCenter(countryCandidates, countryLookup);
        if (!center) {
            return [];
        }

        const summarySource = report.fields.body
            ? stripHtml(report.fields.body).slice(0, 180)
            : `${center.label} için insani kriz / çatışma raporu`;

        const eventDate =
            report.fields.date?.created ||
            report.fields.date?.original ||
            new Date().toISOString();

        return [
            {
                id: `reliefweb_${report.id}`,
                kategori: "conflict",
                oncelik: "MEDIUM",
                baslik: report.fields.title,
                ozet: summarySource,
                koordinat: { lat: center.lat, lng: center.lng },
                konum: center.label,
                tarih: eventDate,
                kaynak: "ReliefWeb",
                kaynakSkoru: 55,
                alternatifKaynaklar: [],
                renk: "#FF4444",
                detayUrl: report.href,
                etiketler: ["çatışma", "kriz", center.label.toLowerCase()],
            },
        ];
    });
}

export async function GET() {
    try {
        const cached = getCachedData(CACHE_KEY);
        if (cached) {
            return NextResponse.json({ success: true, pins: cached });
        }

        const gdeltQuery = "(military OR clash OR protest OR attack OR conflict OR war)";
        const gdeltArticles = await fetchGdeltNews(gdeltQuery, 40);
        const gdeltPins = gdeltArticles.map((article, index) =>
            formatGdeltConflictToPin(article, index)
        );

        let reliefWebPins: Pin[] = [];
        try {
            reliefWebPins = await fetchReliefWebPins();
        } catch (reliefWebError) {
            console.error("ReliefWeb fetch hatası (yedek):", reliefWebError);
        }

        const finalPins = [...gdeltPins, ...reliefWebPins].slice(0, 50);
        setCachedData(CACHE_KEY, finalPins, CACHE_TTL_MS);

        return NextResponse.json({ success: true, pins: finalPins });
    } catch (error) {
        console.error("API /conflicts hatası:", error);
        return NextResponse.json(
            { success: false, error: "Çatışma verileri alınamadı" },
            { status: 500 }
        );
    }
}
