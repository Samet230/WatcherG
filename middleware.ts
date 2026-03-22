import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const path = url.pathname;

    // Dashboard misafir modunda erişilebilir; profil yalnız oturumlu kullanıcı içindir.
    const hasAuth = request.cookies.has("sb-access-token") || request.cookies.has("watcher_auth");
    const isProtectedRoute = path.startsWith("/profile");

    if (isProtectedRoute && !hasAuth) {
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Middleware hangi kök yollarda çalışacak
export const config = {
    matcher: [
        "/profile/:path*",
    ],
};
