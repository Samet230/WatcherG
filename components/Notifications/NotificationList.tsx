"use client";

// WatcherG — Bildirim listesi paneli
// Açılır dropdown — bildirim kartları, okundu/okunmadı, tümünü oku

import type { Notification } from "@/types/notification";

// Geçen süreyi hesapla
function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Az önce";
    if (diffMinutes < 60) return `${diffMinutes} dk`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} sa`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gün`;
    return `${Math.floor(diffDays / 7)} hafta`;
}

// Kategori ikonları
const CATEGORY_ICONS: Record<string, string> = {
    earthquake: "🔴",
    news: "📰",
    fire: "🔥",
    disaster: "🌊",
    conflict: "⚔️",
    health: "🏥",
    flight: "✈️",
    marine: "🚢",
};

interface NotificationListProps {
    notifications: Notification[];
    onMarkRead: (notificationId: string) => void;
    onMarkAllRead: () => void;
    onClose: () => void;
}

export default function NotificationList({
    notifications,
    onMarkRead,
    onMarkAllRead,
    onClose,
}: NotificationListProps) {
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="absolute top-14 right-4 w-96 max-h-[70vh] bg-[#12121A]/95 border border-[#1E1E2E] rounded-xl backdrop-blur-md shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Başlık */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E2E]">
                <h3 className="text-sm font-semibold text-[#E0E0E0]">
                    🔔 Bildirimler
                    {unreadCount > 0 && (
                        <span className="ml-2 text-[10px] bg-[#FF4444]/20 text-[#FF4444] px-2 py-0.5 rounded-full">
                            {unreadCount} yeni
                        </span>
                    )}
                </h3>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="text-[10px] text-[#00FF88] hover:text-[#00CC66] transition-colors"
                        >
                            Tümünü oku
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-[#666680] hover:text-white text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Bildirim listesi */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="text-3xl mb-2">🔕</span>
                        <p className="text-[#666680] text-xs">
                            Henüz bildirim yok
                        </p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => {
                                if (!notification.isRead) {
                                    onMarkRead(notification.id);
                                }
                            }}
                            className={`px-4 py-3 border-b border-[#1E1E2E]/50 cursor-pointer transition-colors ${notification.isRead
                                    ? "bg-transparent hover:bg-[#1E1E2E]/30"
                                    : "bg-[#00FF88]/5 hover:bg-[#00FF88]/10"
                                }`}
                        >
                            <div className="flex items-start gap-2.5">
                                {/* Sol — ikon + okunmamış nokta */}
                                <div className="relative mt-0.5">
                                    <span className="text-sm">
                                        {CATEGORY_ICONS[notification.category] || "📌"}
                                    </span>
                                    {!notification.isRead && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00FF88] rounded-full" />
                                    )}
                                </div>

                                {/* Sağ — içerik */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-xs leading-relaxed ${notification.isRead
                                                ? "text-[#666680]"
                                                : "text-[#E0E0E0]"
                                            }`}
                                    >
                                        <strong>{notification.title}</strong>
                                    </p>
                                    <p className="text-[10px] text-[#444] mt-0.5 truncate">
                                        {notification.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-[#444]">
                                            {notification.source}
                                        </span>
                                        <span className="text-[10px] text-[#333]">·</span>
                                        <span className="text-[10px] text-[#444]">
                                            {getRelativeTime(notification.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
