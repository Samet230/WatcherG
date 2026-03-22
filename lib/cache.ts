// WatcherG — Cache yönetim katmanı
// Basit in-memory cache — ileride Upstash Redis'e geçiş sadece bu dosyayı etkiler

interface CacheEntry<T> {
    data: T;
    expireAt: number;
}

// Bellekte tutulan cache deposu
const cacheStore = new Map<string, CacheEntry<unknown>>();

// Varsayılan cache süresi: 10 dakika (milisaniye)
const DEFAULT_TTL_MS = 10 * 60 * 1000;

// Cache'den veri oku — süresi dolmuşsa null döner
export function getFromCache<T>(key: string): T | null {
    const entry = cacheStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expireAt) {
        cacheStore.delete(key);
        return null;
    }

    return entry.data as T;
}

// Cache'e veri yaz — opsiyonel süre (ms)
export function setToCache<T>(
    key: string,
    data: T,
    ttlMs: number = DEFAULT_TTL_MS
): void {
    cacheStore.set(key, {
        data,
        expireAt: Date.now() + ttlMs,
    });
}

// Belirli bir cache kaydını sil
export function deleteFromCache(key: string): void {
    cacheStore.delete(key);
}

// Tüm cache'i temizle
export function clearCache(): void {
    cacheStore.clear();
}

// Süresi dolmuş tüm kayıtları temizle
export function purgeExpiredEntries(): number {
    let purgedCount = 0;
    const now = Date.now();

    cacheStore.forEach((entry, key) => {
        if (now > entry.expireAt) {
            cacheStore.delete(key);
            purgedCount++;
        }
    });

    return purgedCount;
}
