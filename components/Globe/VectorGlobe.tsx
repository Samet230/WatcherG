"use client";

// WatcherG — 3D Globe.GL vektör görünümü

import { useEffect, useRef } from "react";
import type { Pin } from "@/types/pin";
import { PRIORITY_COLORS } from "@/types/pin";

interface VectorGlobeProps {
  pins?: Pin[];
  onPinClick?: (pin: Pin) => void;
}

interface GlobePoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
  size: number;
  altitude: number;
  originalPin: Pin;
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
  pointOfView(value: { lat: number; lng: number; altitude: number }, duration: number): GlobeRuntime;
  width(value: number): GlobeRuntime;
  height(value: number): GlobeRuntime;
  renderer?(): GlobeRenderer;
  scene?(): GlobeScene;
  controls?(): GlobeControls;
  _destructor?(): void;
}

interface GlobeModule {
  default: () => GlobeRuntime;
}

export default function VectorGlobe({ pins = [], onPinClick }: VectorGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<{ globe: GlobeRuntime; handleResize: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;

    const initGlobe = async () => {
      if (!container) return;

      const GlobeModule = await import("globe.gl") as unknown as GlobeModule;
      const Globe = GlobeModule.default as unknown as () => GlobeRuntime;
      if (!mounted) return;

      let countriesData: { features: CountryFeature[] } = { features: [] };
      try {
        const response = await fetch("/data/globe/ne_110m_countries.json");
        countriesData = await response.json();
      } catch (error) {
        console.warn("GeoJSON yüklenemedi:", error);
      }
      if (!mounted) return;

      const globePins: GlobePoint[] = pins.map((pin) => ({
        lat: pin.koordinat.lat,
        lng: pin.koordinat.lng,
        label: pin.baslik,
        color: pin.renk,
        size: getGlobePinSize(pin),
        altitude: pin.oncelik === "CRITICAL" ? 0.03 : pin.oncelik === "HIGH" ? 0.02 : 0.012,
        originalPin: pin,
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
          return `<div style="background:#030A06;color:#C0FFD8;padding:5px 10px;font-family:monospace;font-size:11px;letter-spacing:1px;border:1px solid rgba(0,255,136,0.2)">${properties.NAME || properties.name || ""}</div>`;
        })
        .pointsData(globePins)
        .pointColor("color")
        .pointAltitude("altitude")
        .pointRadius("size")
        .pointLabel((point: GlobePoint) => {
          const pin = point.originalPin;
          const priorityColor = PRIORITY_COLORS[pin.oncelik];
          return `<div style="background:#030A06;border:1px solid ${priorityColor}55;padding:7px 11px;font-family:monospace;font-size:10px;max-width:240px;color:#C0FFD8;letter-spacing:1px"><div style="color:${priorityColor};font-size:9px;margin-bottom:3px">● ${pin.oncelik} · ${pin.kategori.toUpperCase()}</div><div>${point.label.substring(0, 80)}${point.label.length > 80 ? "…" : ""}</div><div style="color:#4A8862;font-size:9px;margin-top:3px">${pin.kaynak}</div></div>`;
        })
        .onPointClick((point: GlobePoint) => {
          if (onPinClick && point.originalPin) {
            onPinClick(point.originalPin);
          }
        });

      globe(container);
      globe.pointOfView({ lat: 39, lng: 35, altitude: 2.1 }, 0);

      const controls = globe.controls?.();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.35;
        controls.enablePan = false;
        controls.minDistance = 160;
        controls.maxDistance = 360;
      }

      const handleResize = () => {
        globe.width(container.clientWidth);
        globe.height(container.clientHeight);
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      globeRef.current = { globe, handleResize };
    };

    initGlobe();

    return () => {
      mounted = false;
      if (globeRef.current) {
        window.removeEventListener("resize", globeRef.current.handleResize);
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
  }, [pins, onPinClick]);

  return <div ref={containerRef} className="w-full h-full" style={{ background: "#030A06" }} />;
}

function getGlobePinSize(pin: Pin): number {
  const base: Record<string, number> = {
    CRITICAL: 0.95,
    HIGH: 0.62,
    MEDIUM: 0.42,
    LOW: 0.26,
  };

  let size = base[pin.oncelik] ?? 0.3;

  if (pin.kategori === "disaster") {
    const magnitudeMatch = pin.ozet.match(/Büyüklük\s*([\d.]+)/i);
    if (magnitudeMatch) {
      const magnitude = parseFloat(magnitudeMatch[1]);
      if (magnitude >= 7) size = Math.max(size, 1.05);
      else if (magnitude >= 5) size = Math.max(size, 0.72);
      else if (magnitude >= 4) size = Math.max(size, 0.52);
    }
  }

  return size;
}
