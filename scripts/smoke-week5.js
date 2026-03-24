#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  assert(contentType.includes("application/json"), `JSON bekleniyordu: ${url}`);

  const payload = await response.json();
  return { response, payload };
}

function assertMetaShape(payload, expectedSource) {
  assert(payload && typeof payload === "object", "Payload object olmali");
  assert(payload.meta && typeof payload.meta === "object", "meta object olmali");
  assert(payload.meta.source === expectedSource, `${expectedSource} source bekleniyordu`);
  assert(payload.meta.cache && typeof payload.meta.cache === "object", "cache meta bekleniyordu");
  assert(typeof payload.meta.cache.key === "string" && payload.meta.cache.key.length > 0, "cache key gerekli");
  assert(typeof payload.meta.cache.hit === "boolean", "cache.hit boolean olmali");
  assert(typeof payload.meta.cache.stale === "boolean", "cache.stale boolean olmali");
  assert(typeof payload.meta.cache.ttlMs === "number" && payload.meta.cache.ttlMs > 0, "cache.ttlMs pozitif olmali");
  assert(typeof payload.meta.degraded === "boolean", "meta.degraded boolean olmali");
  assert(typeof payload.meta.fetchedAt === "string" && payload.meta.fetchedAt.length > 0, "meta.fetchedAt gerekli");
}

function assertDebugShape(payload) {
  assert(payload.debug && typeof payload.debug === "object", "debug object olmali");
  assert(typeof payload.debug.timeoutMs === "number" && payload.debug.timeoutMs > 0, "debug.timeoutMs pozitif olmali");
}

function assertEarthquakePins(payload) {
  const pins = payload.data;
  assert(Array.isArray(pins), "earthquakes data array olmali");

  if (pins.length === 0) {
    return;
  }

  const first = pins[0];
  assert(first.kaynak === "USGS", "Deprem kaynagi USGS olmali");
  assert(first.eventMeta && first.eventMeta.type === "earthquake", "Deprem eventMeta gerekli");
  assert(typeof first.eventMeta.magnitude === "number", "magnitude number olmali");
  assert(typeof first.eventMeta.depthKm === "number", "depthKm number olmali");
  assert(typeof first.eventMeta.eventTime === "string" && first.eventMeta.eventTime.length > 0, "eventTime gerekli");
  assert(typeof first.eventMeta.tsunami === "boolean", "tsunami boolean olmali");
  assert(typeof first.kaynakSkoru === "number", "kaynakSkoru number olmali");
}

function assertDisasterPins(payload) {
  const pins = payload.pins;
  assert(Array.isArray(pins), "disasters pins array olmali");

  if (pins.length === 0) {
    return;
  }

  const first = pins[0];
  assert(
    first.kaynak === "NASA EONET" || first.kaynak === "NASA FIRMS",
    "Afet kaynagi NASA olmali"
  );
  assert(typeof first.kaynakSkoru === "number", "kaynakSkoru number olmali");
}

async function runEarthquakeChecks(baseUrl) {
  const firstUrl = `${baseUrl}/api/earthquakes?debug=1`;
  const secondUrl = `${baseUrl}/api/earthquakes?debug=1`;

  const first = await fetchJson(firstUrl);
  assert(first.response.status === 200 || first.response.status === 503, "Beklenmeyen deprem status code");
  assertMetaShape(first.payload, "USGS");
  assertDebugShape(first.payload);

  if (first.payload.success) {
    assertEarthquakePins(first.payload);
  } else {
    assert(first.response.status === 503, "Basarisiz deprem response 503 olmali");
    assert(Array.isArray(first.payload.data), "Basarisiz deprem response data array olmali");
  }

  const second = await fetchJson(secondUrl);
  assert(second.response.status === 200 || second.response.status === 503, "Beklenmeyen deprem ikinci status code");
  assertMetaShape(second.payload, "USGS");
  assertDebugShape(second.payload);

  if (first.payload.success && second.payload.success) {
    assert(second.payload.cached === true, "Ikinci deprem istegi cache'den donmeli");
    assert(second.payload.meta.cache.hit === true, "Ikinci deprem istegi cache hit olmali");
  }

  return {
    firstStatus: first.response.status,
    secondStatus: second.response.status,
    success: Boolean(first.payload.success && second.payload.success),
    count: Array.isArray(second.payload.data) ? second.payload.data.length : 0,
  };
}

async function runDisasterChecks(baseUrl) {
  const firstUrl = `${baseUrl}/api/disasters?debug=1`;
  const secondUrl = `${baseUrl}/api/disasters?debug=1`;

  const first = await fetchJson(firstUrl);
  assert(first.response.status === 200 || first.response.status === 503, "Beklenmeyen afet status code");
  assertMetaShape(first.payload, "NASA EONET");
  assertDebugShape(first.payload);

  if (first.payload.success) {
    assertDisasterPins(first.payload);
  } else {
    assert(first.response.status === 503, "Basarisiz afet response 503 olmali");
    assert(first.payload.meta.degraded === false, "Basarisiz afet response degraded false olmali");
  }

  const second = await fetchJson(secondUrl);
  assert(second.response.status === 200 || second.response.status === 503, "Beklenmeyen afet ikinci status code");
  assertMetaShape(second.payload, "NASA EONET");
  assertDebugShape(second.payload);

  if (first.payload.success && second.payload.success) {
    assert(second.payload.cached === true, "Ikinci afet istegi cache'den donmeli");
    assert(second.payload.meta.cache.hit === true, "Ikinci afet istegi cache hit olmali");
  }

  return {
    firstStatus: first.response.status,
    secondStatus: second.response.status,
    success: Boolean(first.payload.success && second.payload.success),
    count: Array.isArray(second.payload.pins) ? second.payload.pins.length : 0,
  };
}

async function main() {
  const baseUrl = (process.env.WATCHERG_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

  console.log(`WG-H5-07 smoke test basliyor: ${baseUrl}`);

  const earthquake = await runEarthquakeChecks(baseUrl);
  const disaster = await runDisasterChecks(baseUrl);

  console.log("Smoke test tamamlandi.");
  console.log(
    JSON.stringify(
      {
        baseUrl,
        earthquake,
        disaster,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("WG-H5-07 smoke test basarisiz:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
