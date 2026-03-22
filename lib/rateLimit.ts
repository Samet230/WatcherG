// WatcherG â€” Ä°stek sÄ±nÄ±rlama sistemi
// AynÄ± kullanÄ±cÄ±nÄ±n kÄ±sa sÃ¼rede Ã§ok fazla istek gÃ¶ndermesini Ã¶nler
// Dakikada MAX_REQUESTS_PER_MINUTE'den fazla arama yapÄ±lÄ±rsa reddeder

const MAX_REQUESTS_PER_MINUTE = 10;
const WINDOW_DURATION_MS = 60 * 1000;

// IP bazlÄ± istek geÃ§miÅŸi (bellek tabanlÄ±, sunucu yeniden baÅŸlayÄ±nca sÄ±fÄ±rlanÄ±r)
const requestHistory = new Map<string, number[]>();

interface RateLimitResult {
    allowed: boolean;
    remainingRequests: number;
    retryAfterMs: number;
}

// Ä°stek sÄ±nÄ±rÄ±nÄ± kontrol et
export function checkRateLimit(clientIdentifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - WINDOW_DURATION_MS;

    // Bu client'Ä±n geÃ§miÅŸ isteklerini al
    const previousRequests = requestHistory.get(clientIdentifier) || [];

    // Pencere dÄ±ÅŸÄ± istekleri temizle
    const activeRequests = previousRequests.filter(
        (timestamp) => timestamp > windowStart
    );

    if (activeRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        // Limit aÅŸÄ±ldÄ± â€” en eski isteÄŸin sÃ¼resi dolana kadar bekle
        const oldestRequest = activeRequests[0];
        const retryAfterMs = oldestRequest + WINDOW_DURATION_MS - now;

        return {
            allowed: false,
            remainingRequests: 0,
            retryAfterMs: Math.max(0, retryAfterMs),
        };
    }

    // Ä°steÄŸe izin ver ve kaydet
    activeRequests.push(now);
    requestHistory.set(clientIdentifier, activeRequests);

    return {
        allowed: true,
        remainingRequests: MAX_REQUESTS_PER_MINUTE - activeRequests.length,
        retryAfterMs: 0,
    };
}

// Bellek temizleme â€” 10 dakikada bir eski kayÄ±tlarÄ± sil
setInterval(() => {
    const cutoff = Date.now() - WINDOW_DURATION_MS * 2;
    const entries = Array.from(requestHistory.entries());
    for (const [key, timestamps] of entries) {
        const filtered = timestamps.filter((time: number) => time > cutoff);
        if (filtered.length === 0) {
            requestHistory.delete(key);
        } else {
            requestHistory.set(key, filtered);
        }
    }
}, 10 * 60 * 1000);

