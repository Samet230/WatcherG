// WatcherG — Watchlist veritabanı işlemleri
// Kullanıcının takip ettiği bölgeleri yönetir (max 10)

import { supabase } from "../supabase";

const MAX_WATCHLIST_ITEMS = 10;

export interface WatchlistItem {
    id: string;
    regionType: "continent" | "country" | "city";
    regionCode: string;
    regionName: string;
    createdAt: string;
}

// Kullanıcının watchlist'ini getir
export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
        const { data, error } = await supabase
            .from("user_watchlist")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data || []).map((row: Record<string, string>) => ({
            id: row.id,
            regionType: row.region_type as WatchlistItem["regionType"],
            regionCode: row.region_code,
            regionName: row.region_name,
            createdAt: row.created_at,
        }));
    } catch (fetchError) {
        console.error("Watchlist alınamadı:", fetchError);
        return [];
    }
}

// Watchlist'e bölge ekle (max 10 kontrolü)
export async function addToWatchlist(
    userId: string,
    regionType: WatchlistItem["regionType"],
    regionCode: string,
    regionName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Max limit kontrolü
        const currentList = await getWatchlist(userId);
        if (currentList.length >= MAX_WATCHLIST_ITEMS) {
            return {
                success: false,
                error: `Watchlist en fazla ${MAX_WATCHLIST_ITEMS} bölge içerebilir.`,
            };
        }

        const { error } = await supabase.from("user_watchlist").insert({
            user_id: userId,
            region_type: regionType,
            region_code: regionCode,
            region_name: regionName,
        });

        if (error) {
            // Duplicate kontrolü
            if (error.code === "23505") {
                return { success: false, error: "Bu bölge zaten takip listesinde." };
            }
            throw error;
        }

        return { success: true };
    } catch (insertError) {
        console.error("Watchlist'e eklenemedi:", insertError);
        return { success: false, error: "Bölge eklenirken hata oluştu." };
    }
}

// Watchlist'ten bölge sil
export async function removeFromWatchlist(
    userId: string,
    watchlistItemId: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("user_watchlist")
            .delete()
            .eq("id", watchlistItemId)
            .eq("user_id", userId);

        if (error) throw error;
        return true;
    } catch (deleteError) {
        console.error("Watchlist'ten silinemedi:", deleteError);
        return false;
    }
}
