// WatcherG — Kişiselleştirilmiş içerik önerisi sistemi
// Kullanıcının ilgi alanlarına göre otomatik sorgular oluşturur
// Dashboard açılışında çağrılarak kişiye özel veri çekilir

import type { PinCategory } from "@/types/pin";
import type { WatchlistItem } from "@/lib/db/watchlist";
import type { ScopeSettings } from "@/lib/db/scope_settings";

// Kullanıcının ilgi alanlarına göre aktif edilecek kategorileri belirle
export function getRecommendedCategories(
    userInterests: PinCategory[]
): PinCategory[] {
    // İlgi alanı yoksa varsayılan: deprem + haber
    if (userInterests.length === 0) {
        return ["conflict", "disaster", "general"];
    }
    return userInterests;
}

// Watchlist bölgelerine göre filtreleme kuralları oluştur
export interface RegionFilter {
    type: "continent" | "country" | "city";
    code: string;
    name: string;
}

export function getWatchlistFilters(
    watchlist: WatchlistItem[]
): RegionFilter[] {
    return watchlist.map((item) => ({
        type: item.regionType,
        code: item.regionCode,
        name: item.regionName,
    }));
}

// Kapsam ayarlarına göre başlangıç görünümünü belirle
export interface MapViewConfig {
    center: [number, number];
    zoom: number;
}

// Varsayılan merkez koordinatları
const SCOPE_DEFAULTS: Record<string, MapViewConfig> = {
    world: { center: [20, 30], zoom: 2 },
    EU: { center: [50, 10], zoom: 4 },
    AS: { center: [30, 80], zoom: 3 },
    AF: { center: [5, 20], zoom: 3 },
    NA: { center: [40, -100], zoom: 3 },
    SA: { center: [-15, -60], zoom: 3 },
    OC: { center: [-25, 140], zoom: 4 },
};

const COUNTRY_CENTERS: Record<string, [number, number]> = {
    TR: [39, 35],
    US: [39.8, -98.5],
    DE: [51.1, 10.4],
    FR: [46.6, 2.2],
    GB: [55.3, -3.4],
    JP: [36.2, 138.2],
    CN: [35, 105],
    IN: [20.6, 78.9],
    BR: [-14.2, -51.9],
    RU: [55.7, 37.6],
};

export function getMapViewFromScope(scopeSettings: ScopeSettings): MapViewConfig {
    switch (scopeSettings.scopeLevel) {
        case "continent":
            return SCOPE_DEFAULTS[scopeSettings.continentCode || "world"] || SCOPE_DEFAULTS.world;

        case "country": {
            const countryCenter = COUNTRY_CENTERS[scopeSettings.countryCode || ""];
            if (countryCenter) {
                return { center: countryCenter, zoom: 6 };
            }
            return SCOPE_DEFAULTS.world;
        }

        case "city":
            // Şehir koordinatları cities.json'dan çekilmeli — şimdilik varsayılan
            return SCOPE_DEFAULTS.world;

        default:
            return SCOPE_DEFAULTS.world;
    }
}

// Pin'in watchlist bölgesinde olup olmadığını kontrol et
export function isPinInWatchlistRegion(
    pinCountryCode: string,
    watchlistFilters: RegionFilter[]
): boolean {
    if (watchlistFilters.length === 0) return false;

    return watchlistFilters.some((filter) => {
        if (filter.type === "country") {
            return pinCountryCode === filter.code;
        }
        // Kıta ve şehir filtresi ileri aşamada genişletilebilir
        return false;
    });
}
