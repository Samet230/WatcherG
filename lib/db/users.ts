// WatcherG - Kullanici veritabani islemleri

import { supabase } from "../supabase";
import { getAuthenticatedUser } from "./server";

// Kayit olan kullanici icin varsayilan profil olusturur
export const createProfile = async (userId: string) => {
    try {
        const { data, error } = await supabase.from("profiles").insert([
            {
                user_id: userId,
            },
        ]);
        if (error) throw error;
        return { data, error: null };
    } catch (error: unknown) {
        return {
            data: null,
            error: error instanceof Error ? error.message : "Bilinmeyen bir hata olustu",
        };
    }
};

// Kullanici profil bilgilerini getirir
export const getProfile = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error: unknown) {
        return {
            data: null,
            error: error instanceof Error ? error.message : "Bilinmeyen bir hata olustu",
        };
    }
};

// Kullanici profilini gunceller
export const updateProfile = async (userId: string, updates: Record<string, unknown>) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        if (error) throw error;
        return { data, error: null };
    } catch (error: unknown) {
        return {
            data: null,
            error: error instanceof Error ? error.message : "Bilinmeyen bir hata olustu",
        };
    }
};

export const getProfileByAuthHeader = async (authHeader: string) => {
    try {
        const { supabase: authenticatedClient, user, error: authError } =
            await getAuthenticatedUser(authHeader);

        if (authError) {
            throw authError;
        }

        if (!user) {
            return { data: null, user: null, error: "Oturum bulunamadi" };
        }

        const { data, error } = await authenticatedClient
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return {
            data,
            user: {
                id: user.id,
                email: user.email ?? null,
            },
            error: null,
        };
    } catch (error: unknown) {
        return {
            data: null,
            user: null,
            error: error instanceof Error ? error.message : "Bilinmeyen bir hata olustu",
        };
    }
};
