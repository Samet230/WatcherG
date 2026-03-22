// WatcherG - Kullanici API endpoint'i
// Yetkili kullanicinin profilini dondurur

import { NextRequest, NextResponse } from "next/server";
import { getProfileByAuthHeader } from "@/lib/db/users";

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

        const { data: profile, user, error } = await getProfileByAuthHeader(authHeader);

        if (error || !user) {
            return NextResponse.json(
                { success: false, error: error || "Oturum bulunamadi" },
                { status: error === "Oturum bulunamadi" ? 401 : 500 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
            },
            profile,
        });
    } catch (error) {
        console.error("Kullanici API hatasi:", error);
        return NextResponse.json(
            { success: false, error: "Kullanici bilgileri alinamadi" },
            { status: 500 }
        );
    }
}
