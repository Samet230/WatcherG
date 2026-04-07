import type { Pin, NewsCategory, NewsPriority } from "@/types/pin";
import { CATEGORY_CONFIG, getTimeLabel } from "@/types/pin";

export interface FeedStats {
  total: number;
  critical: number;
  high: number;
  sources: number;
  mapped: number;
  peakHour: number;
}

export interface CommandPanelBucket {
  label: string;
  value: number;
  pct: number;
}

export interface CommandPanelMetrics {
  buckets: CommandPanelBucket[];
  peakLabel: string;
  peakValue: number;
  critical: number;
  high: number;
  mappedRatio: number;
  dominantCategory: string;
  surgePct: number;
}

export interface FeedItem {
  id: string;
  title: string;
  source: string;
  sourceCode: string;
  timeLabel: string;
  location: string;
  highlight: string;
  url: string;
  categoryLabel: string;
}

export interface RegionItem {
  code: string;
  name: string;
  value: number;
  pct: number;
  color: string;
}

export interface CategoryItem {
  key: NewsCategory;
  label: string;
  color: string;
  value: number;
}

export interface SourceItem {
  name: string;
  value: number;
  color: string;
  lastSeen: string;
}

type FeedSortMode = "latest" | "priority";

const PRIORITY_WEIGHT: Record<NewsPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

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

const REGION_CODES: Record<string, string> = {
  Turkiye: "TR",
  Turkey: "TR",
  Iran: "IR",
  Israil: "IL",
  Israel: "IL",
  Lubnan: "LB",
  Lebanon: "LB",
  Suriye: "SY",
  Syria: "SY",
  Ukraine: "UA",
  Ukrayna: "UA",
  Russia: "RU",
  Rusya: "RU",
  Libya: "LY",
  Algeria: "DZ",
  Cezayir: "DZ",
  Morocco: "MA",
  Fas: "MA",
  Greece: "GR",
  Yunanistan: "GR",
  Spain: "ES",
  Ispanya: "ES",
  "United States": "US",
  USA: "US",
  ABD: "US",
  "United Kingdom": "GB",
  England: "GB",
  Fransa: "FR",
  France: "FR",
  Germany: "DE",
  Almanya: "DE",
  Japan: "JP",
  Japonya: "JP",
};

export function getFeedStats(pins: Pin[]): FeedStats {
  const hourlyBuckets = buildHourlyBuckets(pins);

  return {
    total: pins.length,
    critical: pins.filter((pin) => pin.oncelik === "CRITICAL").length,
    high: pins.filter((pin) => pin.oncelik === "HIGH").length,
    sources: new Set(pins.map((pin) => pin.kaynak)).size,
    mapped: pins.filter((pin) => Number.isFinite(pin.koordinat.lat) && Number.isFinite(pin.koordinat.lng)).length,
    peakHour: Math.max(0, ...hourlyBuckets),
  };
}

export function getFeedItems(pins: Pin[], limit = 6, mode: FeedSortMode = "latest"): FeedItem[] {
  return [...pins]
    .sort(mode === "priority" ? comparePriorityPins : compareLatestPins)
    .slice(0, limit)
    .map((pin) => ({
      id: pin.id,
      title: pin.baslik,
      source: pin.kaynak,
      sourceCode: getSourceCode(pin.kaynak),
      timeLabel: getTimeLabel(pin.tarih),
      location: getLocationLabel(pin),
      highlight: pin.renk || CATEGORY_CONFIG[pin.kategori].renk,
      url: pin.detayUrl,
      categoryLabel: CATEGORY_CONFIG[pin.kategori]?.etiket || pin.kategori.toUpperCase(),
    }));
}

export function getRegionItems(pins: Pin[], limit = 5): RegionItem[] {
  const grouped = new Map<string, { count: number; color: string; priority: NewsPriority }>();

  for (const pin of pins) {
    const name = getRegionName(pin);
    const existing = grouped.get(name);
    if (existing) {
      existing.count += 1;
      if (PRIORITY_WEIGHT[pin.oncelik] > PRIORITY_WEIGHT[existing.priority]) {
        existing.color = pin.renk;
        existing.priority = pin.oncelik;
      }
    } else {
      grouped.set(name, { count: 1, color: pin.renk, priority: pin.oncelik });
    }
  }

  const items = Array.from(grouped.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit);
  const maxCount = items[0]?.[1].count || 1;

  return items.map(([name, data]) => ({
    code: REGION_CODES[normalizeRegionKey(name)] || "??",
    name,
    value: data.count,
    pct: Math.max(10, Math.round((data.count / maxCount) * 100)),
    color: data.color,
  }));
}

export function getCategoryItems(pins: Pin[]): CategoryItem[] {
  return CATEGORY_ORDER.map((key) => ({
    key,
    label: CATEGORY_CONFIG[key].etiket,
    color: CATEGORY_CONFIG[key].renk,
    value: pins.filter((pin) => pin.kategori === key).length,
  })).filter((item) => item.value > 0);
}

export function getSourceItems(pins: Pin[], limit = 4): SourceItem[] {
  const grouped = new Map<string, { count: number; color: string; latest: string }>();

  for (const pin of pins) {
    const existing = grouped.get(pin.kaynak);
    if (existing) {
      existing.count += 1;
      if (new Date(pin.tarih).getTime() > new Date(existing.latest).getTime()) {
        existing.latest = pin.tarih;
      }
    } else {
      grouped.set(pin.kaynak, {
        count: 1,
        color: pin.renk || CATEGORY_CONFIG[pin.kategori].renk,
        latest: pin.tarih,
      });
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([name, data]) => ({
      name,
      value: data.count,
      color: data.color,
      lastSeen: getTimeLabel(data.latest),
    }));
}

export function buildSparklinePath(pins: Pin[]): string {
  const values = buildHourlyBuckets(pins);
  const max = Math.max(1, ...values);

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 28 - (value / max) * 24;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function getCommandPanelMetrics(pins: Pin[]): CommandPanelMetrics {
  const buckets = buildRecentBuckets(pins, 6, 2);
  const maxValue = Math.max(1, ...buckets.map((bucket) => bucket.value));
  const critical = pins.filter((pin) => pin.oncelik === "CRITICAL").length;
  const high = pins.filter((pin) => pin.oncelik === "HIGH").length;
  const mapped = pins.filter(
    (pin) => Number.isFinite(pin.koordinat.lat) && Number.isFinite(pin.koordinat.lng)
  ).length;
  const dominantCategory =
    getCategoryItems(pins).sort((left, right) => right.value - left.value)[0]?.label || "N/A";

  const latestValue = buckets[buckets.length - 1]?.value || 0;
  const previousValues = buckets.slice(0, -1).map((bucket) => bucket.value);
  const previousAverage =
    previousValues.length > 0
      ? previousValues.reduce((total, value) => total + value, 0) / previousValues.length
      : 0;
  const surgePct =
    previousAverage > 0
      ? Math.round(((latestValue - previousAverage) / previousAverage) * 100)
      : latestValue > 0
        ? 100
        : 0;

  const peakBucket = buckets.reduce(
    (best, bucket) => (bucket.value > best.value ? bucket : best),
    buckets[0] || { label: "NOW", value: 0, pct: 0 }
  );

  return {
    buckets: buckets.map((bucket) => ({
      ...bucket,
      pct: Math.max(10, Math.round((bucket.value / maxValue) * 100)),
    })),
    peakLabel: peakBucket.label,
    peakValue: peakBucket.value,
    critical,
    high,
    mappedRatio: pins.length > 0 ? Math.round((mapped / pins.length) * 100) : 0,
    dominantCategory,
    surgePct,
  };
}

export function formatSyncLabel(lastUpdated: string | null): string {
  if (!lastUpdated) return "--:-- UTC";

  return new Date(lastUpdated).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
}

export function getLocationLabel(pin: Pin): string {
  return pin.konum?.trim() || inferLocationFromTitle(pin.baslik) || "Belirsiz";
}

function getRegionName(pin: Pin): string {
  const location = getLocationLabel(pin);
  if (location.includes(",")) {
    return location.split(",").pop()?.trim() || location;
  }
  return location;
}

function inferLocationFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  const matches = Object.keys(REGION_CODES).filter((name) => lower.includes(name.toLowerCase()));
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.length - a.length)[0];
}

function buildHourlyBuckets(pins: Pin[]): number[] {
  const now = Date.now();
  const buckets = Array.from({ length: 12 }, () => 0);

  for (const pin of pins) {
    const ageHours = (now - new Date(pin.tarih).getTime()) / 3600000;
    if (ageHours < 0 || ageHours > 24) continue;
    const bucketIndex = Math.min(11, Math.floor(ageHours / 2));
    buckets[11 - bucketIndex] += 1;
  }

  return buckets;
}

function buildRecentBuckets(
  pins: Pin[],
  bucketCount: number,
  bucketHours: number
): CommandPanelBucket[] {
  const now = Date.now();
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: index === bucketCount - 1 ? "NOW" : `-${(bucketCount - index - 1) * bucketHours}H`,
    value: 0,
    pct: 0,
  }));

  for (const pin of pins) {
    const timestamp = new Date(pin.tarih).getTime();
    if (Number.isNaN(timestamp)) continue;

    const ageHours = (now - timestamp) / 3600000;
    if (ageHours < 0 || ageHours > bucketCount * bucketHours) continue;

    const bucketIndex = Math.min(bucketCount - 1, Math.floor(ageHours / bucketHours));
    buckets[bucketCount - 1 - bucketIndex].value += 1;
  }

  return buckets;
}

function compareLatestPins(a: Pin, b: Pin): number {
  const timeDiff = new Date(b.tarih).getTime() - new Date(a.tarih).getTime();
  if (Math.abs(timeDiff) > 30 * 60 * 1000) return timeDiff;

  const priorityDiff = PRIORITY_WEIGHT[b.oncelik] - PRIORITY_WEIGHT[a.oncelik];
  if (priorityDiff !== 0) return priorityDiff;
  return timeDiff;
}

function comparePriorityPins(a: Pin, b: Pin): number {
  const priorityDiff = PRIORITY_WEIGHT[b.oncelik] - PRIORITY_WEIGHT[a.oncelik];
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(b.tarih).getTime() - new Date(a.tarih).getTime();
}

function getSourceCode(source: string): string {
  const hostname = source
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[./\s-]/)
    .find(Boolean);

  return (hostname || source || "src").slice(0, 2).toUpperCase();
}

function normalizeRegionKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z ]/g, "")
    .trim();
}
