import type { NewsAlternativeSource, NewsEventMeta, Pin } from "@/types/pin";
import { normalizeText } from "@/lib/server/geo";

interface ClusterCandidate {
  pin: Pin;
  normalizedTitle: string;
  normalizedSummary: string;
  titleTokens: Set<string>;
  summaryTokens: Set<string>;
  normalizedLocation: string;
  timestamp: number;
}

interface PinCluster {
  key: string;
  pins: ClusterCandidate[];
}

export interface ClusterNewsPinsResult {
  pins: Pin[];
  meta: {
    rawCount: number;
    clusteredCount: number;
    mergedCount: number;
    multiSourceClusterCount: number;
  };
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "over",
  "after",
  "amid",
  "that",
  "this",
  "are",
  "was",
  "were",
  "will",
  "has",
  "have",
  "had",
  "about",
  "near",
  "news",
  "update",
  "report",
  "reports",
  "world",
  "says",
  "say",
  "son",
  "dakika",
  "ile",
  "icin",
  "ve",
  "bir",
  "gore",
  "olan",
  "more",
  "than",
  "into",
  "onto",
]);

const LOCATION_STOP_WORDS = new Set(["north", "south", "east", "west", "central", "northern", "southern"]);
const MAX_CLUSTER_WINDOW_MS = 18 * 60 * 60 * 1000;

export function clusterNewsPins(pins: Pin[]): ClusterNewsPinsResult {
  const candidates = pins
    .map((pin) => createCandidate(pin))
    .sort((left, right) => right.timestamp - left.timestamp);

  const clusters: PinCluster[] = [];

  candidates.forEach((candidate) => {
    const matchedCluster = clusters.find((cluster) => isMatchingCluster(cluster, candidate));

    if (matchedCluster) {
      matchedCluster.pins.push(candidate);
      return;
    }

    clusters.push({
      key: buildClusterKey(candidate),
      pins: [candidate],
    });
  });

  const clusteredPins = clusters.map((cluster, index) => buildClusteredPin(cluster, index));

  return {
    pins: clusteredPins.sort((left, right) => new Date(right.tarih).getTime() - new Date(left.tarih).getTime()),
    meta: {
      rawCount: pins.length,
      clusteredCount: clusteredPins.length,
      mergedCount: Math.max(pins.length - clusteredPins.length, 0),
      multiSourceClusterCount: clusters.filter((cluster) => getUniqueSourceNames(cluster).length > 1).length,
    },
  };
}

function createCandidate(pin: Pin): ClusterCandidate {
  const normalizedTitle = normalizeText(pin.baslik);
  const normalizedSummary = normalizeText(pin.ozet || "");

  return {
    pin,
    normalizedTitle,
    normalizedSummary,
    titleTokens: buildTokenSet(normalizedTitle),
    summaryTokens: buildTokenSet(normalizedSummary),
    normalizedLocation: normalizeLocation(pin.konum),
    timestamp: toTimestamp(pin.tarih),
  };
}

function buildTokenSet(text: string): Set<string> {
  return new Set(
    text
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
  );
}

function normalizeLocation(location?: string): string {
  if (!location) {
    return "";
  }

  return normalizeText(location)
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3 && !LOCATION_STOP_WORDS.has(token))
    .slice(0, 4)
    .join(" ");
}

function isMatchingCluster(cluster: PinCluster, candidate: ClusterCandidate): boolean {
  const representative = cluster.pins[0];
  const isSensitiveCategory = ["health", "politics", "economy", "technology", "science"].includes(
    representative.pin.kategori
  );

  if (representative.pin.kategori !== candidate.pin.kategori) {
    return false;
  }

  if (Math.abs(representative.timestamp - candidate.timestamp) > MAX_CLUSTER_WINDOW_MS) {
    return false;
  }

  const titleSimilarity = getSetSimilarity(representative.titleTokens, candidate.titleTokens);
  const combinedRepresentativeTokens = new Set([
    ...Array.from(representative.titleTokens),
    ...Array.from(representative.summaryTokens),
  ]);
  const combinedCandidateTokens = new Set([
    ...Array.from(candidate.titleTokens),
    ...Array.from(candidate.summaryTokens),
  ]);
  const sharedKeywords = countSharedTokens(combinedRepresentativeTokens, combinedCandidateTokens);
  const locationMatched = areLocationsCompatible(representative, candidate);

  if (isSensitiveCategory) {
    if (locationMatched && titleSimilarity >= 0.62) {
      return true;
    }

    if (locationMatched && sharedKeywords >= 5) {
      return true;
    }

    return false;
  }

  if (locationMatched && sharedKeywords >= 2) {
    return true;
  }

  if (locationMatched && titleSimilarity >= 0.34) {
    return true;
  }

  if (titleSimilarity >= 0.58) {
    return true;
  }

  return sharedKeywords >= 4;
}

function areLocationsCompatible(left: ClusterCandidate, right: ClusterCandidate): boolean {
  if (left.normalizedLocation && right.normalizedLocation) {
    return left.normalizedLocation === right.normalizedLocation;
  }

  if (left.normalizedLocation || right.normalizedLocation) {
    return getCoordinateDistance(left.pin, right.pin) <= 4;
  }

  return getCoordinateDistance(left.pin, right.pin) <= 7;
}

function getCoordinateDistance(left: Pin, right: Pin): number {
  return Math.max(
    Math.abs(left.koordinat.lat - right.koordinat.lat),
    Math.abs(left.koordinat.lng - right.koordinat.lng)
  );
}

function getSetSimilarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  const intersection = countSharedTokens(left, right);
  const union = new Set([...Array.from(left), ...Array.from(right)]).size;
  return union === 0 ? 0 : intersection / union;
}

function countSharedTokens(left: Set<string>, right: Set<string>): number {
  let count = 0;

  left.forEach((token) => {
    if (right.has(token)) {
      count += 1;
    }
  });

  return count;
}

function buildClusterKey(candidate: ClusterCandidate): string {
  const locationKey = candidate.normalizedLocation || `${roundCoordinate(candidate.pin.koordinat.lat)}:${roundCoordinate(candidate.pin.koordinat.lng)}`;
  const tokenKey = Array.from(candidate.titleTokens).sort().slice(0, 4).join("-");

  return [candidate.pin.kategori, locationKey, tokenKey || "misc"].join("|");
}

function roundCoordinate(value: number): string {
  return value.toFixed(1);
}

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildClusteredPin(cluster: PinCluster, index: number): Pin {
  const primaryCandidate = selectPrimaryCandidate(cluster);
  const primaryPin = primaryCandidate.pin;
  const uniqueSourceNames = getUniqueSourceNames(cluster);
  const alternativeSources = buildAlternativeSources(cluster, primaryPin);
  const newsMeta: NewsEventMeta = {
    type: "news",
    clusterKey: `${cluster.key}:${index}`,
    clusterSize: cluster.pins.length,
    sourceCount: uniqueSourceNames.length,
    sourceNames: uniqueSourceNames,
    alternativeSources,
  };

  return {
    ...primaryPin,
    kaynakSkoru: calculateClusterReliability(
      primaryPin.kaynakSkoru,
      uniqueSourceNames.length,
      cluster.pins.length,
      alternativeSources.length
    ),
    alternatifKaynaklar: alternativeSources.map((source) => source.sourceName),
    eventMeta: newsMeta,
  };
}

function selectPrimaryCandidate(cluster: PinCluster): ClusterCandidate {
  return [...cluster.pins].sort(compareCandidates)[0];
}

function compareCandidates(left: ClusterCandidate, right: ClusterCandidate): number {
  if (right.pin.kaynakSkoru !== left.pin.kaynakSkoru) {
    return right.pin.kaynakSkoru - left.pin.kaynakSkoru;
  }

  const leftContentScore = getContentScore(left.pin);
  const rightContentScore = getContentScore(right.pin);
  if (rightContentScore !== leftContentScore) {
    return rightContentScore - leftContentScore;
  }

  return right.timestamp - left.timestamp;
}

function getContentScore(pin: Pin): number {
  let score = 0;
  if (pin.gorsel) score += 1;
  if (pin.konum) score += 1;
  if (pin.ozet && pin.ozet.length >= 60) score += 1;
  if (pin.etiketler?.length) score += 1;
  return score;
}

function getUniqueSourceNames(cluster: PinCluster): string[] {
  return Array.from(
    new Set(
      cluster.pins
        .map((candidate) => candidate.pin.kaynak)
        .filter(Boolean)
    )
  );
}

function buildAlternativeSources(cluster: PinCluster, primaryPin: Pin): NewsAlternativeSource[] {
  return cluster.pins
    .map((candidate) => candidate.pin)
    .filter((pin) => pin.id !== primaryPin.id)
    .sort((left, right) => new Date(right.tarih).getTime() - new Date(left.tarih).getTime())
    .map((pin) => ({
      sourceName: pin.kaynak,
      url: pin.detayUrl,
      publishedAt: pin.tarih,
      title: pin.baslik,
      summary: pin.ozet,
      location: pin.konum,
      reliabilityScore: pin.kaynakSkoru,
      imageUrl: pin.gorsel,
    }))
    .filter((source, index, sources) => {
      return sources.findIndex(
        (item) => item.sourceName === source.sourceName && item.url === source.url
      ) === index;
    });
}

function calculateClusterReliability(
  baseScore: number,
  uniqueSourceCount: number,
  clusterSize: number,
  alternativeSourceCount: number
): number {
  let score = baseScore;

  if (uniqueSourceCount > 1) {
    score += Math.min((uniqueSourceCount - 1) * 4, 12);
  }

  if (clusterSize > uniqueSourceCount) {
    score += Math.min(clusterSize - uniqueSourceCount, 2);
  }

  if (alternativeSourceCount > 0) {
    score += 1;
  }

  return Math.max(45, Math.min(99, score));
}
