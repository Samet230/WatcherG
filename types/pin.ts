// WatcherG — Standart pin formatı (v2)
// "Her şey haberdir, konu farklı" mantığı

export interface PinCoordinate {
  lat: number;
  lng: number;
}

export interface Pin {
  id: string;
  kategori: NewsCategory;
  oncelik: NewsPriority;          // ← YENİ: otomatik öncelik
  baslik: string;
  ozet: string;
  icerik?: string;
  koordinat: PinCoordinate;
  konum?: string;                 // ← YENİ: "Hasakah, Syria"
  tarih: string;
  kaynak: string;
  kaynakSkoru: number;
  alternatifKaynaklar: string[];
  renk: string;
  detayUrl: string;
  gorsel?: string;                // ← YENİ: haber görseli
  etiketler?: string[];
}

// ─── KATEGORİLER ─────────────────────────────────
// Eski: "earthquake" | "fire" | "news" | "disaster" | "conflict"
// Yeni: her şey haber, konu farklı

export type NewsCategory =
  | "conflict"   // Çatışma & Savaş Haberleri     → kırmızı
  | "disaster"   // Afet & Deprem Haberleri        → turuncu
  | "health"     // Sağlık Haberleri               → mavi
  | "politics"   // Siyaset & Diplomasi Haberleri  → sarı
  | "economy"    // Ekonomi & Piyasa Haberleri     → yeşil
  | "general"    // Genel Haberler                 → gri
  | "flight"     // Uçuş Takibi (V2)
  | "marine";    // Gemi Takibi (V2)

// Geriye dönük uyumluluk — eski tip adı hâlâ çalışır
export type PinCategory = NewsCategory;

// ─── ÖNCELİK ─────────────────────────────────────

export type NewsPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export const PRIORITY_COLORS: Record<NewsPriority, string> = {
  CRITICAL: "#FF2222",
  HIGH: "#FF6600",
  MEDIUM: "#FFD700",
  LOW: "#888888",
} as const;

export const PRIORITY_BORDER: Record<NewsPriority, string> = {
  CRITICAL: "rgba(255,34,34,0.55)",
  HIGH: "rgba(255,102,0,0.45)",
  MEDIUM: "rgba(255,215,0,0.35)",
  LOW: "rgba(136,136,136,0.25)",
} as const;

// ─── KATEGORİ KONFİGÜRASYONU ─────────────────────

export interface CategoryConfig {
  renk: string;
  etiket: string;            // UI'da gösterilen Türkçe ad
  pencereBaslik: string;     // Haber kartı üst başlığı
  ikon: string;
}

export const CATEGORY_CONFIG: Record<NewsCategory, CategoryConfig> = {
  conflict: { renk: "#FF4444", etiket: "ÇATIŞMA", pencereBaslik: "WHAT HAPPENED", ikon: "⚔️" },
  disaster: { renk: "#FF8800", etiket: "AFET & DEPREM", pencereBaslik: "IMPACT REPORT", ikon: "🌊" },
  health: { renk: "#4488FF", etiket: "SAĞLIK", pencereBaslik: "HEALTH ALERT", ikon: "🏥" },
  politics: { renk: "#FFD700", etiket: "SİYASET", pencereBaslik: "BRIEFING", ikon: "🏛️" },
  economy: { renk: "#00FF88", etiket: "EKONOMİ", pencereBaslik: "MARKET UPDATE", ikon: "📊" },
  general: { renk: "#888888", etiket: "GENEL", pencereBaslik: "UPDATE", ikon: "📰" },
  flight: { renk: "#88FFFF", etiket: "UÇUŞ", pencereBaslik: "FLIGHT STATUS", ikon: "✈️" },
  marine: { renk: "#FFFF44", etiket: "GEMİ", pencereBaslik: "MARINE UPDATE", ikon: "🚢" },
} as const;

// Geriye dönük uyumluluk
export const CATEGORY_COLORS: Record<NewsCategory, string> = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([k, v]) => [k, v.renk])
) as Record<NewsCategory, string>;

// ─── OTOMATİK ÖNCELİK ────────────────────────────

const CRITICAL_KW = [
  "missile", "füze", "explosion", "patlama", "attack", "saldırı",
  "war", "savaş", "nuclear", "nükleer", "magnitude 7", "7.0",
  "tsunami", "outbreak", "salgın", "emergency", "acil",
  "breaking", "son dakika", "critical", "kritik", "blast", "airstrike",
];
const HIGH_KW = [
  "conflict", "çatışma", "earthquake", "deprem", "fire", "yangın",
  "flood", "sel", "hurricane", "kasırga", "killed", "öldü",
  "casualties", "kayıp", "magnitude 5", "magnitude 6",
  "crisis", "kriz", "alert", "uyarı", "threat", "tehdit", "troops",
];
const MEDIUM_KW = [
  "protest", "protesto", "election", "seçim", "sanction", "yaptırım",
  "arrest", "tutuklama", "strike", "grev", "accident", "kaza",
  "magnitude 4", "moderate", "orta", "injury", "yaralı",
];

export function calculatePriority(
  baslik: string,
  ozet: string,
  kategori: NewsCategory
): NewsPriority {
  const text = `${baslik} ${ozet}`.toLowerCase();

  // Çatışma ve afet haberleri en az MEDIUM
  if (kategori === "conflict" || kategori === "disaster") {
    if (CRITICAL_KW.some(k => text.includes(k))) return "CRITICAL";
    if (HIGH_KW.some(k => text.includes(k))) return "HIGH";
    return "MEDIUM";
  }

  if (CRITICAL_KW.some(k => text.includes(k))) return "CRITICAL";
  if (HIGH_KW.some(k => text.includes(k))) return "HIGH";
  if (MEDIUM_KW.some(k => text.includes(k))) return "MEDIUM";
  return "LOW";
}

// ─── GÜVENİLİRLİK ────────────────────────────────

export type ReliabilityGroup = "unreliable" | "suspicious" | "reliable" | "guaranteed";

export const RELIABILITY_THRESHOLDS = {
  UNRELIABLE_MAX: 30,
  SUSPICIOUS_MAX: 60,
  RELIABLE_MAX: 85,
} as const;

export function getReliabilityGroup(score: number): ReliabilityGroup {
  if (score <= RELIABILITY_THRESHOLDS.UNRELIABLE_MAX) return "unreliable";
  if (score <= RELIABILITY_THRESHOLDS.SUSPICIOUS_MAX) return "suspicious";
  if (score <= RELIABILITY_THRESHOLDS.RELIABLE_MAX) return "reliable";
  return "guaranteed";
}

// ─── YARDIMCI ─────────────────────────────────────

export function getPinSize(pin: Pin): number {
  const base: Record<NewsPriority, number> = {
    CRITICAL: 14, HIGH: 10, MEDIUM: 7, LOW: 5,
  };
  return base[pin.oncelik] ?? 6;
}

export function getTimeLabel(tarih: string): string {
  if (!tarih) return "yakın zamanda";
  const t = new Date(tarih).getTime();
  if (Number.isNaN(t)) return "yakın zamanda";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min}dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}s önce`;
  return `${Math.floor(hr / 24)}g önce`;
}
