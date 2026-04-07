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

function assertNewsMeta(payload) {
  assert(payload && typeof payload === "object", "Payload object olmali");
  assert(payload.meta && typeof payload.meta === "object", "meta object olmali");
  assert(payload.meta.clustered === true, "meta.clustered true olmali");
  assert(typeof payload.meta.rawCount === "number" && payload.meta.rawCount >= 0, "meta.rawCount number olmali");
  assert(typeof payload.meta.clusteredCount === "number" && payload.meta.clusteredCount >= 0, "meta.clusteredCount number olmali");
  assert(typeof payload.meta.mergedCount === "number" && payload.meta.mergedCount >= 0, "meta.mergedCount number olmali");
  assert(typeof payload.meta.multiSourceClusterCount === "number" && payload.meta.multiSourceClusterCount >= 0, "meta.multiSourceClusterCount number olmali");
  assert(typeof payload.meta.fetchedAt === "string" && payload.meta.fetchedAt.length > 0, "meta.fetchedAt gerekli");
  assert(payload.sources && typeof payload.sources === "object", "sources object olmali");
  assert(typeof payload.sources.healthOfficial === "number", "sources.healthOfficial number olmali");
  assert(typeof payload.sources.topicOfficial === "number", "sources.topicOfficial number olmali");
  assert(typeof payload.sources.technologyOfficial === "number", "sources.technologyOfficial number olmali");
  assert(typeof payload.sources.scienceOfficial === "number", "sources.scienceOfficial number olmali");
}

function assertNewsDebug(payload) {
  assert(payload.debug && typeof payload.debug === "object", "debug object olmali");
  assert(Array.isArray(payload.debug.clusterPreview), "clusterPreview array olmali");
  if (payload.cached === false) {
    assert(payload.debug.providerStatus && typeof payload.debug.providerStatus === "object", "providerStatus gerekli");
  }
}

function assertNewsPins(payload) {
  const pins = payload.data;
  assert(Array.isArray(pins), "news data array olmali");

  if (pins.length === 0) {
    return;
  }

  const first = pins[0];
  assert(typeof first.kaynakSkoru === "number", "kaynakSkoru number olmali");
  assert(typeof first.kaynak === "string" && first.kaynak.length > 0, "kaynak gerekli");
  assert(Array.isArray(first.alternatifKaynaklar), "alternatifKaynaklar array olmali");

  if (first.eventMeta?.type === "news") {
    assert(typeof first.eventMeta.clusterKey === "string" && first.eventMeta.clusterKey.length > 0, "clusterKey gerekli");
    assert(typeof first.eventMeta.clusterSize === "number" && first.eventMeta.clusterSize >= 1, "clusterSize number olmali");
    assert(typeof first.eventMeta.sourceCount === "number" && first.eventMeta.sourceCount >= 1, "sourceCount number olmali");
    assert(Array.isArray(first.eventMeta.sourceNames), "sourceNames array olmali");
    assert(Array.isArray(first.eventMeta.alternativeSources), "alternativeSources array olmali");
  }
}

async function runNewsChecks(baseUrl) {
  const firstUrl = `${baseUrl}/api/news?debug=1`;
  const secondUrl = `${baseUrl}/api/news`;

  const first = await fetchJson(firstUrl);
  assert(first.response.status === 200, "news status code 200 olmali");
  assertNewsMeta(first.payload);
  assertNewsDebug(first.payload);
  assertNewsPins(first.payload);

  const second = await fetchJson(secondUrl);
  assert(second.response.status === 200, "news ikinci status code 200 olmali");
  assertNewsMeta(second.payload);
  assertNewsPins(second.payload);

  if (second.payload.count > 0) {
    assert(second.payload.cached === true, "Ikinci news istegi cache'den donmeli");
  }
  assert(second.payload.count === second.payload.meta.clusteredCount, "count ile clusteredCount esit olmali");
  assert(second.payload.meta.rawCount >= second.payload.meta.clusteredCount, "rawCount clusteredCount'tan kucuk olamaz");

  return {
    firstStatus: first.response.status,
    secondStatus: second.response.status,
    count: second.payload.count,
    rawCount: second.payload.meta.rawCount,
    clusteredCount: second.payload.meta.clusteredCount,
    mergedCount: second.payload.meta.mergedCount,
    multiSourceClusterCount: second.payload.meta.multiSourceClusterCount,
    clusterPreviewCount: first.payload.debug.clusterPreview.length,
    healthOfficial: second.payload.sources.healthOfficial,
    topicOfficial: second.payload.sources.topicOfficial,
    technologyOfficial: second.payload.sources.technologyOfficial,
    scienceOfficial: second.payload.sources.scienceOfficial,
  };
}

async function main() {
  const baseUrl = (process.env.WATCHERG_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

  console.log(`WG-H6-07 smoke test basliyor: ${baseUrl}`);

  const news = await runNewsChecks(baseUrl);

  console.log("Smoke test tamamlandi.");
  console.log(
    JSON.stringify(
      {
        baseUrl,
        news,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("WG-H6-07 smoke test basarisiz:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
