import { create } from "zustand";
import type { Pin, PinCategory } from "@/types/pin";

interface MapState {
    viewMode: "2d" | "3d";
    setViewMode: (mode: "2d" | "3d") => void;
    isFullscreen: boolean;
    setIsFullscreen: (value: boolean) => void;
    toggleFullscreen: () => void;
    activeTheme: PinCategory | "all";
    setActiveTheme: (theme: PinCategory | "all") => void;
    allPins: Pin[];
    visiblePins: Pin[];
    selectedCategories: PinCategory[];
    isFeedLoading: boolean;
    lastUpdated: string | null;
    setFeedState: (payload: Partial<Pick<MapState, "allPins" | "visiblePins" | "selectedCategories" | "isFeedLoading" | "lastUpdated">>) => void;
    mobilePanelOpen: "left" | "right" | "bottom" | null;
    setMobilePanelOpen: (panel: "left" | "right" | "bottom" | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
    viewMode: "2d",
    setViewMode: (mode) => set({ viewMode: mode }),
    isFullscreen: false,
    setIsFullscreen: (value) => set({ isFullscreen: value }),
    toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
    activeTheme: "all",
    setActiveTheme: (theme) => set({ activeTheme: theme }),
    allPins: [],
    visiblePins: [],
    selectedCategories: [],
    isFeedLoading: false,
    lastUpdated: null,
    setFeedState: (payload) => set(payload),
    mobilePanelOpen: null,
    setMobilePanelOpen: (panel) => set({ mobilePanelOpen: panel }),
}));
