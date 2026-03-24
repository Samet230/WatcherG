// WatcherG - In-memory onbellekleme
// Kisa sureli istek yigilmalarini engellemek icin kullanilir.

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

export interface CacheSnapshot<T> {
    data: T | null;
    isExpired: boolean;
    expiry: number | null;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCachedData<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }

    return entry.data as T;
}

export function peekCachedData<T>(key: string): CacheSnapshot<T> {
    const entry = cache.get(key);

    if (!entry) {
        return {
            data: null,
            isExpired: false,
            expiry: null,
        };
    }

    return {
        data: entry.data as T,
        isExpired: Date.now() > entry.expiry,
        expiry: entry.expiry,
    };
}

export function setCachedData<T>(key: string, data: T, ttlMs: number): void {
    cache.set(key, {
        data,
        expiry: Date.now() + ttlMs,
    });
}

export function removeCachedData(key: string): void {
    cache.delete(key);
}
