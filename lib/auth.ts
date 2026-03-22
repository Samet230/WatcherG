"use client";

// WatcherG — Kimlik doğrulama işlemleri
// Supabase Auth üzerinden oturum yönetimi

import { supabase } from "./supabase";

export const signUp = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) document.cookie = "watcher_auth=true; path=/; max-age=604800";
        return { data, error: null };
    } catch (error: unknown) {
        return { data: null, error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" };
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) document.cookie = "watcher_auth=true; path=/; max-age=604800";
        return { data, error: null };
    } catch (error: unknown) {
        return { data: null, error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" };
    }
};

export const signInWithGoogle = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
        if (error) throw error;
        return { data, error: null };
    } catch (error: unknown) {
        return { data: null, error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" };
    }
};

export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        document.cookie = "watcher_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return { error: null };
    } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" };
    }
};

export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
            document.cookie = "watcher_auth=true; path=/; max-age=604800";
        } else {
            document.cookie = "watcher_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        return { user, error: null };
    } catch (error: unknown) {
        return { user: null, error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" };
    }
};

export const getSession = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return { data, error: null };
    } catch (error: unknown) {
        return { data: null, error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" };
    }
};
