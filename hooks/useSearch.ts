// WatcherG — Arama hook'u
// SearchBar ve GlobeContainer arasında arama durumunu yönetir

import { useState, useCallback, useRef } from "react";
import type { Pin } from "@/types/pin";

interface SearchState {
    query: string;
    isSearching: boolean;
    results: Pin[];
    totalResults: number;
    matchedKeywords: string[];
    scopeLevel: string;
    error: string | null;
    hasSearched: boolean;
}

const INITIAL_STATE: SearchState = {
    query: "",
    isSearching: false,
    results: [],
    totalResults: 0,
    matchedKeywords: [],
    scopeLevel: "global",
    error: null,
    hasSearched: false,
};

export function useSearch() {
    const [searchState, setSearchState] = useState<SearchState>(INITIAL_STATE);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Arama yap
    const executeSearch = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSearchState(INITIAL_STATE);
            return;
        }

        // Önceki aramayı iptal et
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setSearchState((prev) => ({
            ...prev,
            query,
            isSearching: true,
            error: null,
        }));

        try {
            const response = await fetch(
                `/api/search?q=${encodeURIComponent(query)}`,
                { signal: abortController.signal }
            );

            if (!response.ok) {
                if (response.status === 429) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Çok fazla istek gönderildi.");
                }
                throw new Error("Arama başarısız oldu.");
            }

            const data = await response.json();

            if (abortController.signal.aborted) return;

            if (data.success) {
                setSearchState({
                    query,
                    isSearching: false,
                    results: data.data,
                    totalResults: data.meta.totalResults,
                    matchedKeywords: data.meta.analysis?.matchedKeywords || [],
                    scopeLevel: data.meta.analysis?.scopeLevel || "global",
                    error: null,
                    hasSearched: true,
                });
            } else {
                setSearchState((prev) => ({
                    ...prev,
                    isSearching: false,
                    error: data.error,
                    hasSearched: true,
                }));
            }
        } catch (searchError: unknown) {
            if (searchError instanceof Error && searchError.name === "AbortError") return;

            setSearchState((prev) => ({
                ...prev,
                isSearching: false,
                error: searchError instanceof Error
                    ? searchError.message
                    : "Bilinmeyen hata oluştu.",
                hasSearched: true,
            }));
        }
    }, []);

    // Aramayı temizle
    const clearSearch = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setSearchState(INITIAL_STATE);
    }, []);

    return {
        ...searchState,
        executeSearch,
        clearSearch,
    };
}
