// WatcherG — API ortak tipleri

// API yanıt formatı
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
    source: string;
    cachedAt: string | null;
}

// API hata durumları
export type ApiErrorType =
    | "API_DOWN"           // API çalışmıyor
    | "RATE_LIMITED"       // Limit doldu
    | "NO_CONNECTION"      // Bağlantı yok
    | "NO_DATA"            // Veri bulunamadı
    | "CACHE_FALLBACK";    // Cache'den dönülüyor

// Kullanıcıya gösterilecek hata mesajları
export const USER_ERROR_MESSAGES: Record<ApiErrorType, string> = {
    API_DOWN: "Bu kategori şu an geçici olarak kullanılamıyor",
    RATE_LIMITED: "Veriler güncelleniyor, lütfen bekleyin",
    NO_CONNECTION: "İnternet bağlantınızı kontrol edin",
    NO_DATA: "Bu bölgede şu an veri bulunamadı",
    CACHE_FALLBACK: "Son güncelleme gösteriliyor",
} as const;

// Arama sorgusu yapısı
export interface SearchQuery {
    query: string;
    kategori: string | null;
    konum: string | null;
    scope: string;
}

// API kaynak bilgileri
export interface ApiSource {
    name: string;
    baseUrl: string;
    requiresKey: boolean;
    dailyLimit: number | null;
    cacheDurationMinutes: number;
    baseReliabilityScore: number;
}
