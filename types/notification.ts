// WatcherG — Bildirim tipleri

export interface Notification {
    id: string;
    userId: string;
    title: string;
    content: string;
    category: string;
    source: string;
    isRead: boolean; // varsayılan: false
    createdAt: string;
}

// 30 günden eski okunmuş bildirimler otomatik silinir
export const NOTIFICATION_EXPIRY_DAYS = 30;
