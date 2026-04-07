import { fetchJsonWithTimeout } from "@/lib/server/fetchWithTimeout";

export interface EmscEarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    title: string;
    status: string;
    type: string;
    alert: string | null;
    tsunami: number;
    source?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

interface EmscFeatureCollection {
  features?: Array<{
    id?: string;
    properties?: {
      unid?: string;
      source_id?: string;
      source_catalog?: string;
      flynn_region?: string;
      time?: string | number;
      lastupdate?: string | number;
      mag?: number | string;
      depth?: number | string;
      lat?: number | string;
      lon?: number | string;
      url?: string;
    };
    geometry?: {
      type?: string;
      coordinates?: [number, number, number];
    };
  }>;
}

interface FetchEmscOptions {
  throwOnError?: boolean;
  timeoutMs?: number;
}

const EMSC_EVENT_URL = "https://www.seismicportal.eu/fdsnws/event/1/query";

export async function fetchEmscEarthquakes(
  hoursBack = 24,
  minimumMagnitude = 2.5,
  options: FetchEmscOptions = {},
): Promise<EmscEarthquakeFeature[]> {
  try {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const params = new URLSearchParams({
      format: "json",
      starttime: startTime,
      endtime: endTime,
      minmagnitude: String(minimumMagnitude),
      orderby: "time",
      limit: "300",
    });

    const data = await fetchJsonWithTimeout<EmscFeatureCollection>(`${EMSC_EVENT_URL}?${params.toString()}`, {
      source: "EMSC SeismicPortal",
      timeoutMs: options.timeoutMs,
      next: { revalidate: 300 },
    });

    return (data.features || [])
      .map(normalizeEmscFeature)
      .filter((feature): feature is EmscEarthquakeFeature => feature !== null);
  } catch (error) {
    console.error("EMSC deprem verisi cekilemedi:", error);

    if (options.throwOnError) {
      throw error;
    }

    return [];
  }
}

function normalizeEmscFeature(raw: NonNullable<EmscFeatureCollection["features"]>[number]): EmscEarthquakeFeature | null {
  const properties = raw.properties;
  if (!properties) {
    return null;
  }

  const lat = Number(properties.lat ?? raw.geometry?.coordinates?.[1]);
  const lng = Number(properties.lon ?? raw.geometry?.coordinates?.[0]);
  const depth = Number(properties.depth ?? raw.geometry?.coordinates?.[2] ?? 0);
  const mag = Number(properties.mag ?? 0);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(mag)) {
    return null;
  }

  const region = properties.flynn_region?.trim() || "Global";
  const timeMs = normalizeTimestamp(properties.time);
  const updatedMs = normalizeTimestamp(properties.lastupdate ?? properties.time);
  const id = raw.id || properties.unid || `${timeMs}-${lat}-${lng}`;
  const url = properties.url || `https://www.seismicportal.eu/eventdetails.html?unid=${id}`;

  return {
    id,
    properties: {
      mag,
      place: region,
      time: timeMs,
      updated: updatedMs,
      url,
      title: `M ${mag.toFixed(1)} - ${region}`,
      status: "reviewed",
      type: "earthquake",
      alert: null,
      tsunami: 0,
      source: "EMSC",
    },
    geometry: {
      type: "Point",
      coordinates: [lng, lat, Number.isFinite(depth) ? depth : 0],
    },
  };
}

function normalizeTimestamp(value: string | number | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return Date.now();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}
