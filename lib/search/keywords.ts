// WatcherG — Keyword matching sistemi (v2)
// "Her şey haber, konu farklı" — eski kategoriler yeni sisteme map edildi

import type { PinCategory } from "@/types/pin";

// Anahtar kelime → yeni kategori eşleştirmesi
const CATEGORY_KEYWORDS: Record<PinCategory, string[]> = {
  conflict: [
    "çatışma", "conflict", "savaş", "war", "terör", "terror",
    "saldırı", "attack", "bomba", "bomb", "patlama", "explosion",
    "askeri", "military", "silahlı", "armed", "füze", "missile",
    "operasyon", "operation", "kuşatma", "siege", "hava saldırısı",
    "airstrike", "muharebe", "combat", "isyan", "revolt",
  ],
  disaster: [
    "afet", "disaster", "deprem", "earthquake", "sel", "flood",
    "tsunami", "kasırga", "hurricane", "fırtına", "storm",
    "toprak kayması", "landslide", "volkan", "volcano",
    "yangın", "fire", "orman yangını", "wildfire", "sismik", "seismic",
    "richter", "büyüklük", "magnitude", "quake", "artçı", "aftershock",
    "kuraklık", "drought", "don", "frost", "erozyon",
  ],
  health: [
    "sağlık", "health", "pandemi", "pandemic", "salgın", "outbreak",
    "virüs", "virus", "hastane", "hospital", "aşı", "vaccine",
    "covid", "grip", "flu", "ebola", "vaka", "case",
    "ölü", "deaths", "mortalite", "mortality", "karantina", "quarantine",
    "ilaç", "drug", "tedavi", "treatment", "hasta", "patient",
  ],
  politics: [
    "siyaset", "politics", "seçim", "election", "cumhurbaşkan", "president",
    "bakan", "minister", "meclis", "parliament", "hükümet", "government",
    "nato", "un ", "birleşmiş milletler", "united nations",
    "diplomasi", "diplomacy", "yaptırım", "sanction", "zirve", "summit",
    "anlaşma", "treaty", "ittifak", "alliance", "muhalefet", "opposition",
    "parti", "party", "oy", "vote", "referandum",
  ],
  economy: [
    "ekonomi", "economy", "piyasa", "market", "borsa", "stock",
    "enflasyon", "inflation", "dolar", "dollar", "euro", "kur", "exchange",
    "banka", "bank", "faiz", "interest rate", "gdp", "büyüme", "growth",
    "işsizlik", "unemployment", "ticaret", "trade", "ihracat", "export",
    "petrol", "oil", "kripto", "crypto", "bitcoin", "resesyon", "recession",
    "imf", "dünya bankası", "world bank",
  ],
  general: [
    "haber", "news", "son dakika", "breaking", "gündem", "agenda",
    "gelişme", "development", "olay", "incident", "açıklama", "statement",
    "basın", "press", "medya", "media", "gazete", "newspaper",
  ],
  flight: [
    "uçak", "flight", "havalimanı", "airport", "uçuş", "havacılık",
    "aviation", "pilot", "airline", "hava yolu",
  ],
  marine: [
    "gemi", "ship", "deniz", "marine", "denizcilik", "liman",
    "port", "tanker", "feribot", "ferry", "deniz kuvvetleri",
  ],
};

// Ülke isimleri → ISO kodu
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  TR: ["türkiye", "turkey", "istanbul", "ankara", "izmir", "antalya", "bursa", "adana"],
  US: ["amerika", "usa", "abd", "united states", "washington", "new york", "california", "texas"],
  GB: ["ingiltere", "uk", "londra", "london", "england", "britain", "wales", "scotland"],
  DE: ["almanya", "germany", "berlin", "münih", "munich", "frankfurt", "hamburg"],
  FR: ["fransa", "france", "paris", "lyon", "marseille"],
  IT: ["italya", "italy", "roma", "rome", "milano", "milan", "napoli"],
  JP: ["japonya", "japan", "tokyo", "osaka", "kyoto"],
  CN: ["çin", "china", "pekin", "beijing", "şangay", "shanghai"],
  RU: ["rusya", "russia", "moskova", "moscow", "putin"],
  IN: ["hindistan", "india", "delhi", "mumbai", "bangalore"],
  BR: ["brezilya", "brazil", "rio", "sao paulo", "brasilia"],
  AU: ["avustralya", "australia", "sydney", "melbourne", "brisbane"],
  EG: ["mısır", "egypt", "kahire", "cairo"],
  SA: ["suudi arabistan", "saudi arabia", "riyad", "riyadh", "cidde"],
  UA: ["ukrayna", "ukraine", "kiev", "kyiv", "kharkiv", "odessa", "zelenskyy"],
  SY: ["suriye", "syria", "şam", "damascus", "halep", "aleppo"],
  IR: ["iran", "tahran", "tehran", "isfahan"],
  IL: ["israil", "israel", "kudüs", "jerusalem", "tel aviv", "gazze", "netanyahu"],
  GR: ["yunanistan", "greece", "atina", "athens"],
  PK: ["pakistan", "islamabad", "karaçi", "karachi", "lahore"],
  MX: ["meksika", "mexico city"],
  KR: ["güney kore", "south korea", "seul", "seoul"],
  LB: ["lübnan", "lebanon", "beyrut", "beirut"],
  IQ: ["irak", "iraq", "bağdat", "baghdad", "musul", "mosul"],
  YE: ["yemen", "sana", "sanaa", "aden"],
  AF: ["afganistan", "afghanistan", "kabil", "kabul"],
  LY: ["libya", "trablus", "tripoli"],
};

// Kıta → ülke kodları
const CONTINENT_KEYWORDS: Record<string, string[]> = {
  avrupa:    ["TR", "GB", "DE", "FR", "IT", "GR", "UA", "RU", "PL"],
  asya:      ["JP", "CN", "IN", "KR", "PK", "IR", "SA", "SY", "IL", "IQ", "AF"],
  "orta doğu": ["SA", "IL", "IR", "SY", "IQ", "LB", "YE", "JO"],
  afrika:    ["EG", "NG", "ZA", "LY", "ET", "SD"],
  amerika:   ["US", "BR", "MX", "CA", "AR", "CO"],
  okyanusya: ["AU", "NZ"],
};

export interface SearchResult {
  categories: PinCategory[];
  countryCodes: string[];
  scopeLevel: "global" | "continent" | "country" | "city";
  rawQuery: string;
  matchedKeywords: string[];
}

export function analyzeSearchQuery(query: string): SearchResult {
  const q = query.toLowerCase().trim();
  const matchedCategories = new Set<PinCategory>();
  const matchedCountries  = new Set<string>();
  const matchedKeywords: string[] = [];
  let scopeLevel: SearchResult["scopeLevel"] = "global";

  // Kategori eşleştirme
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw)) {
        matchedCategories.add(category as PinCategory);
        matchedKeywords.push(kw);
      }
    }
  }

  // Ülke eşleştirme
  for (const [code, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw)) {
        matchedCountries.add(code);
        matchedKeywords.push(kw);
        scopeLevel = "country";
      }
    }
  }

  // Kıta eşleştirme
  for (const [continent, countries] of Object.entries(CONTINENT_KEYWORDS)) {
    if (q.includes(continent)) {
      countries.forEach(c => matchedCountries.add(c));
      matchedKeywords.push(continent);
      if (scopeLevel === "global") scopeLevel = "continent";
    }
  }

  return {
    categories:      Array.from(matchedCategories),
    countryCodes:    Array.from(matchedCountries),
    scopeLevel,
    rawQuery:        query,
    matchedKeywords,
  };
}

export function getSuggestions(partialQuery: string, maxResults = 8): string[] {
  const q = partialQuery.toLowerCase().trim();
  if (q.length < 2) return [];

  const all: string[] = [
    ...Object.values(CATEGORY_KEYWORDS).flat(),
    ...Object.values(COUNTRY_KEYWORDS).flat(),
  ];

const unique = all.filter(kw => kw.includes(q)).filter((kw, i, arr) => arr.indexOf(kw) === i);
  return unique.slice(0, maxResults);}