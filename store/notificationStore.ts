// WatcherG — Bildirim state yönetimi (Zustand)
// Okunmamış sayısı, bildirim listesi, panel açık/kapalı

import { create } from "zustand";
import type { Notification } from "@/types/notification";

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    isLoading: boolean;

    // Aksiyonlar
    setNotifications: (notifications: Notification[]) => void;
    setUnreadCount: (count: number) => void;
    togglePanel: () => void;
    closePanel: () => void;
    markRead: (notificationId: string) => void;
    markAllRead: () => void;
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    isLoading: false,

    setNotifications: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
        }),

    setUnreadCount: (unreadCount) => set({ unreadCount }),

    togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

    closePanel: () => set({ isOpen: false }),

    markRead: (notificationId) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),

    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({
                ...n,
                isRead: true,
            })),
            unreadCount: 0,
        })),

    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        })),
}));
