// WatcherG — Bildirim hook'u
// Bildirim verilerini yükler ve store'a yazar

import { useEffect, useCallback } from "react";
import { useNotificationStore } from "@/store/notificationStore";
import { getNotifications, markAsRead, markAllAsRead, cleanupOldNotifications } from "@/lib/db/notifications";

export function useNotifications(userId: string | null) {
    const store = useNotificationStore();

    // İlk yükleme
    useEffect(() => {
        if (!userId) return;

        const loadNotifications = async () => {
            try {
                const notifications = await getNotifications(userId);
                store.setNotifications(notifications);

                // Eski okunmuş bildirimleri temizle (30 gün)
                await cleanupOldNotifications(userId);
            } catch (loadError) {
                console.error("Bildirimler yüklenemedi:", loadError);
            }
        };

        loadNotifications();

        // 60 sn'de bir yenile (yeni bildirimler için)
        const refreshInterval = setInterval(loadNotifications, 60 * 1000);
        return () => clearInterval(refreshInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Okundu işaretle
    const handleMarkRead = useCallback(
        async (notificationId: string) => {
            if (!userId) return;
            const success = await markAsRead(userId, notificationId);
            if (success) {
                store.markRead(notificationId);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userId]
    );

    // Tümünü okundu yap
    const handleMarkAllRead = useCallback(async () => {
        if (!userId) return;
        const success = await markAllAsRead(userId);
        if (success) {
            store.markAllRead();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    return {
        notifications: store.notifications,
        unreadCount: store.unreadCount,
        isOpen: store.isOpen,
        togglePanel: store.togglePanel,
        closePanel: store.closePanel,
        markRead: handleMarkRead,
        markAllRead: handleMarkAllRead,
    };
}
