"use client";

export const dynamic = "force-dynamic";

// WatcherG — Profil ve Ayarlar sayfası
// İlgi alanları, watchlist, kapsam ayarları, yıldızlı pinler

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth";
import { getInterests, toggleInterest } from "@/lib/db/interests";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/db/watchlist";
import type { WatchlistItem } from "@/lib/db/watchlist";
import { getStars, removeStar } from "@/lib/db/stars";
import type { StarredPin } from "@/lib/db/stars";
import { getScopeSettings, updateScopeSettings } from "@/lib/db/scope_settings";
import type { ScopeSettings } from "@/lib/db/scope_settings";
import type { PinCategory } from "@/types/pin";

// Kategori tanımları
const ALL_CATEGORIES: { key: PinCategory; label: string; icon: string }[] = [
    { key: "conflict", label: "Çatışma & Savaş", icon: "⚔️" },
    { key: "disaster", label: "Afet & Deprem", icon: "🌊" },
    { key: "health", label: "Sağlık", icon: "🏥" },
    { key: "politics", label: "Siyaset", icon: "🏛️" },
    { key: "economy", label: "Ekonomi", icon: "📊" },
    { key: "general", label: "Genel Haberler", icon: "📰" },
];

// Kapsam seviyeleri
const SCOPE_LEVELS = [
    { key: "world", label: "Dünya", icon: "🌍" },
    { key: "continent", label: "Kıta", icon: "🗺️" },
    { key: "country", label: "Ülke", icon: "🏳️" },
    { key: "city", label: "Şehir", icon: "🏙️" },
];

interface GeoItem {
    code?: string;
    name: string;
    nameTr?: string;
    country?: string;
    continent?: string;
    lat?: number;
    lng?: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // State tanımları
    const [interests, setInterests] = useState<PinCategory[]>([]);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [stars, setStars] = useState<StarredPin[]>([]);
    const [scopeSettings, setScopeSettings] = useState<ScopeSettings>({
        scopeLevel: "world",
        continentCode: null,
        countryCode: null,
        cityName: null,
    });

    // Geo verileri
    const [continents, setContinents] = useState<GeoItem[]>([]);
    const [countries, setCountries] = useState<GeoItem[]>([]);
    const [cities, setCities] = useState<GeoItem[]>([]);

    // Watchlist arama
    const [watchlistSearch, setWatchlistSearch] = useState("");
    const [watchlistError, setWatchlistError] = useState<string | null>(null);

    // Durum mesajları
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const loadStarsForUser = useCallback(async (targetUserId: string) => {
        try {
            const userStars = await getStars(targetUserId);
            setStars(userStars);
        } catch (loadError) {
            console.error("Yıldızlı pinler yüklenemedi:", loadError);
        }
    }, []);

    // Kullanıcı oturumunu kontrol et
    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                // Misafir kullanıcılarda geçersiz oturum ile watcher_auth çerezi kaldıysa temizle (Sonsuz yönlendirmeyi önler)
                document.cookie = "watcher_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                router.push("/auth/login");
                return;
            }
            setUserId(user.id);
            setUserEmail(user.email || "");
        };
        checkUser();
    }, [router]);

    // Geo verilerini yükle
    useEffect(() => {
        const loadGeoData = async () => {
            try {
                const [continentResponse, countryResponse, cityResponse] = await Promise.all([
                    fetch("/data/continents.json").then((response) => response.json()),
                    fetch("/data/countries.json").then((response) => response.json()),
                    fetch("/data/cities.json").then((response) => response.json()),
                ]);
                setContinents(continentResponse);
                setCountries(countryResponse);
                setCities(cityResponse);
            } catch (geoError) {
                console.error("Geo verileri yüklenemedi:", geoError);
            }
        };
        loadGeoData();
    }, []);

    // Kullanıcı verileri yükle
    useEffect(() => {
        if (!userId) return;

        const loadUserData = async () => {
            setIsLoading(true);
            try {
                const [userInterests, userWatchlist, userStars, userScope] =
                    await Promise.all([
                        getInterests(userId),
                        getWatchlist(userId),
                        getStars(userId),
                        getScopeSettings(userId),
                    ]);

                setInterests(userInterests);
                setWatchlist(userWatchlist);
                setStars(userStars);
                setScopeSettings(userScope);
            } catch (loadError) {
                console.error("Profil verisi yüklenemedi:", loadError);
            } finally {
                setIsLoading(false);
            }
        };
        loadUserData();
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const handleStarsChanged = () => {
            void loadStarsForUser(userId);
        };

        window.addEventListener("watcherg:stars-changed", handleStarsChanged);
        window.addEventListener("focus", handleStarsChanged);

        return () => {
            window.removeEventListener("watcherg:stars-changed", handleStarsChanged);
            window.removeEventListener("focus", handleStarsChanged);
        };
    }, [loadStarsForUser, userId]);

    // İlgi alanı toggle
    const handleToggleInterest = useCallback(
        async (category: PinCategory) => {
            if (!userId) return;
            const result = await toggleInterest(userId, category);
            setInterests((prev) =>
                result.added
                    ? [...prev, category]
                    : prev.filter((c) => c !== category)
            );
        },
        [userId]
    );

    // Watchlist'e ekle
    const handleAddToWatchlist = useCallback(
        async (regionType: WatchlistItem["regionType"], regionCode: string, regionName: string) => {
            if (!userId) return;
            setWatchlistError(null);
            const result = await addToWatchlist(userId, regionType, regionCode, regionName);
            if (result.success) {
                const updatedList = await getWatchlist(userId);
                setWatchlist(updatedList);
                setWatchlistSearch("");
            } else {
                setWatchlistError(result.error || "Eklenemedi.");
            }
        },
        [userId]
    );

    // Watchlist'ten sil
    const handleRemoveFromWatchlist = useCallback(
        async (itemId: string) => {
            if (!userId) return;
            const success = await removeFromWatchlist(userId, itemId);
            if (success) {
                setWatchlist((prev) => prev.filter((item) => item.id !== itemId));
            }
        },
        [userId]
    );

    // Yıldız sil
    const handleRemoveStar = useCallback(
        async (pinId: string) => {
            if (!userId) return;
            const success = await removeStar(userId, pinId);
            if (success) {
                setStars((prev) => prev.filter((star) => star.pinId !== pinId));
            }
        },
        [userId]
    );

    // Kapsam ayarlarını kaydet
    const handleSaveScopeSettings = useCallback(async () => {
        if (!userId) return;
        const success = await updateScopeSettings(userId, scopeSettings);
        if (success) {
            setSaveMessage("✅ Kapsam ayarları kaydedildi.");
        } else {
            setSaveMessage("❌ Kaydetme başarısız.");
        }
        setTimeout(() => setSaveMessage(null), 3000);
    }, [userId, scopeSettings]);

    // Watchlist arama sonuçları
    const filteredWatchlistResults = watchlistSearch.length >= 2
        ? [
            ...countries
                .filter((c) =>
                    (c.nameTr?.toLowerCase() || c.name.toLowerCase()).includes(watchlistSearch.toLowerCase())
                )
                .map((c) => ({
                    type: "country" as const,
                    code: c.code || "",
                    name: c.nameTr || c.name,
                })),
            ...cities
                .filter((c) =>
                    c.name.toLowerCase().includes(watchlistSearch.toLowerCase())
                )
                .map((c) => ({
                    type: "city" as const,
                    code: `${c.country}-${c.name}`,
                    name: `${c.name}, ${c.country}`,
                })),
        ].slice(0, 8)
        : [];

    // Çıkış yap
    const handleSignOut = async () => {
        await signOut();
        router.push("/auth/login");
    };

    if (isLoading && userId) {
        return (
            <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0F] text-[#E0E0E0]">
            {/* Başlık barı */}
            <header className="bg-[#12121A]/90 border-b border-[#1E1E2E] px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-[#666680] hover:text-white transition-colors"
                    >
                        ← Geri
                    </button>
                    <h1 className="text-lg font-semibold">⚙️ Profil & Ayarlar</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-[#666680]">{userEmail}</span>
                    <button
                        onClick={handleSignOut}
                        className="px-3 py-1.5 bg-[#FF4444]/10 text-[#FF4444] rounded-lg text-xs hover:bg-[#FF4444]/20 transition-colors"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* ─── 1. İlgi Alanları ─── */}
                <section className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-[#E0E0E0] mb-1">
                        🎯 İlgi Alanları
                    </h2>
                    <p className="text-xs text-[#666680] mb-4">
                        Takip etmek istediğiniz kategorileri seçin
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {ALL_CATEGORIES.map((cat) => {
                            const isSelected = interests.includes(cat.key);
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => handleToggleInterest(cat.key)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all ${isSelected
                                        ? "bg-[#00FF88]/10 border-[#00FF88]/50 text-[#00FF88] border"
                                        : "bg-[#0A0A0F] border border-[#1E1E2E] text-[#666680] hover:border-[#333]"
                                        }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    {isSelected && <span className="ml-auto">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─── 2. Takip Listesi ─── */}
                <section className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-[#E0E0E0] mb-1">
                        📍 Takip Listesi
                    </h2>
                    <p className="text-xs text-[#666680] mb-4">
                        Ülke veya şehir arayıp ekleyin (maks. 10)
                    </p>

                    {/* Arama */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={watchlistSearch}
                            onChange={(e) => setWatchlistSearch(e.target.value)}
                            placeholder="Ülke veya şehir ara..."
                            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-sm text-[#E0E0E0] placeholder-[#444] focus:outline-none focus:border-[#00FF88]/50 transition-colors"
                        />
                        {filteredWatchlistResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#12121A]/95 border border-[#1E1E2E] rounded-lg backdrop-blur-md shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto">
                                {filteredWatchlistResults.map((result, index) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            handleAddToWatchlist(
                                                result.type,
                                                result.code,
                                                result.name
                                            )
                                        }
                                        className="w-full text-left px-4 py-2.5 text-sm text-[#E0E0E0] hover:bg-[#1E1E2E] transition-colors border-b border-[#1E1E2E]/50 last:border-b-0 flex items-center gap-2"
                                    >
                                        <span className="text-[#666680] text-xs">
                                            {result.type === "country" ? "🏳️" : "🏙️"}
                                        </span>
                                        <span>{result.name}</span>
                                        <span className="text-[#00FF88] text-xs ml-auto">+ ekle</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {watchlistError && (
                        <p className="text-[#FF4444] text-xs mb-3">{watchlistError}</p>
                    )}

                    {/* Watchlist öğeleri */}
                    {watchlist.length === 0 ? (
                        <p className="text-[#444] text-xs text-center py-4">
                            Henüz takip listesine bölge eklenmedi
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {watchlist.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between bg-[#0A0A0F] px-4 py-2.5 rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[#666680]">
                                            {item.regionType === "country" ? "🏳️" : "🏙️"}
                                        </span>
                                        <span className="text-sm">{item.regionName}</span>
                                        <span className="text-[10px] text-[#444] bg-[#1E1E2E] px-1.5 py-0.5 rounded">
                                            {item.regionType}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFromWatchlist(item.id)}
                                        className="text-[#FF4444] text-xs hover:text-[#FF6666] transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <p className="text-[#444] text-[10px] text-right">
                                {watchlist.length}/10 bölge
                            </p>
                        </div>
                    )}
                </section>

                {/* ─── 3. Kapsam Ayarları ─── */}
                <section className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-[#E0E0E0] mb-1">
                        🌐 Varsayılan Kapsam
                    </h2>
                    <p className="text-xs text-[#666680] mb-4">
                        Harita açılınca gösterilecek varsayılan bölge
                    </p>

                    {/* Kapsam seviyesi */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {SCOPE_LEVELS.map((level) => (
                            <button
                                key={level.key}
                                onClick={() =>
                                    setScopeSettings((prev) => ({
                                        ...prev,
                                        scopeLevel: level.key as ScopeSettings["scopeLevel"],
                                    }))
                                }
                                className={`px-3 py-2 rounded-lg text-xs text-center transition-all ${scopeSettings.scopeLevel === level.key
                                    ? "bg-[#00FF88]/10 border border-[#00FF88]/50 text-[#00FF88]"
                                    : "bg-[#0A0A0F] border border-[#1E1E2E] text-[#666680] hover:border-[#333]"
                                    }`}
                            >
                                {level.icon} {level.label}
                            </button>
                        ))}
                    </div>

                    {/* Alt seçimler */}
                    {scopeSettings.scopeLevel === "continent" && (
                        <select
                            value={scopeSettings.continentCode || ""}
                            onChange={(e) =>
                                setScopeSettings((prev) => ({
                                    ...prev,
                                    continentCode: e.target.value || null,
                                }))
                            }
                            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-sm text-[#E0E0E0] mb-4"
                        >
                            <option value="">Kıta seçin...</option>
                            {continents.map((continent) => (
                                <option key={continent.code} value={continent.code}>
                                    {continent.nameTr || continent.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {scopeSettings.scopeLevel === "country" && (
                        <select
                            value={scopeSettings.countryCode || ""}
                            onChange={(e) =>
                                setScopeSettings((prev) => ({
                                    ...prev,
                                    countryCode: e.target.value || null,
                                }))
                            }
                            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-sm text-[#E0E0E0] mb-4"
                        >
                            <option value="">Ülke seçin...</option>
                            {countries.map((country) => (
                                <option key={country.code} value={country.code}>
                                    {country.nameTr || country.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {scopeSettings.scopeLevel === "city" && (
                        <select
                            value={scopeSettings.cityName || ""}
                            onChange={(e) =>
                                setScopeSettings((prev) => ({
                                    ...prev,
                                    cityName: e.target.value || null,
                                }))
                            }
                            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-sm text-[#E0E0E0] mb-4"
                        >
                            <option value="">Şehir seçin...</option>
                            {cities.map((city, index) => (
                                <option key={index} value={city.name}>
                                    {city.name} ({city.country})
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={handleSaveScopeSettings}
                        className="px-6 py-2 bg-[#00FF88] text-[#0A0A0F] rounded-lg text-sm font-semibold hover:bg-[#00CC66] transition-colors"
                    >
                        💾 Kaydet
                    </button>

                    {saveMessage && (
                        <span className="ml-3 text-xs text-[#00FF88]">{saveMessage}</span>
                    )}
                </section>

                {/* ─── 4. Yıldızlı Pinler ─── */}
                <section className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-[#E0E0E0] mb-1">
                        ⭐ Yıldızlı Pinler
                    </h2>
                    <p className="text-xs text-[#666680] mb-4">
                        Kaydettiğiniz favori olaylar
                    </p>

                    {stars.length === 0 ? (
                        <p className="text-[#444] text-xs text-center py-4">
                            Henüz yıldızlanmış pin yok. Haritada bir pine tıklayıp ⭐ ile
                            yıldızlayabilirsiniz.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {stars.map((star) => (
                                <div
                                    key={star.id}
                                    className="flex items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-lg"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#E0E0E0] truncate">
                                            {star.pinData.baslik}
                                        </p>
                                        <p className="text-[10px] text-[#666680] mt-0.5">
                                            {star.pinData.kategori} · {star.pinData.kaynak}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStar(star.pinId)}
                                        className="text-[#FFAA00] text-sm hover:text-[#FF8800] transition-colors ml-3 shrink-0"
                                    >
                                        ★ Kaldır
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}


