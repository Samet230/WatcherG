// WatcherG — Veri standardizasyon katmanı (v2)
// "Her şey haberdir, konu farklı"
// Tüm dış API kaynaklarını → NewsCategory Pin formatına çevirir

import type { Pin, NewsCategory } from "@/types/pin";
import { CATEGORY_CONFIG, CATEGORY_COLORS, calculatePriority } from "@/types/pin";
import type { UsgsEarthquakeFeature } from "@/lib/apis/usgs";
import type { GdeltArticle } from "@/lib/apis/gdelt";
import type { GuardianArticle } from "@/lib/apis/guardian";
import type { NewsDataArticle } from "@/lib/apis/newsdata";
import type { RssArticle } from "@/lib/apis/turkish_news";
import type { EonetEvent } from "@/lib/apis/nasa";
import type { FirmsFireRecord } from "@/lib/apis/firms";

// ─── DEPREM → "AFET & DEPREM HABERİ" ─────────────

export function formatEarthquakeToPin(feature: UsgsEarthquakeFeature): Pin {
  const { properties, geometry, id } = feature;
  const [longitude, latitude, depth] = geometry.coordinates;
  const mag = properties.mag;

  const baslik = properties.title;
  const ozet = `Büyüklük ${mag} deprem ${depth} km derinlikte meydana geldi.`;
  const kategori: NewsCategory = "disaster";
  const oncelik = calculatePriority(baslik, ozet, kategori);

  return {
    id: `eq_${id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: { lat: latitude, lng: longitude },
    konum: properties.place || undefined,
    tarih: new Date(properties.time).toISOString(),
    kaynak: "USGS",
    kaynakSkoru: 95,
    alternatifKaynaklar: [],
    renk: getEarthquakeColor(mag),
    detayUrl: properties.url,
    etiketler: ["deprem", `m${Math.floor(mag)}`, "afet"],
  };
}

export function formatEarthquakesToPins(features: UsgsEarthquakeFeature[]): Pin[] {
  return features.map(formatEarthquakeToPin);
}

function getEarthquakeColor(magnitude: number): string {
  if (magnitude >= 7.0) return "#FF0000";
  if (magnitude >= 5.0) return "#FF6600";
  if (magnitude >= 4.0) return "#FF8800";
  if (magnitude >= 3.0) return "#FFAA00";
  return "#FFCC44";
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

  if (["virus", "disease", "outbreak", "epidemic", "pandemic", "covid", "hospital",
    "health", "vaccine", "sağlık", "salgın", "hastalık", "who", "mortality",
    "deaths", "fatalities"].some(w => text.includes(w))) return "health";

  if (["economy", "ekonomi", "market", "piyasa", "stock", "borsa", "inflation",
    "enflasyon", "bank", "banka", "trade", "ticaret", "gdp", "recession",
    "crypto", "dollar", "euro", "oil", "petrol"].some(w => text.includes(w))) return "economy";

  if (["election", "seçim", "president", "başkan", "minister", "parliament", "nato",
    "united nations", " un ", "diplomacy", "sanction", "yaptırım", "summit",
    "treaty", "anlaşma", "government", "hükümet"].some(w => text.includes(w))) return "politics";

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
    kaynakSkoru: 70,
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
    kaynakSkoru: 55,
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
  if (["science", "health"].includes(section)) return "health";
  if (["environment"].includes(section)) return "disaster";

  if (section === "world" || section === "us-news") {
    if (["war", "attack", "military", "conflict", "missile", "bomb", "airstrike"].some(w => title.includes(w))) return "conflict";
    if (["earthquake", "flood", "fire", "hurricane", "disaster", "tsunami"].some(w => title.includes(w))) return "disaster";
    if (["health", "disease", "virus", "hospital", "outbreak"].some(w => title.includes(w))) return "health";
    return "politics";
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
    kaynakSkoru: 90,
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
  if (["sağlık", "hasta", "virüs", "salgın", "hastane", "aşı", "vaka"].some(w => t.includes(w))) return "health";
  if (["seçim", "meclis", "hükümet", "cumhurbaşkan", "bakan", "nato", "erdoğan"].some(w => t.includes(w))) return "politics";
  if (["ekonomi", "borsa", "dolar", "enflasyon", "piyasa", "banka", "faiz"].some(w => t.includes(w))) return "economy";
  return "general";
}

export function formatRssToPin(article: RssArticle, index: number): Pin {
  const baslik = article.title;
  const ozet = article.description?.substring(0, 120) || "Detay için tıklayın";
  const kategori = inferCategoryFromTurkish(baslik + " " + ozet);
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    seed: `${article.link}-${index}`,
    fallback: { lat: 39.0, lng: 35.0, konum: "Türkiye" },
  });

  return {
    id: `rss_${index}_${Date.now()}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.pubDate,
    kaynak: article.source,
    kaynakSkoru: article.reliability,
    alternatifKaynaklar: [],
    renk: CATEGORY_COLORS[kategori],
    detayUrl: article.link,
    etiketler: [kategori, "türkiye"].filter(Boolean) as string[],
  };
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
  const ozet = event.description || `${catInfo.title} — NASA EONET`;
  const oncelik = calculatePriority(baslik, ozet, kategori);

  return {
    id: `eonet_${event.id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: { lat, lng },
    tarih: new Date(latestGeometry.date).toISOString(),
    kaynak: "NASA EONET",
    kaynakSkoru: 95,
    alternatifKaynaklar: event.sources?.map(s => s.url) || [],
    renk: CATEGORY_CONFIG[kategori].renk,
    detayUrl: event.sources?.[0]?.url || event.link,
    etiketler: ["afet", catInfo.id.toLowerCase(), "nasa"],
  };
}

export function formatEonetToPins(events: EonetEvent[]): Pin[] {
  return events.map(formatEonetToPin).filter((p): p is Pin => p !== null);
}

export function formatNewsDataToPin(article: NewsDataArticle): Pin {
  const kategori = inferCategoryFromTurkish(
    `${article.title} ${article.description || ""} ${(article.category || []).join(" ")}`
  );
  const baslik = article.title;
  const ozet = article.description?.substring(0, 140) || `Kaynak: ${article.source_name}`;
  const oncelik = calculatePriority(baslik, ozet, kategori);
  const countryCode = article.country?.[0]?.toUpperCase();
  const location = resolveNewsLocation({
    title: baslik,
    summary: ozet,
    sourceCountry: countryCode,
    seed: article.article_id,
  });

  return {
    id: `newsdata_${article.article_id}`,
    kategori,
    oncelik,
    baslik,
    ozet,
    koordinat: location.koordinat,
    konum: location.konum,
    tarih: article.pubDate,
    kaynak: article.source_name || article.source_id || "NewsData",
    kaynakSkoru: 78,
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

    return {
      id: `firms_${record.acq_date}_${record.acq_time}_${index}`,
      kategori,
      oncelik,
      baslik,
      ozet,
      koordinat: { lat: record.latitude, lng: record.longitude },
      tarih: formatFirmsDate(record.acq_date, record.acq_time),
      kaynak: "NASA FIRMS",
      kaynakSkoru: 96,
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

// ─── YARDIMCI ─────────────────────────────────────

function formatGdeltDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return new Date().toISOString();
  const y = dateStr.substring(0, 4), m = dateStr.substring(4, 6),
    d = dateStr.substring(6, 8), h = dateStr.substring(8, 10) || "00",
    min = dateStr.substring(10, 12) || "00";
  return `${y}-${m}-${d}T${h}:${min}:00Z`;
}

interface ResolvedNewsLocation {
  koordinat: { lat: number; lng: number };
  konum: string;
}

interface NewsLocationOptions {
  title: string;
  summary?: string;
  sourceCountry?: string;
  seed: string;
  fallback?: { lat: number; lng: number; konum: string };
}

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
  { aliases: ["sudan", "khartoum"], konum: "Sudan", lat: 15.5007, lng: 32.5599 },
  { aliases: ["yemen", "sanaa"], konum: "Yemen", lat: 15.3694, lng: 44.191 },
];

function resolveNewsLocation(options: NewsLocationOptions): ResolvedNewsLocation {
  const text = `${options.title} ${options.summary || ""}`.toLowerCase();
  const match = LOCATION_HINTS.find((entry) => entry.aliases.some((alias) => text.includes(alias)));

  if (match) {
    return {
      koordinat: offsetCoordinates(match.lat, match.lng, `${options.seed}-${match.konum}`, 0.18, 0.28),
      konum: match.konum,
    };
  }

  if (options.sourceCountry) {
    const country = estimateCoordinatesFromCountry(options.sourceCountry, options.seed);
    return {
      koordinat: country.koordinat,
      konum: country.konum,
    };
  }

  if (options.fallback) {
    return {
      koordinat: offsetCoordinates(options.fallback.lat, options.fallback.lng, options.seed, 0.35, 0.5),
      konum: options.fallback.konum,
    };
  }

  return {
    koordinat: offsetCoordinates(20, 0, options.seed || "global", 8, 12),
    konum: "Global",
  };
}

function estimateCoordinatesFromCountry(
  countryCode: string,
  seed = ""
): ResolvedNewsLocation {
  const MAP: Record<string, [number, number]> = {
    US: [-97, 38], GB: [-0.1, 51.5], TR: [35, 39], DE: [10, 51], FR: [2, 46], IN: [78, 20],
    CN: [105, 35], JP: [138, 36], RU: [37, 55], BR: [-51, -14], AU: [134, -25], EG: [30, 26],
    NG: [8, 9], ZA: [25, -30], MX: [-102, 23], IT: [12, 42], ES: [-4, 40], KR: [128, 36],
    SA: [45, 24], UA: [32, 49], PL: [20, 52], IL: [34.8, 31], IR: [53, 32], PK: [70, 30],
    SY: [38, 35], IQ: [44, 33], LB: [35.5, 33.8], YE: [47.5, 15.5], AF: [67.7, 33.9],
    LY: [17.2, 26.3], SD: [32.5, 15.5], ET: [40.5, 9.1], SO: [46, 5], MM: [96, 17],
  };
  const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", GB: "United Kingdom", TR: "Türkiye", DE: "Germany", FR: "France", IN: "India",
    CN: "China", JP: "Japan", RU: "Russia", BR: "Brazil", AU: "Australia", EG: "Egypt",
    NG: "Nigeria", ZA: "South Africa", MX: "Mexico", IT: "Italy", ES: "Spain", KR: "South Korea",
    SA: "Saudi Arabia", UA: "Ukraine", PL: "Poland", IL: "Israel", IR: "Iran", PK: "Pakistan",
    SY: "Syria", IQ: "Iraq", LB: "Lebanon", YE: "Yemen", AF: "Afghanistan",
    LY: "Libya", SD: "Sudan", ET: "Ethiopia", SO: "Somalia", MM: "Myanmar",
  };
  const c = MAP[countryCode?.toUpperCase()];
  if (c) {
    const normalizedCountry = countryCode?.toUpperCase() || "";
    return {
      koordinat: offsetCoordinates(c[1], c[0], `${countryCode}-${seed}`, 0.55, 0.85),
      konum: COUNTRY_NAMES[normalizedCountry] || normalizedCountry,
    };
  }
  return {
    koordinat: offsetCoordinates(20, 0, seed || countryCode || "fallback", 12, 18),
    konum: "Global",
  };
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
