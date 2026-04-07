// WatcherG — Veri standardizasyon katmanı (v2)
// "Her şey haberdir, konu farklı"
// Tüm dış API kaynaklarını → NewsCategory Pin formatına çevirir

import type { EarthquakeEventMeta, Pin, NewsCategory } from "@/types/pin";
import { CATEGORY_CONFIG, CATEGORY_COLORS, calculatePriority } from "@/types/pin";
import type { UsgsEarthquakeFeature } from "@/lib/apis/usgs";
import type { EmscEarthquakeFeature } from "@/lib/apis/emsc";
import type { GdeltArticle } from "@/lib/apis/gdelt";
import type { GuardianArticle } from "@/lib/apis/guardian";
import type { NewsDataArticle } from "@/lib/apis/newsdata";
import type { RssArticle } from "@/lib/apis/turkish_news";
import type { InternationalArticle } from "@/lib/apis/international_news";
import type { HealthArticle } from "@/lib/apis/health_news";
import type { TopicArticle } from "@/lib/apis/topic_news";
import type { TechnologyArticle } from "@/lib/apis/technology_news";
import type { ScienceArticle } from "@/lib/apis/science_news";
import type { ReliefWebReport } from "@/lib/apis/reliefweb";
import type { EonetEvent } from "@/lib/apis/nasa";
import type { GdacsEvent } from "@/lib/apis/gdacs";
import type { FirmsFireRecord } from "@/lib/apis/firms";
import type { YouTubeVideoArticle } from "@/lib/apis/youtube_news";
import countriesData from "@/public/data/countries.json";
import citiesData from "@/public/data/cities.json";

type TopicLikeArticle = {
  title: string;
  link: string;
  description: string;
  content?: string;
  pubDate: string;
  source: string;
  reliability: number;
  region: string;
  kategori: NewsCategory;
};

// ─── DEPREM → "AFET & DEPREM HABERİ" ─────────────

export function formatEarthquakeToPin(feature: UsgsEarthquakeFeature | EmscEarthquakeFeature): Pin {
  const { properties, geometry, id } = feature;
  const [longitude, latitude, depth] = geometry.coordinates;
  const mag = properties.mag;
  const eventTime = new Date(properties.time).toISOString();
  const severity = getEarthquakeSeverity(mag);
  const tsunami = properties.tsunami === 1;
  const alertLevel = normalizeUsgsAlertLevel(properties.alert);
  const eventMeta: EarthquakeEventMeta = {
    type: "earthquake",
    magnitude: mag,
    depthKm: depth,
    eventTime,
    severity,
    alertLevel,
    tsunami,
    status: properties.status || undefined,
  };

  const baslik = properties.title;
  const ozetParts = [
    `Büyüklük ${mag} deprem ${depth} km derinlikte meydana geldi.`,
    alertLevel ? `USGS alarm seviyesi: ${alertLevel.toUpperCase()}.` : null,
    tsunami ? "Tsunami riski işaretlendi." : null,
  ].filter(Boolean);
  const ozet = ozetParts.join(" ");
  const kategori: NewsCategory = "disaster";
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const sourceName = feature.properties.source || "USGS";
  const reliabilityScore = calculateEarthquakeReliability(feature as UsgsEarthquakeFeature, eventMeta);

  return {
    id: `eq_${id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: { lat: latitude, lng: longitude },
    konum: properties.place || undefined,
    tarih: eventTime,
    kaynak: sourceName,
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: [],
    renk: getEarthquakeColor(mag),
    detayUrl: properties.url,
    etiketler: [
      "deprem",
      `m${Math.floor(mag)}`,
      "afet",
      `severity:${severity}`,
      `depth:${Math.round(depth)}`,
      tsunami ? "tsunami" : "no-tsunami",
      alertLevel ? `alert:${alertLevel}` : "alert:none",
    ],
    eventMeta,
  };
}

export function formatEarthquakesToPins(features: UsgsEarthquakeFeature[]): Pin[] {
  return features.map(formatEarthquakeToPin);
}

export function formatEmscEarthquakesToPins(features: EmscEarthquakeFeature[]): Pin[] {
  return features.map((feature) => formatEarthquakeToPin(feature));
}

function getEarthquakeColor(magnitude: number): string {
  if (magnitude >= 7.0) return "#FF0000";
  if (magnitude >= 5.0) return "#FF6600";
  if (magnitude >= 4.0) return "#FF8800";
  if (magnitude >= 3.0) return "#FFAA00";
  return "#FFCC44";
}

function getEarthquakeSeverity(
  magnitude: number
): EarthquakeEventMeta["severity"] {
  if (magnitude >= 8) return "great";
  if (magnitude >= 7) return "major";
  if (magnitude >= 6) return "strong";
  if (magnitude >= 5) return "moderate";
  return "minor";
}

function normalizeUsgsAlertLevel(
  alertLevel: string | null
): EarthquakeEventMeta["alertLevel"] {
  if (!alertLevel) {
    return null;
  }

  const normalized = alertLevel.toLowerCase();
  if (
    normalized === "green" ||
    normalized === "yellow" ||
    normalized === "orange" ||
    normalized === "red"
  ) {
    return normalized;
  }

  return null;
}

// ─── GDELT → KATEGORİ TAHMİNİ ────────────────────

function inferCategoryFromGdelt(article: GdeltArticle): NewsCategory {
  const text = (article.title + " " + (article.domain || "")).toLowerCase();

  if (["war", "savaş", "attack", "saldırı", "missile", "füze", "military", "askeri",
    "bomb", "bomba", "conflict", "çatışma", "troops", "battle", "explosion", "blast",
    "airstrike", "artillery", "rocket"].some(w => text.includes(w))) return "conflict";

  if (["earthquake", "deprem", "flood", "sel", "fire", "yangın", "hurricane", "typhoon",
    "tsunami", "volcano", "disaster", "storm", "drought", "famine", "quake",
    "wildfire"].some(w => text.includes(w))) return "disaster";

  if (matchesStrongHealthSignal(text)) return "health";

  if (matchesStrongScienceSignal(text)) return "science";

  if (matchesStrongTechnologySignal(text)) return "technology";

  if (matchesStrongEconomySignal(text)) return "economy";

  if (matchesStrongPoliticsSignal(text)) return "politics";

  return "general";
}

// ─── GDELT → HABER PİNİ ───────────────────────────

export function formatGdeltToPin(article: GdeltArticle, index: number): Pin {
  const kategori = inferCategoryFromGdelt(article);
  const baslik = article.title;
  const ozet = `Kaynak: ${article.domain}`;
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    sourceCountry: article.sourcecountry,
    seed: `${article.url}-${index}`,
  });
  const reliabilityScore = calculateGdeltReliability(article, kategori, location.konum);

  return {
    id: `gdelt_${index}_${Date.now()}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: formatGdeltDate(article.seendate),
    kaynak: article.domain,
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: article.url,
    gorsel: article.socialimage || undefined,
    etiketler: [kategori, article.sourcecountry?.toLowerCase()].filter(Boolean) as string[],
  };
}

// GDELT çatışma endpoint'i — direkt conflict kategorisi (güvenilirlik 55)
export function formatGdeltConflictToPin(article: GdeltArticle, index: number): Pin {
  const kategori: NewsCategory = "conflict";
  const baslik = article.title;
  const ozet = `Çatışma bölgesinden haber | Kaynak: ${article.domain}`;
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    sourceCountry: article.sourcecountry,
    seed: `${article.url}-${index}`,
  });
  const reliabilityScore = calculateGdeltReliability(article, kategori, location.konum);

  return {
    id: `conflict_${index}_${Date.now()}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: formatGdeltDate(article.seendate),
    kaynak: article.domain,
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS.conflict,
    detayUrl: article.url,
    gorsel: article.socialimage || undefined,
    etiketler: ["çatışma", "savaş", article.sourcecountry?.toLowerCase()].filter(Boolean) as string[],
  };
}

// ─── GUARDIAN → HABER PİNİ ────────────────────────

function inferCategoryFromGuardian(article: GuardianArticle): NewsCategory {
  const section = article.sectionName?.toLowerCase() || "";
  const title = article.webTitle?.toLowerCase() || "";

  if (["business", "money", "economy"].includes(section)) return "economy";
  if (["politics", "government"].includes(section)) return "politics";
  if (section === "health") return "health";
  if (["technology", "tech"].includes(section)) return "technology";
  if (["science"].includes(section)) return "science";
  if (["environment"].includes(section)) return "disaster";
  if (matchesStrongHealthSignal(title)) return "health";
  if (matchesStrongScienceSignal(title)) return "science";
  if (matchesStrongTechnologySignal(title)) return "technology";

  if (section === "world" || section === "us-news") {
    if (["war", "attack", "military", "conflict", "missile", "bomb", "airstrike"].some(w => title.includes(w))) return "conflict";
    if (["earthquake", "flood", "fire", "hurricane", "disaster", "tsunami"].some(w => title.includes(w))) return "disaster";
    if (matchesStrongHealthSignal(title)) return "health";
    if (matchesStrongScienceSignal(title)) return "science";
    if (matchesStrongTechnologySignal(title)) return "technology";
    if (matchesStrongPoliticsSignal(title)) return "politics";
    if (matchesStrongEconomySignal(title)) return "economy";
    return "general";
  }
  return "general";
}

export function formatGuardianToPin(article: GuardianArticle): Pin {
  const kategori = inferCategoryFromGuardian(article);
  const baslik = article.webTitle;
  const ozet = `Bölüm: ${article.sectionName}`;
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: article.id,
    fallback: { lat: 51.5074, lng: -0.1278, konum: "London, United Kingdom" },
  });
  const reliabilityScore = calculateGuardianReliability(article, kategori, location.konum);

  return {
    id: `guardian_${article.id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.webPublicationDate,
    kaynak: "The Guardian",
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: article.webUrl,
    etiketler: [kategori, article.sectionName].filter(Boolean) as string[],
  };
}

// ─── RSS → HABER PİNİ ─────────────────────────────

function inferCategoryFromTurkish(text: string): NewsCategory {
  const t = text.toLowerCase();
  if (["savaş", "çatışma", "saldırı", "bomba", "asker", "füze", "operasyon"].some(w => t.includes(w))) return "conflict";
  if (["deprem", "sel", "yangın", "afet", "tsunami", "kasırga", "heyelan"].some(w => t.includes(w))) return "disaster";
  if (matchesStrongHealthSignal(t)) return "health";
  if (matchesStrongScienceSignal(t)) return "science";
  if (matchesStrongTechnologySignal(t)) return "technology";
  if (matchesStrongPoliticsSignal(t)) return "politics";
  if (matchesStrongEconomySignal(t)) return "economy";
  return "general";
}

export function formatRssToPin(article: RssArticle, index: number): Pin {
  const baslik = article.title;
  const fullContent = (article.content || article.description || "").trim();
  const ozet = fullContent.substring(0, 1400) || "Detay için tıklayın";
  const kategori = inferCategoryFromTurkish(baslik + " " + ozet);
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: `${article.link}-${index}`,
    fallback: { lat: 39.0, lng: 35.0, konum: "Türkiye" },
  });
  const reliabilityScore = calculateRssReliability(article, kategori, location.konum);

  return {
    id: `rss_${index}_${Date.now()}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    icerik: fullContent || undefined,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.pubDate,
    kaynak: article.source,
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: article.link,
    etiketler: [kategori, "türkiye"].filter(Boolean) as string[],
  };
}

// ─── ULUSLARARASI RSS → HABER PİNİ ────────────────

// İngilizce haberlerde kategori tahmin fonksiyonu
function inferCategoryFromEnglish(text: string): NewsCategory {
  const normalizedText = text.toLowerCase();
  if (["war", "conflict", "attack", "bomb", "military", "missile", "strike", "troops", "battle", "combat", "explosion", "airstrike", "artillery"].some(word => normalizedText.includes(word))) return "conflict";
  if (["earthquake", "flood", "wildfire", "tsunami", "hurricane", "storm", "disaster", "landslide", "volcano", "drought", "cyclone", "typhoon", "magnitude", "quake", "eruption"].some(word => normalizedText.includes(word))) return "disaster";
  if (matchesStrongHealthSignal(normalizedText)) return "health";
  if (matchesStrongScienceSignal(normalizedText)) return "science";
  if (matchesStrongTechnologySignal(normalizedText)) return "technology";
  if (matchesStrongPoliticsSignal(normalizedText)) return "politics";
  if (matchesStrongEconomySignal(normalizedText)) return "economy";
  return "general";
}

export function formatInternationalRssToPin(article: InternationalArticle, index: number): Pin {
  const baslik = article.title;
  const fullContent = (article.content || article.description || "").trim();
  const ozet = fullContent.substring(0, 1400) || "Click for details";
  const kategori = inferCategoryFromEnglish(baslik + " " + ozet);
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: `${article.link}-intl-${index}`,
    sourceRegion: article.region,
    sourceName: article.source,
  });
  const reliabilityScore = calculateInternationalRssReliability(article, kategori, location.konum);

  return {
    id: `intl_${index}_${Date.now()}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    icerik: fullContent || undefined,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.pubDate,
    kaynak: article.source,
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: article.link,
    etiketler: [kategori, article.region.toLowerCase()].filter(Boolean) as string[],
  };
}

export function formatHealthArticleToPin(article: HealthArticle, index: number): Pin {
  const kategori: NewsCategory = "health";
  const baslik = article.title;
  const fullContent = article.content?.trim() || article.description || "";
  const ozet = fullContent.substring(0, 1400) || "Public health advisory";
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: `${article.link}-health-${index}`,
    sourceRegion: article.region,
    sourceName: article.source,
    allowTrustedRegionFallback: true,
  });

  return {
    id: `health_${index}_${Date.now()}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    icerik: fullContent || undefined,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.pubDate,
    kaynak: article.source,
    kaynakSkoru: clampReliabilityScore(article.reliability + (hasSpecificLocation(location.konum) ? 2 : 0), 88, 99),
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS.health,
    detayUrl: article.link,
    etiketler: ["health", "official", article.region.toLowerCase()].filter(Boolean),
  };
}

export function formatTopicArticleToPin(article: TopicLikeArticle, index: number): Pin {
  const kategori = article.kategori;
  const baslik = article.title;
  const fullContent = article.content?.trim() || article.description || "";
  const ozet = fullContent.substring(0, 1400) || "Topic briefing";
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: `${article.link}-${kategori}-${index}`,
    sourceRegion: article.region,
    sourceName: article.source,
    allowTrustedRegionFallback: true,
  });

  return {
    id: `topic_${kategori}_${index}_${Date.now()}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    icerik: fullContent || undefined,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.pubDate,
    kaynak: article.source,
    kaynakSkoru: clampReliabilityScore(article.reliability + (hasSpecificLocation(location.konum) ? 2 : 0), 88, 99),
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: article.link,
    etiketler: [kategori, "official-topic", article.region.toLowerCase()].filter(Boolean),
  };
}

export function formatTechnologyArticleToPin(article: TechnologyArticle, index: number): Pin {
  return formatTopicArticleToPin(article, index);
}

export function formatScienceArticleToPin(article: ScienceArticle, index: number): Pin {
  return formatTopicArticleToPin(article, index);
}

// ─── YOUTUBE → VİDEO HABER PİNİ ───────────────────

export function formatYouTubeToPin(video: YouTubeVideoArticle, index: number): Pin {
  const baslik = video.title;
  const ozet = video.description.substring(0, 1400) || "YouTube video haberi";
  const classifierInput = `${video.title} ${video.description} ${video.channelTitle}`;
  const inferredCategory = isLikelyTurkishText(classifierInput)
    ? inferCategoryFromTurkish(classifierInput)
    : inferCategoryFromEnglish(classifierInput);
  const kategori = resolveYouTubeCategory(video.kategori, inferredCategory, classifierInput);
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: `yt-${video.videoId}-${index}`,
    sourceRegion: video.region,
    sourceName: video.channelTitle,
    allowTrustedRegionFallback: true,
  });

  return {
    id: `yt_${video.videoId}_${index}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: video.publishedAt,
    kaynak: video.channelTitle,
    kaynakSkoru: clampReliabilityScore(
      video.reliability + (hasSpecificLocation(location.konum) ? 2 : 0),
      75,
      98
    ),
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: video.link,
    gorsel: video.thumbnail,
    etiketler: ["youtube", "video", kategori, video.region.toLowerCase()].filter(Boolean),
  };
}

function resolveYouTubeCategory(
  sourceCategory: NewsCategory,
  inferredCategory: NewsCategory,
  classifierInput: string
): NewsCategory {
  if (sourceCategory === "technology" || sourceCategory === "science") {
    return sourceCategory;
  }

  if (shouldPreserveTrustedYouTubeCategory(sourceCategory, classifierInput)) {
    return sourceCategory;
  }

  if (
    inferredCategory === "general" &&
    ["health", "economy"].includes(sourceCategory)
  ) {
    return sourceCategory;
  }

  if (sourceCategory === "general") {
    return inferredCategory;
  }

  if (hasStrongCategorySignal(sourceCategory, classifierInput)) {
    return sourceCategory;
  }

  if (inferredCategory !== "general") {
    return inferredCategory;
  }

  return sourceCategory;
}

function shouldPreserveTrustedYouTubeCategory(
  sourceCategory: NewsCategory,
  classifierInput: string
): boolean {
  const normalized = classifierInput.toLowerCase();

  switch (sourceCategory) {
    case "disaster":
      return [
        "usgs",
        "noaa",
        "fema",
        "weather.com",
        "accuweather",
        "weathernation",
        "lastquake",
        "undrr",
      ].some((term) => normalized.includes(term));
    case "politics":
      return [
        "united nations",
        "nato",
        "uk parliament",
        "european parliament",
        "foreign ministry",
      ].some((term) => normalized.includes(term));
    case "health":
      return ["who", "cdc", "global health media", "ecdc"].some((term) =>
        normalized.includes(term)
      );
    case "economy":
      return ["tcmb", "imf", "world bank", "oecd", "ecb", "cnbc", "bloomberg television", "yahoo finance"].some((term) =>
        normalized.includes(term)
      );
    default:
      return false;
  }
}

function hasStrongCategorySignal(category: NewsCategory, text: string): boolean {
  switch (category) {
    case "health":
      return matchesStrongHealthSignal(text);
    case "politics":
      return matchesStrongPoliticsSignal(text);
    case "economy":
      return matchesStrongEconomySignal(text);
    case "technology":
      return matchesStrongTechnologySignal(text);
    case "science":
      return matchesStrongScienceSignal(text);
    case "conflict":
      return ["war", "conflict", "attack", "missile", "troops", "airstrike", "battle", "savas", "catisma", "fuze", "nato", "united nations"].some((term) =>
        text.toLowerCase().includes(term)
      );
    case "disaster":
      return [
        "earthquake",
        "flood",
        "wildfire",
        "storm",
        "quake",
        "hurricane",
        "cyclone",
        "tornado",
        "volcano",
        "eruption",
        "aftershock",
        "severe weather",
        "landslide",
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
        "usgs",
        "noaa",
        "fema",
        "weather",
        "accuweather",
        "weathernation",
        "lastquake",
        "undrr",
      ].some((term) =>
        text.toLowerCase().includes(term)
      );
    default:
      return false;
  }
}

// ─── RELİEFWEB → AFET/İNSANİ YARDIM PİNİ ─────────

export function formatReliefWebToPin(report: ReliefWebReport, index: number): Pin {
  const baslik = report.title;
  const ozet = (report.body || "Detay için tıklayın").substring(0, 1400);
  // ReliefWeb afet türüne göre kategori belirle
  const kategori = mapReliefWebCategory(report.disasterType);
  const oncelik = calculatePriority(baslik, ozet, kategori);
  // ReliefWeb zaten ülke bilgisi veriyor — doğrudan kullan
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: `reliefweb-${report.id}-${index}`,
    sourceCountry: report.countryCode,
    sourceName: "ReliefWeb",
  });

  return {
    id: `rw_${report.id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: location.koordinat,
    konum: report.country || location.konum,
    tarih: report.date,
    kaynak: report.source || "ReliefWeb",
    kaynakSkoru: 88,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: report.url,
    etiketler: [kategori, report.disasterType?.toLowerCase(), report.countryCode?.toLowerCase()].filter(Boolean) as string[],
  };
}

// ReliefWeb afet türünü WatcherG kategorisine çevir
function mapReliefWebCategory(disasterType: string): NewsCategory {
  const normalizedType = disasterType?.toLowerCase() || "";
  if (["earthquake", "tsunami", "flood", "tropical cyclone", "storm", "drought", "volcano", "landslide", "cold wave", "heat wave", "wildfire"].some(d => normalizedType.includes(d))) return "disaster";
  if (["epidemic", "pandemic", "plague", "insect infestation"].some(d => normalizedType.includes(d))) return "health";
  if (["conflict", "war", "complex emergency"].some(d => normalizedType.includes(d))) return "conflict";
  return "general";
}

// ─── NASA EONET → AFET HABERİ ─────────────────────

export function formatEonetToPin(event: EonetEvent): Pin | null {
  if (!event.geometry || event.geometry.length === 0) return null;

  const latestGeometry = event.geometry[event.geometry.length - 1];
  let lng = 0, lat = 0;

  if (latestGeometry.type === "Point") {
    lng = (latestGeometry.coordinates as number[])[0];
    lat = (latestGeometry.coordinates as number[])[1];
  } else if (latestGeometry.type === "Polygon") {
    const ring = (latestGeometry.coordinates as number[][][])[0];
    if (ring?.length > 0) { lng = ring[0][0]; lat = ring[0][1]; }
    else return null;
  } else return null;

  const catInfo = event.categories[0] || { id: "unknown", title: "Bilinmeyen" };
  const kategori: NewsCategory = "disaster"; // NASA verileri her zaman afet
  const baslik = event.title;
  const ozet = (event.description || `${catInfo.title} — NASA EONET`).substring(0, 1400);
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const reliabilityScore = calculateEonetReliability(event, latestGeometry, catInfo.id);

  return {
    id: `eonet_${event.id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: { lat, lng },
    tarih: new Date(latestGeometry.date).toISOString(),
    kaynak: "NASA EONET",
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: event.sources?.map(s => s.url) || [],
    renk: CATEGORY_CONFIG[kategori].renk,
    detayUrl: event.sources?.[0]?.url || event.link,
    etiketler: ["afet", catInfo.id.toLowerCase(), "nasa"],
  };
}

export function formatEonetToPins(events: EonetEvent[]): Pin[] {
  return events.map(formatEonetToPin).filter((p): p is Pin => p !== null);
}

export function formatGdacsToPins(events: GdacsEvent[]): Pin[] {
  return events.map((event, index) => {
    const kategori: NewsCategory = "disaster";
    const baslik = event.title;
    const ozet = (event.description || "GDACS disaster alert").substring(0, 1400);
    const oncelik = calculatePriority(baslik, ozet, kategori);
    const severityBonus = event.severity === "red" ? 5 : event.severity === "orange" ? 3 : event.severity === "green" ? 1 : 0;

    return {
      id: `${event.id}_${index}`,
      kategori,
      oncelik,
      baslik,
      ozet,
      koordinat: { lat: event.lat, lng: event.lng },
      tarih: event.pubDate,
      kaynak: "GDACS",
      kaynakSkoru: clampReliabilityScore(89 + severityBonus, 84, 98),
      alternatifKaynaklar: [],
      renk: CATEGORY_CONFIG[kategori].renk,
      detayUrl: event.link,
      etiketler: ["afet", "gdacs", event.category.toLowerCase(), event.severity].filter(Boolean),
    };
  });
}

export function formatNewsDataToPin(article: NewsDataArticle): Pin {
  const classifierInput = `${article.title} ${article.description || ""} ${(article.category || []).join(" ")}`;
  const kategori =
    article.language?.toLowerCase() === "tr"
      ? inferCategoryFromTurkish(classifierInput)
      : inferCategoryFromEnglish(classifierInput);
  const baslik = article.title;
  const fullContent = article.content?.trim() || article.description?.trim() || article.title;
  const ozet = fullContent.substring(0, 1400) || `Kaynak: ${article.source_name}`;
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const countryCode = article.country?.[0]?.toUpperCase();
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    sourceCountry: countryCode,
    seed: article.article_id,
  });
  const reliabilityScore = calculateNewsDataReliability(article, kategori, location.konum);

  return {
    id: `newsdata_${article.article_id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    icerik: fullContent || undefined,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.pubDate,
    kaynak: article.source_name || article.source_id || "NewsData",
    kaynakSkoru: reliabilityScore,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: article.link,
    gorsel: article.image_url || undefined,
    etiketler: [kategori, ...(article.category || []), ...(article.country || [])].filter(Boolean),
  };
}

export function formatFirmsToPins(records: FirmsFireRecord[]): Pin[] {
  return records.map((record, index) => {
    const kategori: NewsCategory = "disaster";
    const intensity = record.frp ?? record.bright_ti4 ?? record.brightness ?? 0;
    const baslik = `Aktif yangın noktası ${record.satellite || "VIIRS"}`;
    const ozet = `NASA FIRMS aktif yangın tespiti. FRP: ${intensity.toFixed(1)} | Güven: ${record.confidence || "bilinmiyor"}`;
    const oncelik = calculatePriority(baslik, ozet, kategori);
    const reliabilityScore = calculateFirmsReliability(record);

    return {
      id: `firms_${record.acq_date}_${record.acq_time}_${index}`,
      kategori,
      oncelik,
      baslik,
      ozet,
      koordinat: { lat: record.latitude, lng: record.longitude },
      tarih: formatFirmsDate(record.acq_date, record.acq_time),
      kaynak: "NASA FIRMS",
      kaynakSkoru: reliabilityScore,
      alternatifKaynaklar: [],
      renk: CATEGORY_CONFIG[kategori].renk,
      detayUrl: "https://firms.modaps.eosdis.nasa.gov/",
      etiketler: ["yangın", "firms", (record.satellite || "viirs").toLowerCase()].filter(Boolean),
    };
  });
}

function formatFirmsDate(acqDate: string, acqTime: string): string {
  const paddedTime = acqTime.padStart(4, "0");
  const hours = paddedTime.slice(0, 2);
  const minutes = paddedTime.slice(2, 4);
  return `${acqDate}T${hours}:${minutes}:00Z`;
}

function calculateEarthquakeReliability(
  feature: UsgsEarthquakeFeature,
  eventMeta: EarthquakeEventMeta
): number {
  let score = 90;

  if (Number.isFinite(feature.properties.mag)) score += 2;
  if (Number.isFinite(eventMeta.depthKm)) score += 1;
  if (feature.properties.place) score += 1;
  if (feature.properties.url) score += 1;
  if (feature.properties.status) score += 1;
  if (feature.properties.updated) score += 1;
  if (eventMeta.alertLevel) score += 1;
  if (eventMeta.tsunami) score += 1;
  if (feature.properties.type?.toLowerCase() === "earthquake") score += 1;

  return clampReliabilityScore(score, 82, 99);
}

function calculateEonetReliability(
  event: EonetEvent,
  latestGeometry: EonetEvent["geometry"][number],
  categoryId: string
): number {
  let score = 84;

  if (event.description) score += 2;
  if (event.link) score += 1;
  if (event.sources?.length) score += Math.min(event.sources.length, 3);
  if (event.geometry?.length) score += Math.min(event.geometry.length, 3);
  if (latestGeometry.type === "Point") score += 2;
  if (latestGeometry.type === "Polygon") score += 1;
  if (latestGeometry.date) score += 1;
  if (categoryId && categoryId !== "unknown") score += 1;
  if (event.categories?.length > 1) score += 1;

  return clampReliabilityScore(score, 74, 96);
}

function calculateFirmsReliability(record: FirmsFireRecord): number {
  let score = 88;

  if (record.frp !== undefined) score += 3;
  if (record.brightness !== undefined || record.bright_ti4 !== undefined || record.bright_ti5 !== undefined) {
    score += 2;
  }
  if (record.satellite) score += 1;
  if (record.daynight) score += 1;

  const normalizedConfidence = record.confidence?.toLowerCase().trim();
  if (normalizedConfidence) {
    if (["h", "high", "nominal", "n", "100"].includes(normalizedConfidence)) {
      score += 3;
    } else if (["l", "low"].includes(normalizedConfidence)) {
      score -= 2;
    } else {
      score += 1;
    }
  }

  return clampReliabilityScore(score, 78, 99);
}

function calculateGdeltReliability(
  article: GdeltArticle,
  kategori: NewsCategory,
  locationName: string
): number {
  let score = kategori === "conflict" ? 57 : 64;

  if (article.domain) score += 2;
  if (article.sourcecountry) score += 2;
  if (article.socialimage) score += 2;
  if (article.language) score += 1;
  if (article.url_mobile) score += 1;
  if (article.title && article.title.length >= 40) score += 1;
  if (hasSpecificLocation(locationName)) score += 3;
  if (isRecentWithinHours(formatGdeltDate(article.seendate), 6)) score += 2;
  if (isKnownHighTrustDomain(article.domain)) score += 4;

  return clampReliabilityScore(score, 54, 88);
}

function calculateGuardianReliability(
  article: GuardianArticle,
  kategori: NewsCategory,
  locationName: string
): number {
  let score = 88;

  if (article.sectionName) score += 2;
  if (article.pillarName) score += 1;
  if (article.webUrl) score += 1;
  if (article.webTitle && article.webTitle.length >= 40) score += 1;
  if (kategori !== "general") score += 1;
  if (hasSpecificLocation(locationName)) score += 2;
  if (isRecentWithinHours(article.webPublicationDate, 12)) score += 2;

  return clampReliabilityScore(score, 84, 96);
}

function calculateNewsDataReliability(
  article: NewsDataArticle,
  kategori: NewsCategory,
  locationName: string
): number {
  let score = 72;

  if (article.source_name || article.source_id) score += 2;
  if (article.description && article.description.length >= 80) score += 2;
  if (article.country?.length) score += 2;
  if (article.category?.length) score += Math.min(article.category.length, 2);
  if (article.image_url) score += 2;
  if (article.language) score += 1;
  if (kategori !== "general") score += 1;
  if (hasSpecificLocation(locationName)) score += 3;
  if (isRecentWithinHours(article.pubDate, 12)) score += 2;
  if (isLikelyVerifiedPublisher(article.source_name || article.source_id || "")) score += 2;

  return clampReliabilityScore(score, 66, 90);
}

function calculateRssReliability(
  article: RssArticle,
  kategori: NewsCategory,
  locationName: string
): number {
  let score = article.reliability;

  if (article.description && article.description.length >= 60) score += 2;
  if (article.link) score += 1;
  if (kategori !== "general") score += 1;
  if (hasSpecificLocation(locationName)) score += 3;
  if (isRecentWithinHours(article.pubDate, 12)) score += 2;
  if (article.title && article.title.length >= 35) score += 1;

  return clampReliabilityScore(score, 68, 96);
}

function calculateInternationalRssReliability(
  article: InternationalArticle,
  kategori: NewsCategory,
  locationName: string
): number {
  let score = article.reliability;

  if (article.description && article.description.length >= 60) score += 2;
  if (article.link) score += 1;
  if (kategori !== "general") score += 1;
  if (hasSpecificLocation(locationName)) score += 3;
  if (isRecentWithinHours(article.pubDate, 12)) score += 2;
  if (article.title && article.title.length >= 35) score += 1;

  return clampReliabilityScore(score, 62, 96);
}


function clampReliabilityScore(score: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, score));
}

// ─── TOPLU ÇEVIRMELER ─────────────────────────────

export function formatGdeltToPins(articles: GdeltArticle[]): Pin[] {
  return articles.map((a, i) => formatGdeltToPin(a, i));
}
export function formatGuardianToPins(articles: GuardianArticle[]): Pin[] {
  return articles.map((a) => formatGuardianToPin(a));
}
export function formatRssToPins(articles: RssArticle[]): Pin[] {
  return articles.map((a, i) => formatRssToPin(a, i));
}
export function formatInternationalRssToPins(articles: InternationalArticle[]): Pin[] {
  return articles.map((a, i) => formatInternationalRssToPin(a, i));
}
export function formatHealthArticlesToPins(articles: HealthArticle[]): Pin[] {
  return articles.map((a, i) => formatHealthArticleToPin(a, i));
}
export function formatTopicArticlesToPins(articles: TopicArticle[]): Pin[] {
  return articles.map((a, i) => formatTopicArticleToPin(a, i));
}
export function formatTechnologyArticlesToPins(articles: TechnologyArticle[]): Pin[] {
  return articles.map((a, i) => formatTechnologyArticleToPin(a, i));
}
export function formatScienceArticlesToPins(articles: ScienceArticle[]): Pin[] {
  return articles.map((a, i) => formatScienceArticleToPin(a, i));
}
export function formatReliefWebToPins(reports: ReliefWebReport[]): Pin[] {
  return reports.map((r, i) => formatReliefWebToPin(r, i));
}
export function formatYouTubeToPins(videos: YouTubeVideoArticle[]): Pin[] {
  return videos.map((v, i) => formatYouTubeToPin(v, i));
}

// ─── YARDIMCI ─────────────────────────────────────

function formatGdeltDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return new Date().toISOString();
  const y = dateStr.substring(0, 4), m = dateStr.substring(4, 6),
    d = dateStr.substring(6, 8), h = dateStr.substring(8, 10) || "00",
    min = dateStr.substring(10, 12) || "00";
  return `${y}-${m}-${d}T${h}:${min}:00Z`;
}

function hasSpecificLocation(locationName?: string): boolean {
  if (!locationName) {
    return false;
  }

  const normalized = locationName.trim().toLowerCase();
  return normalized !== "global";
}

function isRecentWithinHours(dateString: string, maxHours: number): boolean {
  const timestamp = new Date(dateString).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= maxHours * 60 * 60 * 1000;
}

function isKnownHighTrustDomain(domain?: string): boolean {
  if (!domain) {
    return false;
  }

  const normalized = domain.toLowerCase();
  return [
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "bbc.co.uk",
    "dw.com",
    "france24.com",
    "theguardian.com",
  ].some((candidate) => normalized.includes(candidate));
}

function isLikelyVerifiedPublisher(sourceName: string): boolean {
  const normalized = sourceName.toLowerCase();
  return [
    "guardian",
    "reuters",
    "associated press",
    "ap",
    "bbc",
    "euronews",
    "dw",
    "trt",
    "al jazeera",
  ].some((candidate) => normalized.includes(candidate));
}

interface ResolvedNewsLocation {
  koordinat: { lat: number; lng: number };
  konum: string;
}


interface CountryLocationRecord {
  code?: string;
  name: string;
  nameTr?: string;
  continent?: string;
  lat?: number;
  lng?: number;
}

interface CityLocationRecord {
  name: string;
  country: string;
  lat?: number;
  lng?: number;
}

const COUNTRY_RECORDS = countriesData as CountryLocationRecord[];
const CITY_RECORDS = citiesData as CityLocationRecord[];
const COUNTRY_LOOKUP_BY_CODE = new Map(
  COUNTRY_RECORDS.map((country) => [country.code?.toUpperCase(), country] as const).filter(
    (entry): entry is [string, CountryLocationRecord] => Boolean(entry[0])
  )
);
const COUNTRY_SEARCH_INDEX = COUNTRY_RECORDS.flatMap((country) =>
  [country.name, country.nameTr]
    .filter((value): value is string => Boolean(value))
    .map((alias) => ({
      key: normalizeLocationText(alias),
      country,
    }))
).sort((left, right) => right.key.length - left.key.length);
const CITY_SEARCH_INDEX = CITY_RECORDS.map((city) => ({
  city,
  key: normalizeLocationText(city.name),
})).sort((left, right) => right.key.length - left.key.length);

const LOCATION_HINTS: Array<{ aliases: string[]; konum: string; lat: number; lng: number }> = [
  { aliases: ["gaza", "gazze"], konum: "Gaza, Palestine", lat: 31.5017, lng: 34.4668 },
  { aliases: ["israel", "israil", "tel aviv"], konum: "Israel", lat: 32.0853, lng: 34.7818 },
  { aliases: ["iran", "tehran", "tahran"], konum: "Iran", lat: 35.6892, lng: 51.389 },
  { aliases: ["lebanon", "lubnan", "beirut", "beyrut"], konum: "Lebanon", lat: 33.8938, lng: 35.5018 },
  { aliases: ["syria", "suriye", "damascus", "şam"], konum: "Syria", lat: 33.5138, lng: 36.2765 },
  { aliases: ["ukraine", "ukrayna", "kyiv", "kiev"], konum: "Ukraine", lat: 50.4501, lng: 30.5234 },
  { aliases: ["russia", "rusya", "moscow", "moskova"], konum: "Russia", lat: 55.7558, lng: 37.6173 },
  { aliases: ["turkey", "türkiye", "turkiye", "ankara", "istanbul"], konum: "Türkiye", lat: 39.9334, lng: 32.8597 },
  { aliases: ["greece", "yunanistan", "athens", "atina"], konum: "Greece", lat: 37.9838, lng: 23.7275 },
  { aliases: ["libya", "tripoli", "trablus"], konum: "Libya", lat: 32.8872, lng: 13.1913 },
  { aliases: ["algeria", "cezayir", "algiers"], konum: "Algeria", lat: 36.7538, lng: 3.0588 },
  { aliases: ["morocco", "fas", "rabat"], konum: "Morocco", lat: 34.0209, lng: -6.8416 },
  { aliases: ["spain", "ispanya", "madrid"], konum: "Spain", lat: 40.4168, lng: -3.7038 },
  { aliases: ["france", "fransa", "paris"], konum: "France", lat: 48.8566, lng: 2.3522 },
  { aliases: ["germany", "almanya", "berlin"], konum: "Germany", lat: 52.52, lng: 13.405 },
  { aliases: ["united kingdom", "britain", "ingiltere", "london"], konum: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { aliases: ["united states", "usa", "abd", "washington"], konum: "United States", lat: 38.9072, lng: -77.0369 },
  { aliases: ["china", "çin", "beijing", "pekin"], konum: "China", lat: 39.9042, lng: 116.4074 },
  { aliases: ["japan", "japonya", "tokyo"], konum: "Japan", lat: 35.6762, lng: 139.6503 },
  { aliases: ["india", "hindistan", "new delhi"], konum: "India", lat: 28.6139, lng: 77.209 },
  { aliases: ["pakistan", "islamabad"], konum: "Pakistan", lat: 33.6844, lng: 73.0479 },
  { aliases: ["afghanistan", "kabul"], konum: "Afghanistan", lat: 34.5553, lng: 69.2075 },
  { aliases: ["sudan", "khartoum", "hartum"], konum: "Sudan", lat: 15.5007, lng: 32.5599 },
  { aliases: ["yemen", "sanaa"], konum: "Yemen", lat: 15.3694, lng: 44.191 },
  // Doğu / Kuzey / Güney Asya Genişletmesi
  { aliases: ["taiwan", "tayvan", "taipei"], konum: "Taiwan", lat: 25.0330, lng: 121.5654 },
  { aliases: ["south korea", "güney kore", "seoul", "seul"], konum: "South Korea", lat: 37.5665, lng: 126.9780 },
  { aliases: ["north korea", "kuzey kore", "pyongyang"], konum: "North Korea", lat: 39.0392, lng: 125.7625 },
  { aliases: ["thailand", "tayland", "bangkok"], konum: "Thailand", lat: 13.7563, lng: 100.5018 },
  { aliases: ["vietnam", "hanoi", "ho chi minh"], konum: "Vietnam", lat: 21.0285, lng: 105.8542 },
  { aliases: ["philippines", "filipinler", "manila"], konum: "Philippines", lat: 14.5995, lng: 120.9842 },
  { aliases: ["indonesia", "endonezya", "jakarta", "cakarta"], konum: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { aliases: ["malaysia", "malezya", "kuala lumpur"], konum: "Malaysia", lat: 3.1390, lng: 101.6869 },
  { aliases: ["singapore", "singapur"], konum: "Singapore", lat: 1.3521, lng: 103.8198 },
  { aliases: ["sri lanka", "colombo", "kolombo"], konum: "Sri Lanka", lat: 6.9271, lng: 79.8612 },
  { aliases: ["bangladesh", "bangladeş", "dhaka", "dakka"], konum: "Bangladesh", lat: 23.8103, lng: 90.4125 },
  // Orta Doğu & Afrika Ekleri
  { aliases: ["saudi arabia", "suudi arabistan", "riyadh", "riyad"], konum: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { aliases: ["uae", "bae", "dubai", "abu dhabi", "abu dabi"], konum: "UAE", lat: 25.2048, lng: 55.2708 },
  { aliases: ["egypt", "mısır", "misir", "cairo", "kahire"], konum: "Egypt", lat: 30.0444, lng: 31.2357 },
  { aliases: ["south africa", "güney afrika", "cape town", "pretoria", "johannesburg"], konum: "South Africa", lat: -33.9249, lng: 18.4241 },
  { aliases: ["kenya", "nairobi"], konum: "Kenya", lat: -1.2921, lng: 36.8219 },
  { aliases: ["nigeria", "nijerya", "abuja", "lagos"], konum: "Nigeria", lat: 9.0579, lng: 7.4951 },
];

interface NewsLocationOptions {
  title: string;
  summary?: string;
  seed: string;
  sourceCountry?: string;
  sourceRegion?: string;
  sourceName?: string;
  allowTrustedRegionFallback?: boolean;
  fallback?: { lat: number; lng: number; konum: string };
}

// Kaynak adı → varsayılan bölge eşleştirmesi
const SOURCE_REGION_MAP: Record<string, string> = {
  "TASS": "RU", "RT": "RU",
  "CGTN": "CN", "Xinhua": "CN",
  "NHK World": "JP",
  "Yonhap": "KR",
  "NDTV": "IN", "The Hindu": "IN",
  "Al Jazeera": "QA",
  "France24": "FR",
  "DW": "DE",
  "BBC World": "GB",
  "Reuters": "GLOBAL",
  "AP News": "US",
};

// Uluslararası organizasyon → merkez konumu
const ORGANIZATION_LOCATION_HINTS: Array<{ keywords: string[]; lat: number; lng: number; konum: string }> = [
  { keywords: ["nato", "north atlantic"], lat: 50.8503, lng: 4.3517, konum: "Brussels, Belgium" },
  { keywords: ["european union", "eu summit", "eu parliament"], lat: 50.8503, lng: 4.3517, konum: "Brussels, Belgium" },
  { keywords: ["imf", "world bank", "federal reserve"], lat: 38.9072, lng: -77.0369, konum: "Washington DC, USA" },
  { keywords: ["united nations", "un general", "un security", "unhcr"], lat: 40.7489, lng: -73.9680, konum: "New York, USA" },
  { keywords: ["opec", "oil cartel"], lat: 48.2082, lng: 16.3738, konum: "Vienna, Austria" },
  { keywords: ["who", "world health", "red cross", "icrc"], lat: 46.2044, lng: 6.1432, konum: "Geneva, Switzerland" },
  { keywords: ["kremlin", "putin"], lat: 55.7558, lng: 37.6173, konum: "Moscow, Russia" },
  { keywords: ["white house", "pentagon", "capitol hill"], lat: 38.9072, lng: -77.0369, konum: "Washington DC, USA" },
  { keywords: ["downing street", "westminster"], lat: 51.5074, lng: -0.1278, konum: "London, UK" },
  { keywords: ["elysee", "élysée", "macron"], lat: 48.8566, lng: 2.3522, konum: "Paris, France" },
  { keywords: ["beijing", "xi jinping", "communist party"], lat: 39.9042, lng: 116.4074, konum: "Beijing, China" },
];

function resolveNewsLocation(options: NewsLocationOptions): ResolvedNewsLocation {
  const normalizedText = normalizeLocationText(`${options.title} ${options.summary || ""}`);

  // Katman 1: İçerikteki şehir/ülke adlarını ara (mevcut)
  const matchedCity = findCityInText(normalizedText, options.sourceCountry);
  if (matchedCity?.lat !== undefined && matchedCity.lng !== undefined) {
    return {
      koordinat: offsetCoordinates(
        matchedCity.lat, matchedCity.lng,
        `${options.seed}-${matchedCity.country}-${matchedCity.name}`, 0.12, 0.18
      ),
      konum: formatCityLocation(matchedCity),
    };
  }

  const matchedCountry = findCountryInText(normalizedText);
  if (matchedCountry) {
    return mapCountryRecordToLocation(matchedCountry, `${options.seed}-${matchedCountry.code || matchedCountry.name}`);
  }

  // Katman 2: Kaynak ülkesi (varsa)
  if (options.sourceCountry) {
    const country = estimateCoordinatesFromCountry(options.sourceCountry, options.seed);
    if (country.konum !== "Global") {
      return { koordinat: country.koordinat, konum: country.konum };
    }
  }

  // Katman 3: Kaynak bölgesi — yalnızca güvenli region fallback'lerinde kullan
  const effectiveRegion = options.sourceRegion
    || (options.sourceName ? SOURCE_REGION_MAP[options.sourceName] : undefined);

  if (
    effectiveRegion &&
    effectiveRegion !== "GLOBAL" &&
    (
      options.allowTrustedRegionFallback
      || isSafeRegionFallback(effectiveRegion, normalizedText)
    )
  ) {
    const regionCountry = estimateCoordinatesFromCountry(effectiveRegion, options.seed);
    if (regionCountry.konum !== "Global") {
      return { koordinat: regionCountry.koordinat, konum: regionCountry.konum };
    }
  }

  // Katman 4: Uluslararası organizasyon / güçlü lokasyon hint'leri
  const orgMatch = ORGANIZATION_LOCATION_HINTS.find((org) =>
    org.keywords.some((keyword) => containsLocationPhrase(normalizedText, keyword))
  );
  if (orgMatch) {
    return {
      koordinat: offsetCoordinates(orgMatch.lat, orgMatch.lng, `${options.seed}-org`, 0.15, 0.22),
      konum: orgMatch.konum,
    };
  }

  const match = LOCATION_HINTS.find((entry) =>
    entry.aliases.some((alias) => isStrongLocationHintMatch(normalizedText, alias))
  );
  if (match) {
    return {
      koordinat: offsetCoordinates(match.lat, match.lng, `${options.seed}-${match.konum}`, 0.18, 0.28),
      konum: match.konum,
    };
  }

  if (options.fallback) {
    return {
      koordinat: offsetCoordinates(options.fallback.lat, options.fallback.lng, options.seed, 0.35, 0.5),
      konum: options.fallback.konum,
    };
  }

  return {
    // Yanlış kıta pinlemektense kontrollü "Global / konumsuz" bırak.
    koordinat: { lat: Number.NaN, lng: Number.NaN },
    konum: "Global",
  };
}

function estimateCoordinatesFromCountry(
  countryCode: string,
  seed = ""
): ResolvedNewsLocation {
  const normalizedCountryCode = countryCode?.toUpperCase() || "";
  const countryRecord = COUNTRY_LOOKUP_BY_CODE.get(normalizedCountryCode);

  if (countryRecord) {
    return mapCountryRecordToLocation(countryRecord, `${normalizedCountryCode}-${seed}`);
  }

  return {
    koordinat: { lat: Number.NaN, lng: Number.NaN },
    konum: "Global",
  };
}

function mapCountryRecordToLocation(
  country: CountryLocationRecord,
  seed: string
): ResolvedNewsLocation {
  const lat = typeof country.lat === "number" ? country.lat : 20;
  const lng = typeof country.lng === "number" ? country.lng : 0;

  return {
    koordinat: offsetCoordinates(lat, lng, seed, 0.55, 0.85),
    konum: country.nameTr || country.name,
  };
}

function findCityInText(text: string, sourceCountry?: string): CityLocationRecord | null {
  for (const entry of CITY_SEARCH_INDEX) {
    if (!containsLocationPhrase(text, entry.key)) {
      continue;
    }

    if (sourceCountry && entry.city.country.toUpperCase() !== sourceCountry.toUpperCase()) {
      const countryRecord = COUNTRY_LOOKUP_BY_CODE.get(entry.city.country.toUpperCase());
      const countryAliases = [countryRecord?.name, countryRecord?.nameTr, entry.city.country]
        .filter((value): value is string => Boolean(value))
        .map((value) => normalizeLocationText(value));

      if (!countryAliases.some((alias) => containsLocationPhrase(text, alias))) {
        continue;
      }
    }

    return entry.city;
  }

  return null;
}

function findCountryInText(text: string): CountryLocationRecord | null {
  const match = COUNTRY_SEARCH_INDEX.find((entry) => containsLocationPhrase(text, entry.key));
  return match?.country || null;
}

function formatCityLocation(city: CityLocationRecord): string {
  const country = COUNTRY_LOOKUP_BY_CODE.get(city.country.toUpperCase());
  const countryName = country?.nameTr || country?.name || city.country;
  return `${city.name}, ${countryName}`;
}

function normalizeLocationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function containsLocationPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = normalizeLocationText(phrase);
  if (!normalizedPhrase) {
    return false;
  }

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(normalizedPhrase).replace(/\s+/g, "\\s+")}([^a-z0-9]|$)`,
    "i"
  );

  return pattern.test(text);
}

function isStrongLocationHintMatch(text: string, phrase: string): boolean {
  const normalizedPhrase = normalizeLocationText(phrase);
  if (normalizedPhrase.length < 4) {
    return false;
  }

  return containsLocationPhrase(text, normalizedPhrase);
}

function isSafeRegionFallback(regionCode: string, text: string): boolean {
  const normalizedRegionCode = regionCode.toUpperCase();
  const countryRecord = COUNTRY_LOOKUP_BY_CODE.get(normalizedRegionCode);

  if (!countryRecord) {
    return false;
  }

  const aliases = [countryRecord.name, countryRecord.nameTr, countryRecord.code]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeLocationText(value));

  return aliases.some((alias) => containsLocationPhrase(text, alias));
}

function isLikelyTurkishText(text: string): boolean {
  const normalized = text.toLowerCase();
  return /[çğıöşü]/i.test(text)
    || normalized.includes(" ve ")
    || normalized.includes(" ile ")
    || normalized.includes(" için ")
    || normalized.includes(" bir ")
    || normalized.includes(" türkiye")
    || normalized.includes(" turkiye");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HEALTH_STRONG_TERMS = [
  "health",
  "hospital",
  "medical",
  "doctor",
  "clinic",
  "patient",
  "vaccine",
  "vaccination",
  "virus",
  "disease",
  "infection",
  "outbreak",
  "epidemic",
  "pandemic",
  "covid",
  "influenza",
  "flu",
  "measles",
  "cholera",
  "dengue",
  "ebola",
  "hepatitis",
  "who",
  "healthcare",
  "public health",
  "sağlık",
  "saglik",
  "hastane",
  "doktor",
  "hekim",
  "hasta",
  "aşı",
  "asi",
  "virüs",
  "virus",
  "salgın",
  "salgin",
  "hastalık",
  "hastalik",
  "enfeksiyon",
  "tedavi",
  "yoğun bakım",
  "yogun bakim",
];

const HEALTH_EXCLUSION_TERMS = [
  "mental health of the economy",
  "economic health",
  "market health",
  "political health",
];

const ECONOMY_TERMS = [
  "economy",
  "economic",
  "inflation",
  "stock",
  "market",
  "trade",
  "gdp",
  "recession",
  "bank",
  "interest rate",
  "central bank",
  "tariff",
  "fiscal",
  "monetary",
  "employment",
  "unemployment",
  "budget",
  "currency",
  "dollar",
  "euro",
  "oil price",
  "commodity",
  "economy",
  "ekonomi",
  "enflasyon",
  "borsa",
  "piyasa",
  "ticaret",
  "gsyh",
  "resesyon",
  "banka",
  "faiz",
  "merkez bankasi",
  "merkez bankası",
  "issizlik",
  "işsizlik",
  "butce",
  "bütçe",
  "kur",
  "doviz",
  "döviz",
];

const TECHNOLOGY_TERMS = [
  "technology",
  "tech",
  "ai",
  "artificial intelligence",
  "chip",
  "chips",
  "semiconductor",
  "gpu",
  "cpu",
  "device",
  "smartphone",
  "software",
  "platform",
  "startup",
  "robotics",
  "cyber",
  "cybersecurity",
  "app",
  "application",
  "cloud",
  "data center",
  "yapay zeka",
  "teknoloji",
  "yazilim",
  "yazılım",
  "cip",
  "çip",
  "yarı iletken",
  "yari iletken",
  "robotik",
  "siber",
  "uygulama",
  "telefon",
  "teknoloji sirketi",
];

const SCIENCE_TERMS = [
  "science",
  "scientist",
  "research",
  "study",
  "laboratory",
  "physics",
  "biology",
  "chemistry",
  "astronomy",
  "space telescope",
  "quantum",
  "experiment",
  "discovery",
  "scientific",
  "climate science",
  "peer reviewed",
  "genome",
  "species",
  "science daily",
  "bilim",
  "bilimsel",
  "arastirma",
  "araştırma",
  "laboratuvar",
  "fizik",
  "biyoloji",
  "kimya",
  "astronomi",
  "kuantum",
  "deney",
  "kesif",
  "keşif",
  "uzay teleskobu",
];

const POLITICS_TERMS = [
  "election",
  "president",
  "minister",
  "parliament",
  "government",
  "nato",
  "diplomacy",
  "sanction",
  "summit",
  "treaty",
  "legislation",
  "congress",
  "senate",
  "opposition",
  "referendum",
  "vote",
  "prime minister",
  "cabinet",
  "foreign ministry",
  "state department",
  "election",
  "seçim",
  "secim",
  "meclis",
  "hükümet",
  "hukumet",
  "cumhurbaskan",
  "cumhurbaşkan",
  "bakan",
  "diplomasi",
  "disisleri",
  "dışişleri",
  "anayasa",
  "mahkeme",
  "aihm",
  "yargi",
  "yargı",
];

const ECONOMY_EXCLUSION_TERMS = [
  "health of democracy",
  "health of the economy",
];

const POLITICS_EXCLUSION_TERMS = [
  "political economy",
];

const TECHNOLOGY_EXCLUSION_TERMS = [
  "technology of war",
  "political technology",
];

const SCIENCE_EXCLUSION_TERMS = [
  "science of politics",
  "science of economics",
];

function matchesStrongHealthSignal(text: string): boolean {
  const normalized = text.toLowerCase();

  if (HEALTH_EXCLUSION_TERMS.some((term) => normalized.includes(term))) {
    return false;
  }

  const matchedTerms = HEALTH_STRONG_TERMS.filter((term) => normalized.includes(term));
  if (matchedTerms.length >= 2) {
    return true;
  }

  return matchedTerms.length === 1 && (
    normalized.includes("who")
    || normalized.includes("cdc")
    || normalized.includes("ecdc")
    || normalized.includes("ministry of health")
    || normalized.includes("saglik bakanligi")
    || normalized.includes("sağlık bakanlığı")
  );
}

function matchesStrongEconomySignal(text: string): boolean {
  const normalized = text.toLowerCase();
  if (ECONOMY_EXCLUSION_TERMS.some((term) => normalized.includes(term))) {
    return false;
  }

  const matchedTerms = ECONOMY_TERMS.filter((term) => normalized.includes(term));
  if (matchedTerms.length >= 2) {
    return true;
  }

  return matchedTerms.length === 1 && (
    normalized.includes("tcmb")
    || normalized.includes("imf")
    || normalized.includes("world bank")
    || normalized.includes("oecd")
    || normalized.includes("ecb")
  );
}

function matchesStrongTechnologySignal(text: string): boolean {
  const normalized = text.toLowerCase();
  if (TECHNOLOGY_EXCLUSION_TERMS.some((term) => normalized.includes(term))) {
    return false;
  }

  const matchedTerms = TECHNOLOGY_TERMS.filter((term) => normalized.includes(term));
  if (matchedTerms.length >= 2) {
    return true;
  }

  return matchedTerms.length === 1 && (
    normalized.includes("techcrunch")
    || normalized.includes("engadget")
    || normalized.includes("ars technica")
    || normalized.includes("technology review")
    || normalized.includes("mit technology review")
  );
}

function matchesStrongScienceSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  if (SCIENCE_EXCLUSION_TERMS.some((term) => normalized.includes(term))) {
    return false;
  }

  const matchedTerms = SCIENCE_TERMS.filter((term) => normalized.includes(term));
  if (matchedTerms.length >= 2) {
    return true;
  }

  return matchedTerms.length === 1 && (
    normalized.includes("sciencedaily")
    || normalized.includes("phys.org")
    || normalized.includes("nature")
    || normalized.includes("new scientist")
  );
}

function matchesStrongPoliticsSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  if (POLITICS_EXCLUSION_TERMS.some((term) => normalized.includes(term))) {
    return false;
  }

  const matchedTerms = POLITICS_TERMS.filter((term) => normalized.includes(term));
  if (matchedTerms.length >= 2) {
    return true;
  }

  return matchedTerms.length === 1 && (
    normalized.includes("mfa")
    || normalized.includes("foreign ministry")
    || normalized.includes("state department")
    || normalized.includes("tbmm")
    || normalized.includes("government")
    || normalized.includes("united nations")
    || normalized.includes("nato")
  );
}

function offsetCoordinates(
  lat: number,
  lng: number,
  seed: string,
  latRange: number,
  lngRange: number
): { lat: number; lng: number } {
  return {
    lat: lat + seededOffset(`${seed}:lat`) * latRange,
    lng: lng + seededOffset(`${seed}:lng`) * lngRange,
  };
}

function seededOffset(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }

  const normalized = ((hash >>> 0) % 1000) / 999;
  return normalized - 0.5;
}
