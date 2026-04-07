"use client";

import { useEffect, useRef } from "react";
import type { Pin } from "@/types/pin";
import { PRIORITY_COLORS } from "@/types/pin";

interface VectorGlobeProps {
  pins?: Pin[];
  onPinClick?: (pin: Pin) => void;
  onClusterClick?: (pins: Pin[]) => void;
}

interface GlobePoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
  size: number;
  altitude: number;
  originalPin: Pin;
  priorityWeight: number;
  isCluster?: boolean;
  clusterCount?: number;
  clusteredPins?: Pin[];
}

interface GlobeLabel {
  lat: number;
  lng: number;
  text: string;
  color: string;
  size: number;
  altitude: number;
}

interface CountryFeature {
  properties: {
    NAME?: string;
    name?: string;
    [key: string]: unknown;
  };
}

interface GlobeRenderer {
  dispose(): void;
  forceContextLoss(): void;
}

interface GlobeScene {
  clear(): void;
}

interface GlobeControls {
  autoRotate: boolean;
  autoRotateSpeed: number;
  enablePan: boolean;
  minDistance: number;
  maxDistance: number;
  addEventListener?(event: string, callback: () => void): void;
  removeEventListener?(event: string, callback: () => void): void;
}

interface GlobeRuntime {
  (element: HTMLDivElement): void;
  globeImageUrl(value: string): GlobeRuntime;
  backgroundColor(value: string): GlobeRuntime;
  showAtmosphere(value: boolean): GlobeRuntime;
  atmosphereColor(value: string): GlobeRuntime;
  atmosphereAltitude(value: number): GlobeRuntime;
  polygonsData(value: CountryFeature[]): GlobeRuntime;
  polygonAltitude(value: number): GlobeRuntime;
  polygonCapColor(value: () => string): GlobeRuntime;
  polygonSideColor(value: () => string): GlobeRuntime;
  polygonStrokeColor(value: () => string): GlobeRuntime;
  polygonLabel(value: (feature: CountryFeature) => string): GlobeRuntime;
  pointsData(value: GlobePoint[]): GlobeRuntime;
  pointColor(value: string): GlobeRuntime;
  pointAltitude(value: string): GlobeRuntime;
  pointRadius(value: string): GlobeRuntime;
  pointLabel(value: (point: GlobePoint) => string): GlobeRuntime;
  onPointClick(value: (point: GlobePoint) => void): GlobeRuntime;
  labelsData(value: GlobeLabel[]): GlobeRuntime;
  labelLat(value: string): GlobeRuntime;
  labelLng(value: string): GlobeRuntime;
  labelText(value: string): GlobeRuntime;
  labelSize(value: string): GlobeRuntime;
  labelColor(value: string): GlobeRuntime;
  labelAltitude(value: string): GlobeRuntime;
  labelIncludeDot(value: boolean | string): GlobeRuntime;
  labelDotRadius(value: number | string): GlobeRuntime;
  labelResolution(value: number): GlobeRuntime;
  onZoom(value: () => void): GlobeRuntime;
  pointOfView(): { lat: number; lng: number; altitude: number };
  pointOfView(value: { lat: number; lng: number; altitude: number }, duration: number): GlobeRuntime;
  width(value: number): GlobeRuntime;
  height(value: number): GlobeRuntime;
  getScreenCoords(lat: number, lng: number, altitude?: number): { x: number; y: number };
  renderer?(): GlobeRenderer;
  scene?(): GlobeScene;
  controls?(): GlobeControls;
  _destructor?(): void;
}

interface GlobeModule {
  default: () => GlobeRuntime;
}

interface ScreenPoint extends GlobePoint {
  screenX: number;
  screenY: number;
}

interface CollisionGroup {
  anchor: ScreenPoint;
  members: ScreenPoint[];
  centerX: number;
  centerY: number;
}

const DEFAULT_POINT_OF_VIEW = { lat: 39, lng: 35, altitude: 2.1 };

export default function VectorGlobe({ pins = [], onPinClick, onClusterClick }: VectorGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<{
    globe: GlobeRuntime;
    handleResize: () => void;
    handleControlsChange: () => void;
    resizeObserver?: ResizeObserver;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    let frameId: number | null = null;
    let layoutTimeout: ReturnType<typeof setTimeout> | null = null;
    const container = containerRef.current;

    const initGlobe = async () => {
      if (!container) return;

      const GlobeModule = (await import("globe.gl")) as unknown as GlobeModule;
      const Globe = GlobeModule.default as unknown as () => GlobeRuntime;
      if (!mounted) return;

      let countriesData: { features: CountryFeature[] } = { features: [] };
      try {
        const response = await fetch("/data/globe/ne_110m_countries.json");
        countriesData = await response.json();
      } catch (error) {
        console.warn("GeoJSON yuklenemedi:", error);
      }
      if (!mounted) return;

      const rawGlobePins: GlobePoint[] = pins
        .filter((pin) => Number.isFinite(pin.koordinat.lat) && Number.isFinite(pin.koordinat.lng))
        .map((pin) => ({
          lat: pin.koordinat.lat,
          lng: pin.koordinat.lng,
          label: pin.baslik,
          color: pin.renk,
          size: getGlobePinSize(pin),
          altitude: getBaseColumnAltitude(pin),
          originalPin: pin,
          priorityWeight: getPriorityWeight(pin),
        }));

      const globe = Globe()
        .globeImageUrl("/data/globe/earth-night.jpg")
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#00FF88")
        .atmosphereAltitude(0.14)
        .polygonsData(countriesData.features)
        .polygonAltitude(0.008)
        .polygonCapColor(() => "rgba(2, 24, 16, 0.55)")
        .polygonSideColor(() => "rgba(8, 44, 28, 0.28)")
        .polygonStrokeColor(() => "rgba(0,255,136,0.45)")
        .polygonLabel((feature: CountryFeature) => {
          const properties = feature.properties;
          return `<div style="background:#030A06;color:#C0FFD8;padding:5px 10px;font-family:monospace;font-size:11px;letter-spacing:1px;border:1px solid rgba(0,255,136,0.2)">${escapeHtml(String(properties.NAME || properties.name || ""))}</div>`;
        })
        .pointsData(rawGlobePins)
        .pointColor("color")
        .pointAltitude("altitude")
        .pointRadius("size")
        .pointLabel((point: GlobePoint) => {
          if (point.isCluster) {
            const preview = (point.clusteredPins ?? [])
              .slice(0, 3)
              .map((pin) => `<div style="margin-top:3px">${escapeHtml(pin.baslik)}</div>`)
              .join("");
            const moreCount = Math.max((point.clusterCount ?? 0) - 3, 0);
            return `<div style="background:#030A06;border:1px solid rgba(255,215,0,0.45);padding:7px 11px;font-family:monospace;font-size:10px;max-width:260px;color:#F8FFD3;letter-spacing:1px"><div style="color:#FFD700;font-size:9px;margin-bottom:3px">● KUME · ${point.clusterCount ?? 0} OLAY</div>${preview}${moreCount > 0 ? `<div style="color:#9AC7A8;font-size:9px;margin-top:4px">+${moreCount} ek kayit</div>` : ""}</div>`;
          }

          const pin = point.originalPin;
          const priorityColor = PRIORITY_COLORS[pin.oncelik];
          const shortLabel = point.label.length > 80 ? `${point.label.substring(0, 80)}...` : point.label;
          return `<div style="background:#030A06;border:1px solid ${priorityColor}55;padding:7px 11px;font-family:monospace;font-size:10px;max-width:240px;color:#C0FFD8;letter-spacing:1px"><div style="color:${priorityColor};font-size:9px;margin-bottom:3px">● ${pin.oncelik} · ${pin.kategori.toUpperCase()}</div><div>${escapeHtml(shortLabel)}</div><div style="color:#4A8862;font-size:9px;margin-top:3px">${escapeHtml(pin.kaynak)}</div></div>`;
        })
        .onPointClick((point: GlobePoint) => {
          if (point.isCluster && point.clusterCount && point.clusterCount > 1) {
            onClusterClick?.(point.clusteredPins ?? []);
            return;
          }

          if (onPinClick) {
            onPinClick(point.originalPin);
          }
        })
        .labelsData([])
        .labelLat("lat")
        .labelLng("lng")
        .labelText("text")
        .labelSize("size")
        .labelColor("color")
        .labelAltitude("altitude")
        .labelIncludeDot(false)
        .labelDotRadius(0)
        .labelResolution(5);

      globe(container);
      globe.pointOfView(DEFAULT_POINT_OF_VIEW, 0);

      const controls = globe.controls?.();
      if (controls) {
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0;
        controls.enablePan = false;
        controls.minDistance = 110;
        controls.maxDistance = 320;
      }

      const applyCollisionLayout = () => {
        const layout = buildCollisionLayout(globe, container, rawGlobePins);
        globe.pointsData(layout.points);
        globe.labelsData(layout.labels);
      };

      const scheduleCollisionLayout = (delayMs = 0) => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
        if (layoutTimeout) {
          clearTimeout(layoutTimeout);
          layoutTimeout = null;
        }
        const run = () => {
          frameId = requestAnimationFrame(() => {
            applyCollisionLayout();
            frameId = null;
          });
        };
        if (delayMs > 0) {
          layoutTimeout = setTimeout(() => {
            run();
            layoutTimeout = null;
          }, delayMs);
          return;
        }
        run();
      };

      const handleResize = () => {
        globe.width(container.clientWidth);
        globe.height(container.clientHeight);
        scheduleCollisionLayout();
      };

      const handleControlsChange = () => {
        scheduleCollisionLayout(120);
      };

      handleResize();
      scheduleCollisionLayout();
      window.addEventListener("resize", handleResize);
      globe.onZoom(handleControlsChange);
      controls?.addEventListener?.("change", handleControlsChange);

      const resizeObserver =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => {
              handleResize();
            })
          : undefined;

      resizeObserver?.observe(container);
      globeRef.current = { globe, handleResize, handleControlsChange, resizeObserver };
    };

    initGlobe();

    return () => {
      mounted = false;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      if (layoutTimeout) {
        clearTimeout(layoutTimeout);
      }
      if (globeRef.current) {
        window.removeEventListener("resize", globeRef.current.handleResize);
        globeRef.current.globe.controls?.()?.removeEventListener?.("change", globeRef.current.handleControlsChange);
        globeRef.current.resizeObserver?.disconnect();
        const instance = globeRef.current.globe;
        try {
          const renderer = instance.renderer?.();
          if (renderer) {
            renderer.dispose();
            renderer.forceContextLoss();
          }
          const scene = instance.scene?.();
          if (scene) scene.clear();
        } catch {
          // noop
        }
        if (instance._destructor) {
          instance._destructor();
        }
        globeRef.current = null;
      }
      document.querySelectorAll(".scene-tooltip").forEach((element) => element.remove());
      container?.replaceChildren();
    };
  }, [pins, onClusterClick, onPinClick]);

  return <div ref={containerRef} className="h-full w-full" style={{ background: "#030A06" }} />;
}

function getGlobePinSize(pin: Pin): number {
  const base: Record<string, number> = {
    CRITICAL: 0.36,
    HIGH: 0.28,
    MEDIUM: 0.2,
    LOW: 0.16,
  };

  let size = base[pin.oncelik] ?? 0.3;

  if (pin.kategori === "conflict") {
    size = Math.max(size, 0.26);
  }

  if (
    pin.kategori === "general" ||
    pin.kategori === "politics" ||
    pin.kategori === "economy" ||
    pin.kategori === "technology" ||
    pin.kategori === "science"
  ) {
    size = Math.max(size, 0.22);
  }

  if (pin.kategori === "disaster") {
    const magnitudeMatch = pin.ozet.match(/Buyukluk\s*([\d.]+)/i) ?? pin.ozet.match(/B[üu]y[üu]kl[üu]k\s*([\d.]+)/i);
    if (magnitudeMatch) {
      const magnitude = parseFloat(magnitudeMatch[1]);
      if (magnitude >= 7) size = Math.max(size, 0.4);
      else if (magnitude >= 5) size = Math.max(size, 0.32);
      else if (magnitude >= 4) size = Math.max(size, 0.24);
    }
  }

  return size;
}

function getPriorityWeight(pin: Pin): number {
  const base: Record<Pin["oncelik"], number> = {
    CRITICAL: 400,
    HIGH: 250,
    MEDIUM: 140,
    LOW: 80,
  };

  return (base[pin.oncelik] ?? 80) + getGlobePinSize(pin) * 100;
}

function getBaseColumnAltitude(pin: Pin): number {
  if (pin.oncelik === "CRITICAL") return 0.062;
  if (pin.oncelik === "HIGH") return 0.046;
  if (pin.oncelik === "MEDIUM") return 0.032;
  return 0.022;
}

function buildCollisionLayout(
  globe: GlobeRuntime,
  container: HTMLDivElement,
  points: GlobePoint[],
): { points: GlobePoint[]; labels: GlobeLabel[] } {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const altitude = globe.pointOfView().altitude;
  const collisionRadius = getCollisionRadiusPx(altitude);
  const margin = 80;

  const screenPoints: ScreenPoint[] = points
    .map((point) => {
      const coords = globe.getScreenCoords(point.lat, point.lng, point.altitude);
      return {
        ...point,
        screenX: coords.x,
        screenY: coords.y,
      };
    })
    .filter(
      (point) =>
        Number.isFinite(point.screenX) &&
        Number.isFinite(point.screenY) &&
        point.screenX >= -margin &&
        point.screenX <= containerWidth + margin &&
        point.screenY >= -margin &&
        point.screenY <= containerHeight + margin,
    )
    .sort((a, b) => b.priorityWeight - a.priorityWeight);

  const geoMergeRadiusKm = getGeoMergeRadiusKm(altitude);
  const groups = buildCollisionGroups(screenPoints, collisionRadius, geoMergeRadiusKm);

  const renderedPoints: GlobePoint[] = [];
  const labels: GlobeLabel[] = [];
  const shouldSeparateCloseClusters = altitude <= 0.88;

  for (const group of groups) {
    if (group.members.length === 1) {
      renderedPoints.push(stripScreenData(group.anchor));
      continue;
    }

    if (shouldSeparateCloseClusters && group.members.length <= 3) {
      renderedPoints.push(...separateClusterMembers(group.members, altitude));
      continue;
    }

    const sortedMembers = [...group.members].sort((a, b) => b.priorityWeight - a.priorityWeight);
    const representative = sortedMembers[0];
    const clusterCount = sortedMembers.length;

    renderedPoints.push({
      ...stripScreenData(representative),
      isCluster: true,
      clusterCount,
      clusteredPins: sortedMembers.map((member) => member.originalPin),
      size: getColumnRadius(representative.size, clusterCount),
      altitude: getColumnAltitude(representative.altitude, clusterCount),
      color: brightenColor(representative.color),
    });

    labels.push({
      lat: representative.lat,
      lng: representative.lng,
      text: String(clusterCount),
      color: "#FFF7B1",
      size: getClusterLabelSize(clusterCount),
      altitude: Math.min(getColumnAltitude(representative.altitude, clusterCount) + 0.016, 0.12),
    });
  }

  return { points: renderedPoints, labels };
}

function stripScreenData(point: ScreenPoint): GlobePoint {
  const { screenX, screenY, ...rest } = point;
  void screenX;
  void screenY;
  return rest;
}

function getCollisionRadiusPx(altitude: number): number {
  if (altitude >= 2.2) return 4;
  if (altitude >= 1.7) return 3.4;
  if (altitude >= 1.2) return 2.8;
  return 2;
}

function getGeoMergeRadiusKm(altitude: number): number {
  if (altitude >= 2.2) return 120;
  if (altitude >= 1.7) return 80;
  if (altitude >= 1.2) return 45;
  return 12;
}

function getClusterLabelSize(clusterCount: number): number {
  if (clusterCount >= 100) return 0.38;
  if (clusterCount >= 10) return 0.44;
  return 0.5;
}

function getColumnRadius(baseSize: number, clusterCount: number): number {
  return Math.min(Math.max(baseSize + Math.sqrt(clusterCount) * 0.014, 0.22), 0.36);
}

function getColumnAltitude(baseAltitude: number, clusterCount: number): number {
  const scaledBoost = Math.sqrt(clusterCount) * 0.018 + Math.log2(clusterCount + 1) * 0.006;
  return Math.min(baseAltitude + scaledBoost, 0.16);
}

function brightenColor(hexColor: string): string {
  const value = hexColor.replace("#", "");
  if (value.length !== 6) return hexColor;

  const r = Math.min(255, parseInt(value.slice(0, 2), 16) + 28);
  const g = Math.min(255, parseInt(value.slice(2, 4), 16) + 28);
  const b = Math.min(255, parseInt(value.slice(4, 6), 16) + 28);

  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function buildCollisionGroups(
  points: ScreenPoint[],
  collisionRadiusPx: number,
  geoMergeRadiusKm: number,
): CollisionGroup[] {
  const groups: CollisionGroup[] = [];
  const visited = new Set<number>();

  for (let startIndex = 0; startIndex < points.length; startIndex++) {
    if (visited.has(startIndex)) {
      continue;
    }

    const queue = [startIndex];
    const members: ScreenPoint[] = [];

    while (queue.length > 0) {
      const currentIndex = queue.shift();
      if (currentIndex === undefined || visited.has(currentIndex)) {
        continue;
      }

      visited.add(currentIndex);
      const current = points[currentIndex];
      members.push(current);

      for (let candidateIndex = 0; candidateIndex < points.length; candidateIndex++) {
        if (visited.has(candidateIndex) || candidateIndex === currentIndex) {
          continue;
        }

        const candidate = points[candidateIndex];
        if (shouldMergePoints(current, candidate, collisionRadiusPx, geoMergeRadiusKm)) {
          queue.push(candidateIndex);
        }
      }
    }

    const anchor = [...members].sort((left, right) => right.priorityWeight - left.priorityWeight)[0];
    const centerX = members.reduce((sum, member) => sum + member.screenX, 0) / members.length;
    const centerY = members.reduce((sum, member) => sum + member.screenY, 0) / members.length;

    groups.push({
      anchor,
      members,
      centerX,
      centerY,
    });
  }

  return groups;
}

function shouldMergePoints(
  left: ScreenPoint,
  right: ScreenPoint,
  collisionRadiusPx: number,
  geoMergeRadiusKm: number,
): boolean {
  const dx = left.screenX - right.screenX;
  const dy = left.screenY - right.screenY;
  const screenDistance = Math.hypot(dx, dy);

  if (screenDistance > collisionRadiusPx) {
    return false;
  }

  const geoDistance = haversineKm(left.lat, left.lng, right.lat, right.lng);
  return geoDistance <= geoMergeRadiusKm;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function separateClusterMembers(members: ScreenPoint[], altitude: number): GlobePoint[] {
  const sortedMembers = [...members].sort((left, right) => right.priorityWeight - left.priorityWeight);
  const spacingKm = altitude <= 0.72 ? 1.8 : 2.6;
  const gridSize = Math.ceil(Math.sqrt(sortedMembers.length));

  return sortedMembers.map((member, index) => {
    if (index === 0) {
      return stripScreenData(member);
    }

    const gridIndex = index - 1;
    const row = Math.floor(gridIndex / gridSize);
    const col = gridIndex % gridSize;
    const centeredRow = row - (gridSize - 1) / 2;
    const centeredCol = col - (gridSize - 1) / 2;
    const offsetLat = (centeredRow * spacingKm) / 111;
    const lngDivisor = Math.max(0.2, Math.cos((member.lat * Math.PI) / 180) * 111);
    const offsetLng = (centeredCol * spacingKm) / lngDivisor;

    return {
      ...stripScreenData(member),
      lat: member.lat + offsetLat,
      lng: member.lng + offsetLng,
    };
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
