// WatcherG — Bellek-içi önbellekleme (In-memory caching)
// API rate limit'lerine takılmamak ve hızlı yanıt dönmek için kullanılır.
// Özellikle Vercel gibi sunucusuz ortamlarda her instance kendi önbelleğine sahiptir,
// ama kısa süreli istek yığılmalarını (spike) engellemek için idealdir.

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Önbellekte geçerli bir veri varsa döndürür, yoksa null döner
 */
export function getCachedData<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }

    return entry.data as T;
}

/**
 * Veriyi belirtilen süre boyunca (milisaniye) bellekte saklar
 */
export function setCachedData<T>(key: string, data: T, ttlMs: number): void {
    cache.set(key, {
        data,
        expiry: Date.now() + ttlMs,
    });
}

/**
 * İstenilen key'i önbellekten siler (Manuel temizleme için)
 */
export function removeCachedData(key: string): void {
    cache.delete(key);
}
