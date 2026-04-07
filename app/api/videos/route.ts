import { NextResponse } from "next/server";
import { getFromCache, peekCache, setToCache } from "@/lib/cache";
import { fetchYouTubeNewsDetailed } from "@/lib/apis/youtube_news";
import { formatYouTubeToPins } from "@/lib/formatter";
import type { Pin, NewsCategory } from "@/types/pin";

export const dynamic = "force-dynamic";

const CACHE_KEY = "youtube_video_feed_v2";
const SUCCESS_TTL_MS = 15 * 60 * 1000;
const EMPTY_TTL_MS = 3 * 60 * 1000;
const MIN_PER_CATEGORY = 6;
const MAX_PER_CATEGORY = 10;
const CATEGORY_ORDER: NewsCategory[] = [
  "conflict",
  "disaster",
  "health",
  "politics",
  "economy",
  "technology",
  "science",
  "general",
];

const CATEGORY_SIGNAL_MAP: Record<NewsCategory, string[]> = {
  conflict: ["war", "conflict", "attack", "missile", "troops", "airstrike", "battle", "savas", "catisma", "fuze"],
  disaster: [
    "earthquake",
    "flood",
    "wildfire",
    "storm",
    "disaster",
    "quake",
    "hurricane",
    "cyclone",
    "tornado",
    "volcano",
    "eruption",
    "aftershock",
    "landslide",
    "severe weather",
    "deprem",
    "sel",
    "yangin",
    "afet",
    "kasirga",
    "kasırga",
    "heyelan",
    "volkan",
    "artci",
    "artçı",
  ],
  health: ["health", "medical", "hospital", "disease", "outbreak", "vaccine", "saglik", "hastane", "doktor", "salgin"],
  politics: ["election", "government", "minister", "parliament", "nato", "summit", "secim", "hukumet", "bakan", "diplomasi"],
  economy: ["economy", "market", "inflation", "bank", "stocks", "trade", "ekonomi", "enflasyon", "borsa", "faiz"],
  technology: ["technology", "tech", "ai", "software", "chip", "robot", "teknoloji", "yazilim", "yapay zeka", "siber"],
  science: ["science", "research", "study", "physics", "biology", "quantum", "bilim", "arastirma", "laboratuvar", "astronomi"],
  general: [],
  flight: [],
  marine: [],
};

const CATEGORY_SOURCE_HINTS: Partial<Record<NewsCategory, string[]>> = {
  conflict: ["al jazeera", "cnn", "fox news", "sky news"],
  disaster: ["usgs", "noaa", "fema", "weather.com", "weather", "accuweather", "weathernation", "lastquake", "undrr"],
  health: ["who", "cdc", "global health media"],
  politics: ["united nations", "nato", "uk parliament", "european parliament", "foreign ministry"],
  economy: ["cnbc", "bloomberg television", "yahoo finance", "tcmb", "bbc business"],
  technology: ["techcrunch", "engadget", "technology review", "mit technology review"],
  science: ["nasa", "scishow", "veritasium", "science channel", "pbs space time"],
};

interface VideosPayload {
  data: Pin[];
  count: number;
  meta: {
    countsByCategory: Record<string, number>;
    fetchedAt: string;
    cached: boolean;
    minPerCategory: number;
    maxPerCategory: number;
    staleFallback?: boolean;
    channelStatus?: {
      name: string;
      kategori: NewsCategory;
      region: string;
      status: "fulfilled" | "empty" | "rejected";
      count: number;
    }[];
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const debugMode = url.searchParams.get("debug") === "1";
    const cacheSnapshot = peekCache<VideosPayload>(CACHE_KEY);
    const cached = getFromCache<VideosPayload>(CACHE_KEY);

    if (cached && !debugMode) {
      return NextResponse.json({
        success: true,
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
        },
      });
    }

    const result = await fetchYouTubeNewsDetailed(16);
    const rawPins = formatYouTubeToPins(result.articles);
    const dedupedPins = Array.from(
      new Map(rawPins.map((pin) => [pin.detayUrl || pin.id, pin])).values(),
    );
    const balancedPins = selectBalancedVideoPins(dedupedPins, MIN_PER_CATEGORY, MAX_PER_CATEGORY);
    const payload: VideosPayload = {
      data: balancedPins,
      count: balancedPins.length,
      meta: {
        countsByCategory: getCountsByCategory(balancedPins),
        fetchedAt: new Date().toISOString(),
        cached: false,
        minPerCategory: MIN_PER_CATEGORY,
        maxPerCategory: MAX_PER_CATEGORY,
        channelStatus: debugMode ? result.channelStatus : undefined,
      },
    };

    setToCache(CACHE_KEY, payload, payload.count > 0 ? SUCCESS_TTL_MS : EMPTY_TTL_MS);

    if (payload.count === 0 && cacheSnapshot.data) {
      return NextResponse.json({
        success: true,
        ...cacheSnapshot.data,
        meta: {
          ...cacheSnapshot.data.meta,
          cached: true,
          staleFallback: true,
          channelStatus: debugMode ? result.channelStatus : cacheSnapshot.data.meta.channelStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      ...payload,
    });
  } catch (error: unknown) {
    const cacheSnapshot = peekCache<VideosPayload>(CACHE_KEY);
    if (cacheSnapshot.data) {
      return NextResponse.json({
        success: true,
        ...cacheSnapshot.data,
        meta: {
          ...cacheSnapshot.data.meta,
          cached: true,
          staleFallback: true,
        },
      });
    }

    console.error("Video API hatasi:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : "Video akisi alinamadi",
      },
      { status: 500 },
    );
  }
}

function selectBalancedVideoPins(pins: Pin[], minPerCategory: number, maxPerCategory: number): Pin[] {
  const pinsByCategory = new Map<NewsCategory, Pin[]>();
  const eligiblePins = pins.filter(isCategoryCompatibleVideo);

  for (const category of CATEGORY_ORDER) {
    pinsByCategory.set(
      category,
      eligiblePins
        .filter((pin) => pin.kategori === category)
        .sort(sortPinsByPriority)
        .slice(0, maxPerCategory),
    );
  }

  const selected: Pin[] = [];

  for (const category of CATEGORY_ORDER) {
    const categoryPins = pinsByCategory.get(category) ?? [];
    const targetCount = Math.min(
      maxPerCategory,
      Math.max(minPerCategory, categoryPins.length),
    );
    selected.push(...categoryPins.slice(0, targetCount));
  }

  return selected.sort(sortPinsByPriority);
}

function sortPinsByPriority(left: Pin, right: Pin): number {
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const priorityDelta = priorityOrder[left.oncelik] - priorityOrder[right.oncelik];
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const reliabilityDelta = right.kaynakSkoru - left.kaynakSkoru;
  if (reliabilityDelta !== 0) {
    return reliabilityDelta;
  }

  return new Date(right.tarih).getTime() - new Date(left.tarih).getTime();
}

function getCountsByCategory(pins: Pin[]): Record<string, number> {
  return pins.reduce<Record<string, number>>((acc, pin) => {
    acc[pin.kategori] = (acc[pin.kategori] || 0) + 1;
    return acc;
  }, {});
}

function isCategoryCompatibleVideo(pin: Pin): boolean {
  const text = `${pin.baslik} ${pin.ozet} ${(pin.etiketler || []).join(" ")} ${pin.kaynak}`.toLowerCase();
  const source = pin.kaynak.toLowerCase();

  if (pin.kategori === "general") {
    return !CATEGORY_ORDER.some((category) => {
      if (category === "general") {
        return false;
      }
      return countSignalMatches(text, CATEGORY_SIGNAL_MAP[category]) >= 2;
    });
  }

  const matches = countSignalMatches(text, CATEGORY_SIGNAL_MAP[pin.kategori] ?? []);
  const sourceHint = (CATEGORY_SOURCE_HINTS[pin.kategori] ?? []).some((hint) => source.includes(hint));

  switch (pin.kategori) {
    case "technology":
    case "science":
      return sourceHint || matches >= 1;
    case "politics":
    case "economy":
      return sourceHint || matches >= 2;
    case "health":
      return sourceHint || matches >= 2;
    case "conflict":
    case "disaster":
      return sourceHint || matches >= 2 || (matches >= 1 && pin.oncelik !== "LOW");
    default:
      return matches >= 1;
  }
}

function countSignalMatches(text: string, signals: string[]): number {
  return signals.filter((signal) => text.includes(signal)).length;
}
