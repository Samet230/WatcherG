// WatcherG — Kapsam ayarları veritabanı işlemleri
// Her kullanıcı için varsayılan harita kapsamını yönetir (dünya/kıta/ülke/il)

import { supabase } from "../supabase";

export interface ScopeSettings {
    scopeLevel: "world" | "continent" | "country" | "city";
    continentCode: string | null;
    countryCode: string | null;
    cityName: string | null;
}

const DEFAULT_SCOPE: ScopeSettings = {
    scopeLevel: "world",
    continentCode: null,
    countryCode: null,
    cityName: null,
};

// Kullanıcının kapsam ayarlarını getir
export async function getScopeSettings(
    userId: string
): Promise<ScopeSettings> {
    try {
        const { data, error } = await supabase
            .from("user_scope_settings")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

        if (error) throw error;

        if (!data) return DEFAULT_SCOPE;

        return {
            scopeLevel: data.scope_level,
            continentCode: data.continent_code,
            countryCode: data.country_code,
            cityName: data.city_name,
        };
    } catch (fetchError) {
        console.error("Kapsam ayarları alınamadı:", fetchError);
        return DEFAULT_SCOPE;
    }
}

// Kapsam ayarlarını kaydet (upsert — yoksa ekle, varsa güncelle)
export async function updateScopeSettings(
    userId: string,
    settings: ScopeSettings
): Promise<boolean> {
    try {
        const { error } = await supabase.from("user_scope_settings").upsert(
            {
                user_id: userId,
                scope_level: settings.scopeLevel,
                continent_code: settings.continentCode,
                country_code: settings.countryCode,
                city_name: settings.cityName,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

        if (error) throw error;
        return true;
    } catch (updateError) {
        console.error("Kapsam ayarları kaydedilemedi:", updateError);
        return false;
    }
}
