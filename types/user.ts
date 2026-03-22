// WatcherG — Kullanıcı tipleri

// Kullanıcı tipi seviyeleri
export type UserRole = "guest" | "user" | "admin";

// Kullanıcı profil bilgileri
export interface UserProfile {
    id: string;
    userId: string;
    username: string;
    language: string; // varsayılan: "tr"
    theme: "dark" | "light"; // varsayılan: "dark"
    defaultScope: ScopeLevel; // varsayılan: "world"
    defaultContinent: string | null;
    defaultCountry: string | null;
    defaultCity: string | null;
    createdAt: string;
    updatedAt: string;
}

// Kapsam seviyeleri
export type ScopeLevel = "world" | "continent" | "country" | "city";

// İlgi alanı kaydı
export interface Interest {
    id: string;
    userId: string;
    topic: string;
    category: string;
    starColor: string;
    priority: number; // 1-5 arası
    createdAt: string;
}

// Watchlist bölge kaydı
export interface WatchlistRegion {
    id: string;
    userId: string;
    regionName: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    category: string;
    isActive: boolean;
    createdAt: string;
}

// Ücretsiz kullanıcı watchlist sınırı
export const MAX_WATCHLIST_REGIONS = 10;

// Yıldızlanan içerik
export interface StarredItem {
    id: string;
    userId: string;
    contentId: string;
    contentType: string;
    contentTitle: string;
    contentUrl: string;
    starColor: string;
    latitude: number;
    longitude: number;
    createdAt: string;
}

// Kapsam ayarı
export interface ScopeSetting {
    id: string;
    userId: string;
    mode: string;
    scopeLevel: ScopeLevel;
    continent: string | null;
    country: string | null;
    city: string | null;
    createdAt: string;
    updatedAt: string;
}
