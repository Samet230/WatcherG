// WatcherG - Bildirim API endpoint'i
// Kullanicinin bildirimlerini listeler

import { NextRequest, NextResponse } from "next/server";
import { getNotificationsByAuthHeader } from "@/lib/db/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: "Yetkilendirme gerekli" },
                { status: 401 }
            );
        }

        const { notifications, unreadCount, error } =
            await getNotificationsByAuthHeader(authHeader);

        if (error) {
            return NextResponse.json(
                { success: false, error },
                { status: error === "Oturum bulunamadi" ? 401 : 500 }
            );
        }

        return NextResponse.json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (apiError) {
        console.error("Bildirim API hatasi:", apiError);
        return NextResponse.json(
            { success: false, error: "Bildirimler alinamadi" },
            { status: 500 }
        );
    }
}
