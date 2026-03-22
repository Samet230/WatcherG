"use client";

// WatcherG — Arama çubuğu bileşeni
// Debounced arama, autocomplete önerileri, sonuç sayısı göstergesi

import { useState, useEffect, useRef, useCallback } from "react";
import { getSuggestions } from "@/lib/search/keywords";

interface SearchBarProps {
    onSearch: (query: string) => void;
    onClear: () => void;
    isSearching: boolean;
    totalResults: number;
    hasSearched: boolean;
    matchedKeywords: string[];
    disabled?: boolean;
}

export default function SearchBar({
    onSearch,
    onClear,
    isSearching,
    totalResults,
    hasSearched,
    matchedKeywords,
    disabled = false,
}: SearchBarProps) {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced arama — 400ms bekle
    const handleInputChange = useCallback(
        (value: string) => {
            if (disabled) return;
            setInputValue(value);

            // Öneri göster
            if (value.length >= 2) {
                const newSuggestions = getSuggestions(value);
                setSuggestions(newSuggestions);
                setShowSuggestions(newSuggestions.length > 0);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }

            // Debounce ile arama tetikle
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            if (value.trim().length >= 2) {
                debounceTimerRef.current = setTimeout(() => {
                    onSearch(value);
                }, 400);
            } else if (value.trim().length === 0) {
                onClear();
            }
        },
        [disabled, onSearch, onClear]
    );

    // Öneri seçimi
    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        onSearch(suggestion);
    };

    // Enter tuşu ile arama
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            if (disabled) return;
            setShowSuggestions(false);
            if (inputValue.trim().length >= 2) {
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                onSearch(inputValue);
            }
        }
        if (event.key === "Escape") {
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    // Temizle
    const handleClear = () => {
        setInputValue("");
        setSuggestions([]);
        setShowSuggestions(false);
        onClear();
        inputRef.current?.focus();
    };

    // Dışarı tıklayınca önerileri kapat
    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            {/* Arama input */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666680] text-sm">
                    🔍
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (disabled) return;
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Ara... (ör: Türkiye depremleri, son dakika)"
                    disabled={disabled}
                    className="w-full bg-[#0A0A0F]/60 border border-[#1E1E2E] rounded-lg pl-9 pr-20 py-2 text-sm text-[#E0E0E0] placeholder-[#444] focus:outline-none focus:border-[#00FF88]/50 transition-colors"
                />

                {/* Sağ taraf — loading/temizle/sonuç */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {isSearching && (
                        <div className="w-4 h-4 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
                    )}

                    {hasSearched && !isSearching && (
                        <span className="text-[#666680] text-xs">
                            {totalResults > 0 ? `${totalResults}` : "0"}
                        </span>
                    )}

                    {inputValue.length > 0 && !disabled && (
                        <button
                            onClick={handleClear}
                            className="text-[#666680] hover:text-white text-xs p-0.5 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Autocomplete önerileri */}
            {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#12121A]/95 border border-[#1E1E2E] rounded-lg backdrop-blur-md shadow-xl z-50 overflow-hidden">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-2 text-sm text-[#E0E0E0] hover:bg-[#1E1E2E] transition-colors border-b border-[#1E1E2E]/50 last:border-b-0"
                        >
                            <span className="text-[#666680] mr-2">🔍</span>
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Eşleşen anahtar kelimeler */}
            {hasSearched && matchedKeywords.length > 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 flex flex-wrap gap-1 px-1">
                    {matchedKeywords.slice(0, 5).map((keyword, index) => (
                        <span
                            key={index}
                            className="text-[10px] bg-[#00FF88]/10 text-[#00FF88] px-1.5 py-0.5 rounded"
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
