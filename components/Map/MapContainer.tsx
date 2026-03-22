"use client";

// WatcherG — 2D Leaflet Harita Bileşeni
// Deprem + haber pinleri ve interaktif popup'lar ile karanlık tema harita

import { useEffect, useRef } from "react";
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

    // Haritayı başlat
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        const map = L.map(mapRef.current, {
            center: [39.0, 35.0],
            zoom: 3,
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true, // Fixes disappearing vector markers during zoom
        });

        // CartoDB Dark Matter tile katmanı (ücretsiz, key gerektirmez)
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 19,
                subdomains: "abcd",
            }
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.control
            .attribution({ position: "bottomleft" })
            .addAttribution(
                '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | CartoDB'
            )
            .addTo(map);

        leafletMapRef.current = map;

        // Container boyut değişimlerini yakala (Kayma hatasını önler)
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        const handleResize = () => {
            map.invalidateSize();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", handleResize);
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    // Pinler veya kategori filtreleri değişince güncelle
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        // Eski pinleri temizle
        clearPinsFromMap(map, markersRef.current);
        markersRef.current = [];

        // Seçili kategorilere göre filtrele
        const filteredPins =
            selectedCategories.length === 0
                ? pins
                : pins.filter((pin) => selectedCategories.includes(pin.kategori));

        // Yeni pinleri ekle
        markersRef.current = addPinsToMap(map, filteredPins);

        // Pin tıklama olayını dinle
        if (onPinSelect) {
            markersRef.current.forEach((marker, index) => {
                marker.on("click", () => {
                    if (filteredPins[index]) {
                        onPinSelect(filteredPins[index]);
                    }
                });
            });
        }
    }, [pins, selectedCategories, onPinSelect]);

    return <div ref={mapRef} className="w-full h-full relative z-0" />;
}
