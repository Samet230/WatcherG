"use client";

import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import type { Pin, PinCategory } from "@/types/pin";
import { addPinsToMap, clearPinsFromMap } from "./MapPin";

interface LeafletMapProps {
    pins?: Pin[];
    selectedCategories?: PinCategory[];
    onPinSelect?: (pin: Pin) => void;
}

export default function LeafletMap({
    pins = [],
    selectedCategories = [],
    onPinSelect,
}: LeafletMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.CircleMarker[]>([]);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const scheduleInvalidateSize = useCallback(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        const invalidate = () => {
            map.invalidateSize(true);
        };

        invalidate();
        window.requestAnimationFrame(invalidate);
        window.setTimeout(invalidate, 120);
        window.setTimeout(invalidate, 280);
        window.setTimeout(invalidate, 520);
    }, []);

    const recoverViewport = useCallback(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        const center = map.getCenter();
        const zoom = map.getZoom();
        scheduleInvalidateSize();
        map.setView(center, zoom, { animate: false });
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                layer.redraw();
            }
        });
    }, [scheduleInvalidateSize]);

    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        const map = L.map(mapRef.current, {
            center: [39.0, 35.0],
            zoom: 3,
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true,
        });

        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 19,
                subdomains: "abcd",
                updateWhenIdle: false,
                keepBuffer: 4,
            }
        ).addTo(map);

        map.whenReady(() => {
            recoverViewport();
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.control
            .attribution({ position: "bottomleft" })
            .addAttribution(
                '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | CartoDB'
            )
            .addTo(map);

        leafletMapRef.current = map;

        const timer = window.setTimeout(() => {
            recoverViewport();
        }, 120);

        const handleResize = () => {
            recoverViewport();
        };
        window.addEventListener("resize", handleResize);

        if (typeof ResizeObserver !== "undefined" && mapRef.current) {
            resizeObserverRef.current = new ResizeObserver(() => {
                recoverViewport();
            });
            resizeObserverRef.current.observe(mapRef.current);
        }

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                recoverViewport();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = null;
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, [recoverViewport]);

    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        clearPinsFromMap(map, markersRef.current);
        markersRef.current = [];

        const filteredPins =
            selectedCategories.length === 0
                ? []
                : pins.filter((pin) => selectedCategories.includes(pin.kategori));
        const mappedPins = filteredPins.filter(
            (pin) => Number.isFinite(pin.koordinat.lat) && Number.isFinite(pin.koordinat.lng)
        );

        markersRef.current = addPinsToMap(map, mappedPins);
        recoverViewport();

        if (onPinSelect) {
            markersRef.current.forEach((marker, index) => {
                marker.on("click", () => {
                    if (mappedPins[index]) {
                        onPinSelect(mappedPins[index]);
                    }
                });
            });
        }
    }, [onPinSelect, pins, recoverViewport, selectedCategories]);

    return <div ref={mapRef} className="w-full h-full relative z-0" />;
}
