// WatcherG — İlgi alanı veritabanı işlemleri
// Kullanıcının takip ettiği kategorileri yönetir

import { supabase } from "../supabase";
import type { PinCategory } from "@/types/pin";

// Kullanıcının ilgi alanlarını getir
export async function getInterests(userId: string): Promise<PinCategory[]> {
    try {
        const { data, error } = await supabase
            .from("user_interests")
            .select("category")
            .eq("user_id", userId);

        if (error) throw error;
        return (data || []).map((row: { category: string }) => row.category as PinCategory);
    } catch (fetchError) {
        console.error("İlgi alanları alınamadı:", fetchError);
        return [];
    }
}

// İlgi alanı ekle
export async function addInterest(
    userId: string,
    category: PinCategory
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("user_interests")
            .insert({ user_id: userId, category });

        if (error) throw error;
        return true;
    } catch (insertError) {
        console.error("İlgi alanı eklenemedi:", insertError);
        return false;
    }
}

// İlgi alanı sil
export async function removeInterest(
    userId: string,
    category: PinCategory
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("user_interests")
            .delete()
            .eq("user_id", userId)
            .eq("category", category);

        if (error) throw error;
        return true;
    } catch (deleteError) {
        console.error("İlgi alanı silinemedi:", deleteError);
        return false;
    }
}

// İlgi alanı toggle — varsa sil, yoksa ekle
export async function toggleInterest(
    userId: string,
    category: PinCategory
): Promise<{ added: boolean }> {
    const currentInterests = await getInterests(userId);
    const isAlreadyAdded = currentInterests.includes(category);

    if (isAlreadyAdded) {
        await removeInterest(userId, category);
        return { added: false };
    } else {
        await addInterest(userId, category);
        return { added: true };
    }
}
