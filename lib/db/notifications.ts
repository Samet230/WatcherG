// WatcherG - Bildirim veritabani islemleri
// CRUD: bildirim olustur, listele, okundu isaretle, eski olanlari temizle

import { supabase } from "../supabase";
import type { Notification } from "@/types/notification";
import { NOTIFICATION_EXPIRY_DAYS } from "@/types/notification";
import { getAuthenticatedUser } from "./server";

// Kullanicinin bildirimlerini getir (son 50)
export async function getNotifications(userId: string): Promise<Notification[]> {
    try {
        const { data, error } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        return (data || []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            userId: row.user_id as string,
            title: row.title as string,
            content: row.content as string,
            category: row.category as string,
            source: row.source as string,
            isRead: row.is_read as boolean,
            createdAt: row.created_at as string,
        }));
    } catch (fetchError) {
        console.error("Bildirimler alinamadi:", fetchError);
        return [];
    }
}

// Okunmamis bildirim sayisini getir
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from("user_notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) throw error;
        return count || 0;
    } catch (countError) {
        console.error("Okunmamis sayisi alinamadi:", countError);
        return 0;
    }
}

// Bildirim olustur
export async function createNotification(
    userId: string,
    notification: {
        title: string;
        content: string;
        category: string;
        source: string;
    }
): Promise<boolean> {
    try {
        const { error } = await supabase.from("user_notifications").insert({
            user_id: userId,
            title: notification.title,
            content: notification.content,
            category: notification.category,
            source: notification.source,
            is_read: false,
        });

        if (error) throw error;
        return true;
    } catch (insertError) {
        console.error("Bildirim olusturulamadi:", insertError);
        return false;
    }
}

// Bildirimi okundu olarak isaretle
export async function markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("user_notifications")
            .update({ is_read: true })
            .eq("id", notificationId)
            .eq("user_id", userId);

        if (error) throw error;
        return true;
    } catch (updateError) {
        console.error("Bildirim okundu yapilamadi:", updateError);
        return false;
    }
}

// Tum bildirimleri okundu yap
export async function markAllAsRead(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("user_notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) throw error;
        return true;
    } catch (updateError) {
        console.error("Toplu okundu yapilamadi:", updateError);
        return false;
    }
}

// 30 gunden eski okunmus bildirimleri temizle
export async function cleanupOldNotifications(userId: string): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - NOTIFICATION_EXPIRY_DAYS);

        const { data, error } = await supabase
            .from("user_notifications")
            .delete()
            .eq("user_id", userId)
            .eq("is_read", true)
            .lt("created_at", cutoffDate.toISOString())
            .select("id");

        if (error) throw error;
        return data?.length || 0;
    } catch (cleanupError) {
        console.error("Eski bildirimler temizlenemedi:", cleanupError);
        return 0;
    }
}

export async function getNotificationsByAuthHeader(authHeader: string): Promise<{
    notifications: Notification[];
    unreadCount: number;
    error: string | null;
}> {
    try {
        const { supabase: authenticatedClient, user, error: authError } =
            await getAuthenticatedUser(authHeader);

        if (authError) {
            throw authError;
        }

        if (!user) {
            return {
                notifications: [],
                unreadCount: 0,
                error: "Oturum bulunamadi",
            };
        }

        const { data, error } = await authenticatedClient
            .from("user_notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            throw error;
        }

        const notifications = (data || []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            userId: row.user_id as string,
            title: row.title as string,
            content: row.content as string,
            category: row.category as string,
            source: row.source as string,
            isRead: row.is_read as boolean,
            createdAt: row.created_at as string,
        }));

        return {
            notifications,
            unreadCount: notifications.filter((item) => !item.isRead).length,
            error: null,
        };
    } catch (error: unknown) {
        return {
            notifications: [],
            unreadCount: 0,
            error: error instanceof Error ? error.message : "Bilinmeyen bir hata olustu",
        };
    }
}
