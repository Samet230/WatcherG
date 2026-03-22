// WatcherG — Bildirim kontrol sistemi
// Watchlist bölgelerini mevcut pinlerle karşılaştırır
// Yeni olay varsa bildirim oluşturur

import type { Pin } from "@/types/pin";
import type { RegionFilter } from "./recommendations";
import { createNotification } from "./db/notifications";

// Pinlerin watchlist bölgelerinde olup olmadığını kontrol et
// ve eşleşen yeni olaylar için bildirim oluştur
export async function checkWatchlistForNewEvents(
    userId: string,
    pins: Pin[],
    watchlistFilters: RegionFilter[],
    lastCheckTime: Date
): Promise<number> {
    if (watchlistFilters.length === 0 || pins.length === 0) return 0;

    let notificationsCreated = 0;

    // Son kontrol zamanından sonra oluşan pinleri filtrele
    const newPins = pins.filter((pin) => {
        const pinDate = new Date(pin.tarih);
        return pinDate > lastCheckTime;
    });

    if (newPins.length === 0) return 0;

    // Her watchlist bölgesi için yeni pinleri kontrol et
    for (const filter of watchlistFilters) {
        const matchingPins = newPins.filter((pin) => {
            if (filter.type === "country") {
                // Pin konumunun ülke sınırları içinde olup olmadığını kontrol et
                const searchText = `${pin.baslik} ${pin.ozet}`.toLowerCase();
                return searchText.includes(filter.name.toLowerCase());
            }
            return false;
        });

        // Eşleşen pinler için bildirimler oluştur (çok fazla olmasın diye max 3)
        const pinsToNotify = matchingPins.slice(0, 3);
        for (const pin of pinsToNotify) {
            const success = await createNotification(userId, {
                title: `${filter.name} — ${pin.baslik}`,
                content: pin.ozet.slice(0, 100),
                category: pin.kategori,
                source: pin.kaynak,
            });

            if (success) notificationsCreated++;
        }
    }

    return notificationsCreated;
}
