"use client";

// WatcherG — Bildirim zili bileşeni
// Okunmamış sayısı badge'i + tıklayınca panel aç/kapat

interface NotificationBellProps {
    unreadCount: number;
    isOpen: boolean;
    onToggle: () => void;
}

export default function NotificationBell({
    unreadCount,
    isOpen,
    onToggle,
}: NotificationBellProps) {
    return (
        <button
            onClick={onToggle}
            className={`relative bg-[#12121A]/90 border rounded-lg backdrop-blur-sm shadow-lg px-3 py-2 text-sm transition-all shrink-0 ${isOpen
                    ? "border-[#00FF88]/50 bg-[#1E1E2E]"
                    : "border-[#1E1E2E] hover:bg-[#1E1E2E]"
                }`}
            title="Bildirimler"
        >
            🔔
            {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF4444] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </button>
    );
}
