import { SourceFetchError } from "@/lib/server/fetchWithTimeout";

export interface GdacsEvent {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
  pubDate: string;
  lat: number;
  lng: number;
  severity: "green" | "orange" | "red" | "unknown";
}

interface FetchGdacsOptions {
  throwOnError?: boolean;
  timeoutMs?: number;
}

const GDACS_RSS_URL = "https://www.gdacs.org/xml/rss.xml";

export async function fetchGdacsEvents(
  maxItems = 40,
  options: FetchGdacsOptions = {},
): Promise<GdacsEvent[]> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GDACS_RSS_URL, {
      signal: controller.signal,
      next: { revalidate: 300 },
      headers: {
        "User-Agent": "WatcherG/1.0 (gdacs-monitor)",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new SourceFetchError(`GDACS RSS hatasi: ${response.status}`, {
        source: "GDACS RSS",
        status: response.status,
      });
    }

    const xmlText = await response.text();
    return parseGdacsFeed(xmlText).slice(0, maxItems);
  } catch (error) {
    console.error("GDACS verisi cekilemedi:", error);

    if (options.throwOnError) {
      throw error;
    }

    return [];
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function parseGdacsFeed(xmlText: string): GdacsEvent[] {
  const events: GdacsEvent[] = [];
  const itemRegex = /<item\b[\s\S]*?<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[0];
    const title = decodeXmlEntities(extractTag(itemXml, "title") || "");
    const link = extractTag(itemXml, "link") || "";
    const description = decodeXmlEntities(stripHtml(extractTag(itemXml, "description") || ""));
    const pubDate = extractTag(itemXml, "pubDate") || new Date().toISOString();
    const georssPoint = extractTag(itemXml, "georss:point");
    const geoLat = extractTag(itemXml, "geo:lat");
    const geoLong = extractTag(itemXml, "geo:long");
    const coords = parseCoordinates(georssPoint, geoLat, geoLong);

    if (!title || !link || !coords) {
      continue;
    }

    events.push({
      id: createStableId(link, title),
      title,
      description,
      link,
      category: inferGdacsCategory(title, description),
      pubDate: new Date(pubDate).toISOString(),
      lat: coords.lat,
      lng: coords.lng,
      severity: inferSeverity(title, description),
    });
  }

  return events;
}

function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

function parseCoordinates(pointValue: string | null, latValue: string | null, lngValue: string | null) {
  if (pointValue) {
    const [lat, lng] = pointValue.split(/\s+/).map((value) => Number(value));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return null;
}

function inferGdacsCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("earthquake")) return "earthquakes";
  if (text.includes("flood")) return "floods";
  if (text.includes("cyclone") || text.includes("storm") || text.includes("typhoon")) return "severeStorms";
  if (text.includes("volcano")) return "volcanoes";
  if (text.includes("drought")) return "drought";
  if (text.includes("fire")) return "wildfires";

  return "disaster";
}

function inferSeverity(title: string, description: string): GdacsEvent["severity"] {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("red")) return "red";
  if (text.includes("orange")) return "orange";
  if (text.includes("green")) return "green";
  return "unknown";
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function createStableId(link: string, title: string): string {
  const source = `${link}-${title}`;
  let hash = 0;
  for (let index = 0; index < source.length; index++) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return `gdacs_${Math.abs(hash)}`;
}
