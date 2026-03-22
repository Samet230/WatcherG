"use client";

// WatcherG — 2D/3D geçiş yönetimi + veri katmanı (v2)
// "Her şey haberdir, konu farklı"

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMapStore } from "@/store/mapStore";
import type { Pin, NewsCategory } from "@/types/pin";
import { CATEGORY_CONFIG } from "@/types/pin";
import TagBar from "../ModTags/TagBar";
import DetailPanel from "../Panel/DetailPanel";
import SearchBar from "../SearchBar/SearchBar";
import { useSearch } from "@/hooks/useSearch";
import { getCurrentUser } from "@/lib/auth";
import { toggleStar, isStarred as checkIsStarred } from "@/lib/db/stars";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBell from "../Notifications/NotificationBell";
import NotificationList from "../Notifications/NotificationList";
import TimelinePanel from "../Panel/TimelinePanel";

interface ApiResponse {
  success: boolean;
  data?: Pin[];
  pins?: Pin[];
}

const LeafletMap = dynamic(() => import("../Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#030A06" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", fontFamily: "monospace" }}>
        <div style={{ width: "36px", height: "36px", border: "2px solid #00FF88", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#4A8862", fontSize: "10px", letterSpacing: "3px" }}>2D_MAP_LOADING...</span>
      </div>
    </div>
  ),
});

const VectorGlobe = dynamic(() => import("./VectorGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#030A06" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", fontFamily: "monospace" }}>
        <div style={{ width: "36px", height: "36px", border: "2px solid #00FF88", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#4A8862", fontSize: "10px", letterSpacing: "3px" }}>3D_GLOBE_LOADING...</span>
      </div>
    </div>
  ),
});

// Başlangıçta aktif kategoriler
const DEFAULT_CATEGORIES: NewsCategory[] = ["conflict", "disaster", "general"];

export default function GlobeContainer() {
  const viewMode = useMapStore((state) => state.viewMode);
  const setViewMode = useMapStore((state) => state.setViewMode);
  const isFullscreen = useMapStore((state) => state.isFullscreen);
  const toggleFullscreen = useMapStore((state) => state.toggleFullscreen);
  const setFeedState = useMapStore((state) => state.setFeedState);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPinStarred, setIsPinStarred] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    getCurrentUser().then(({ user }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  const search = useSearch();
  const notifications = useNotifications(currentUserId);
  const isAuthenticated = Boolean(currentUserId);
  const isGuest = !isAuthenticated;

  // Filtreli pinler
  const categoryFilteredPins = useMemo(
    () =>
      selectedCategories.length === 0
        ? pins
        : pins.filter((pin) => selectedCategories.includes(pin.kategori)),
    [pins, selectedCategories]
  );

  const filteredPins = useMemo(
    () =>
      search.hasSearched && search.results.length > 0
        ? search.results
        : search.hasSearched && search.results.length === 0
          ? []
          : categoryFilteredPins,
    [categoryFilteredPins, search.hasSearched, search.results]
  );

  useEffect(() => {
    setFeedState({
      allPins: pins,
      visiblePins: filteredPins,
      selectedCategories,
      isFeedLoading: isLoading,
      lastUpdated: lastUpdated?.toISOString() ?? null,
    });
  }, [filteredPins, isLoading, lastUpdated, pins, selectedCategories, setFeedState]);

  // Veri çekme — seçili kategorilere göre ilgili endpoint'leri çağır
  useEffect(() => {
    const fetchAllPins = async () => {
      setIsLoading(true);
      try {
        // Seçili kategorilerden unique endpoint'leri belirle
        const endpointsToFetch = new Set<string>();

        // Afet / deprem her zaman çekilir
        endpointsToFetch.add("/api/earthquakes");

        if (selectedCategories.includes("disaster")) {
          endpointsToFetch.add("/api/fires");
          endpointsToFetch.add("/api/disasters");
        }
        if (selectedCategories.includes("conflict")) {
          endpointsToFetch.add("/api/conflicts");
        }
        // news, politics, health, economy → hepsi /api/news endpoint'inden gelir,
        // formatter kategoriyi halleder
        if (
          selectedCategories.some((c) =>
            ["general", "politics", "health", "economy"].includes(c)
          )
        ) {
          endpointsToFetch.add("/api/news");
        }

        const requests = Array.from(endpointsToFetch).map((url) =>
          fetch(url).then((r) => r.json())
        );

        const results = await Promise.allSettled(requests);
        const newPins: Pin[] = [];

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const value = result.value as ApiResponse;
            if (value.success) {
              const data = value.data || value.pins || [];
              newPins.push(...data);
            }
          }
        });

        setPins(newPins);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Pin verisi çekilemedi:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPins();
    const interval = setInterval(fetchAllPins, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCategories]);

  const handlePinSelect = useCallback(async (pin: Pin) => {
    setSelectedPin(pin);
    if (currentUserId) {
      try {
        const starred = await checkIsStarred(currentUserId, pin.id);
        setIsPinStarred(starred);
      } catch { setIsPinStarred(false); }
    }
  }, [currentUserId]);

  const handleStarToggle = useCallback(async (pin: Pin) => {
    if (!currentUserId) return;
    try {
      const result = await toggleStar(currentUserId, pin);
      if (result.success) {
        setIsPinStarred(result.starred);
        window.dispatchEvent(new CustomEvent("watcherg:stars-changed"));
      }
    } catch (e: unknown) {
      console.error("Yıldız toggle hatası:", e);
    }
  }, [currentUserId]);

  const handleToggleCategory = (category: NewsCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleViewToggle = (mode: "2d" | "3d") => {
    if (mode === viewMode) return;
    setIsTransitioning(true);
    setTimeout(() => { setViewMode(mode); setIsTransitioning(false); }, 150);
  };

  // Alt bar için kategori sayaçları (v2 mantığı)
  const categoryCounts = selectedCategories.reduce((acc, cat) => {
    acc[cat] = pins.filter((p) => p.kategori === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Aktif mod etiketi
  const activeModes = selectedCategories
    .map((c) => CATEGORY_CONFIG[c]?.etiket || c)
    .join(" + ");

  return (
    <div className="relative w-full h-full">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Geçiş overlay */}
      {isTransitioning && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "#030A06", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "36px", height: "36px", border: "2px solid #00FF88", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* 2D Leaflet */}
      {viewMode === "2d" && (
        <LeafletMap
          pins={filteredPins}
          selectedCategories={selectedCategories}
          onPinSelect={handlePinSelect}
        />
      )}

      {/* 3D Globe */}
      {viewMode === "3d" && (
        <VectorGlobe pins={filteredPins} onPinClick={handlePinSelect} />
      )}

      {/* ── ÜST BAR ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 40, padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>

        {/* Arama + toggle butonları */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Arama */}
          <div style={{ flex: 1, background: "rgba(3,10,6,0.88)", border: "1px solid rgba(0,255,136,0.15)", backdropFilter: "blur(14px)", padding: "2px 8px" }}>
            <SearchBar
              onSearch={search.executeSearch}
              onClear={search.clearSearch}
              isSearching={search.isSearching}
              totalResults={search.totalResults}
              hasSearched={search.hasSearched}
              matchedKeywords={search.matchedKeywords}
              disabled={isGuest}
            />
          </div>

          {/* 2D / 3D toggle */}
          <div style={{ display: "flex", background: "rgba(3,10,6,0.9)", border: "1px solid rgba(0,255,136,0.15)", backdropFilter: "blur(14px)", overflow: "hidden", flexShrink: 0 }}>
            {(["2d", "3d"] as const).map((mode) => (
              <button key={mode} onClick={() => handleViewToggle(mode)}
                style={{
                  padding: "8px 16px", fontFamily: "monospace", fontSize: "10px",
                  letterSpacing: "2px", textTransform: "uppercase", cursor: "crosshair", transition: "all .2s",
                  background: viewMode === mode ? "#00FF88" : "transparent",
                  color: viewMode === mode ? "#000" : "#4A8862",
                  border: "none",
                }}>
                {mode === "2d" ? "🗺️ 2D" : "🌍 3D"}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            style={{
              background: "rgba(3,10,6,0.9)",
              border: "1px solid rgba(0,255,136,0.15)",
              color: isFullscreen ? "#00FF88" : "#4A8862",
              backdropFilter: "blur(14px)",
              padding: "8px 12px",
              fontSize: "14px",
              cursor: "crosshair",
              transition: "all .2s",
              flexShrink: 0,
            }}
            title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>

          {/* Profil */}
          {isAuthenticated ? (
            <Link href="/profile"
              style={{ background: "rgba(3,10,6,0.9)", border: "1px solid rgba(0,255,136,0.15)", backdropFilter: "blur(14px)", padding: "8px 12px", textDecoration: "none", fontSize: "14px", flexShrink: 0 }}
              title="Profil & Ayarlar">
              👤
            </Link>
          ) : (
            <Link href="/auth/register"
              style={{ background: "rgba(3,10,6,0.9)", border: "1px solid rgba(255,136,0,0.22)", color: "#FF8800", backdropFilter: "blur(14px)", padding: "8px 12px", textDecoration: "none", fontSize: "11px", letterSpacing: "1px", flexShrink: 0 }}
              title="Kayıt olarak tüm özellikleri aç">
              KAYIT
            </Link>
          )}

          {isAuthenticated && (
            <NotificationBell
              unreadCount={notifications.unreadCount}
              isOpen={notifications.isOpen}
              onToggle={notifications.togglePanel}
            />
          )}

          {/* Timeline */}
          <button
            onClick={() => {
              if (!isAuthenticated) return;
              setShowTimeline(!showTimeline);
            }}
            style={{
              background: showTimeline ? "rgba(255,136,0,0.12)" : "rgba(3,10,6,0.9)",
              border: `1px solid ${showTimeline ? "rgba(255,136,0,0.4)" : "rgba(0,255,136,0.15)"}`,
              color: showTimeline ? "#FF8800" : "#4A8862",
              backdropFilter: "blur(14px)", padding: "8px 12px", fontSize: "14px",
              cursor: "crosshair", transition: "all .2s", flexShrink: 0,
            }}
            title="Zaman Çizelgesi">
            ⏱️
          </button>
        </div>

        {/* Kategori filtre şeridi */}
        <div style={{ background: "rgba(3,10,6,0.88)", border: "1px solid rgba(0,255,136,0.1)", backdropFilter: "blur(14px)" }}>
          <TagBar
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
          />
        </div>
      </div>

      {/* Bildirim listesi */}
      {isAuthenticated && notifications.isOpen && (
        <NotificationList
          notifications={notifications.notifications}
          onMarkRead={notifications.markRead}
          onMarkAllRead={notifications.markAllRead}
          onClose={notifications.closePanel}
        />
      )}

      {isGuest && (
        <div style={{ position: "absolute", top: "130px", left: "50%", transform: "translateX(-50%)", zIndex: 40, background: "rgba(3,10,6,0.95)", border: "1px solid rgba(255,136,0,0.22)", backdropFilter: "blur(14px)", padding: "14px 20px", textAlign: "center", fontFamily: "monospace" }}>
          <div style={{ color: "#FF8800", fontSize: "9px", letterSpacing: "3px", marginBottom: "4px" }}>MİSAFİR MODU</div>
          <div style={{ color: "#C0FFD8", fontSize: "11px" }}>
            Arama, bildirim, zaman çizelgesi ve yıldızlama için kayıt olman gerekiyor.
          </div>
        </div>
      )}

      {/* Timeline paneli */}
      {showTimeline && (
        <TimelinePanel
          pins={filteredPins}
          onClose={() => setShowTimeline(false)}
          onPinSelect={handlePinSelect}
        />
      )}

      {/* Arama sonuç yok */}
      {search.hasSearched && search.results.length === 0 && !search.isSearching && (
        <div style={{ position: "absolute", top: "130px", left: "50%", transform: "translateX(-50%)", zIndex: 40, background: "rgba(3,10,6,0.95)", border: "1px solid rgba(0,255,136,0.15)", backdropFilter: "blur(14px)", padding: "14px 24px", textAlign: "center", fontFamily: "monospace" }}>
          <div style={{ color: "#4A8862", fontSize: "9px", letterSpacing: "3px", marginBottom: "4px" }}>SORGU SONUCU</div>
          <div style={{ color: "#C0FFD8", fontSize: "11px" }}>
            &quot;<span style={{ color: "#00FF88" }}>{search.query}</span>&quot; için sonuç bulunamadı
          </div>
          <div style={{ color: "#4A8862", fontSize: "9px", marginTop: "4px", letterSpacing: "1px" }}>
            Farklı kelimeler deneyin veya aramayı temizleyin
          </div>
        </div>
      )}

      {/* ── ALT BAR ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(3,10,6,0.92)", borderTop: "1px solid rgba(0,255,136,0.1)", backdropFilter: "blur(14px)", padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "monospace", fontSize: "9px", letterSpacing: "1.5px" }}>
        {/* Sol — mod + sayaçlar */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {isLoading ? (
            <span style={{ color: "#00FF88", animation: "pulse 1s infinite" }}>
              📡 VERİ ÇEKİLİYOR...
            </span>
          ) : (
            <>
              <span style={{ color: "#C0FFD8" }}>{activeModes || "TÜM MODLAR"}</span>
              <span style={{ color: "rgba(0,255,136,0.2)" }}>|</span>
              {selectedCategories.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const count = categoryCounts[cat] || 0;
                if (count === 0) return null;
                return (
                  <span key={cat} style={{ color: cfg.renk }}>
                    {cfg.ikon} {count}
                  </span>
                );
              })}
              <span style={{ color: "#4A8862" }}>({filteredPins.length} görünür)</span>
            </>
          )}
        </div>

        {/* Sağ — son güncelleme */}
        <div style={{ color: "#4A8862" }}>
          {lastUpdated && (
            <span>
              🔄 {lastUpdated.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Detay paneli */}
      <DetailPanel
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
        allPins={filteredPins}
        onNavigate={handlePinSelect}
        onStar={isAuthenticated ? handleStarToggle : undefined}
        isStarred={isPinStarred}
      />
    </div>
  );
}


