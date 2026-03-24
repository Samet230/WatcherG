// WatcherG - Cache yonetim katmani
// Basit in-memory cache. Ileride Redis'e gecis sadece bu dosyayi etkiler.

interface CacheEntry<T> {
    data: T;
    expireAt: number;
}

export interface CacheSnapshot<T> {
    data: T | null;
    isExpired: boolean;
    expireAt: number | null;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 10 * 60 * 1000;

export function getFromCache<T>(key: string): T | null {
    const entry = cacheStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expireAt) {
        cacheStore.delete(key);
        return null;
    }

    return entry.data as T;
}

export function peekCache<T>(key: string): CacheSnapshot<T> {
    const entry = cacheStore.get(key);

    if (!entry) {
        return {
            data: null,
            isExpired: false,
            expireAt: null,
        };
    }

    return {
        data: entry.data as T,
        isExpired: Date.now() > entry.expireAt,
        expireAt: entry.expireAt,
    };
}

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

export function deleteFromCache(key: string): void {
    cacheStore.delete(key);
}

export function clearCache(): void {
    cacheStore.clear();
}

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
