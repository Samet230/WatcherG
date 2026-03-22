import { supabase } from "../supabase";
import type { Pin } from "@/types/pin";

export interface StarredPin {
    id: string;
    pinId: string;
    pinData: Pin;
    createdAt: string;
}

export async function getStars(userId: string): Promise<StarredPin[]> {
    try {
        const { data, error } = await supabase
            .from("user_stars")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data || []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            pinId: row.pin_id as string,
            pinData: row.pin_data as Pin,
            createdAt: row.created_at as string,
        }));
    } catch (fetchError) {
        console.error("Yıldızlı pinler alınamadı:", fetchError);
        return [];
    }
}

export async function addStar(userId: string, pin: Pin): Promise<boolean> {
    try {
        const safePin = JSON.parse(JSON.stringify(pin)) as Pin;
        const { error } = await supabase.from("user_stars").upsert({
            user_id: userId,
            pin_id: pin.id,
            pin_data: safePin,
        }, {
            onConflict: "user_id,pin_id",
        });

        if (error) throw error;
        return true;
    } catch (insertError) {
        console.error("Yıldız eklenemedi:", insertError);
        return false;
    }
}

export async function removeStar(
    userId: string,
    pinId: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("user_stars")
            .delete()
            .eq("user_id", userId)
            .eq("pin_id", pinId);

        if (error) throw error;
        return true;
    } catch (deleteError) {
        console.error("Yıldız silinemedi:", deleteError);
        return false;
    }
}

export async function isStarred(
    userId: string,
    pinId: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from("user_stars")
            .select("id")
            .eq("user_id", userId)
            .eq("pin_id", pinId)
            .maybeSingle();

        if (error) throw error;
        return data !== null;
    } catch (checkError) {
        console.error("Yıldız kontrolü başarısız:", checkError);
        return false;
    }
}

export async function toggleStar(
    userId: string,
    pin: Pin
): Promise<{ starred: boolean; success: boolean }> {
    const currentlyStarred = await isStarred(userId, pin.id);

    if (currentlyStarred) {
        const removed = await removeStar(userId, pin.id);
        return { starred: removed ? false : true, success: removed };
    }

    const added = await addStar(userId, pin);
    return { starred: added, success: added };
}
