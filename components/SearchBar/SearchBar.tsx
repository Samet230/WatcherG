"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSuggestions } from "@/lib/search/keywords";
import { translate } from "@/lib/i18n";
import { useLanguageStore } from "@/store/languageStore";

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
    const language = useLanguageStore((state) => state.language);
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInputChange = useCallback(
        (value: string) => {
            if (disabled) return;
            setInputValue(value);

            if (value.length >= 2) {
                const newSuggestions = getSuggestions(value);
                setSuggestions(newSuggestions);
                setShowSuggestions(newSuggestions.length > 0);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }

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
        [disabled, onClear, onSearch]
    );

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        onSearch(suggestion);
    };

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

    const handleClear = () => {
        setInputValue("");
        setSuggestions([]);
        setShowSuggestions(false);
        onClear();
        inputRef.current?.focus();
    };

    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="relative flex-1" onClick={(event) => event.stopPropagation()}>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#666680]">
                    🔍
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (disabled) return;
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder={translate(language, "search_placeholder")}
                    disabled={disabled}
                    className="w-full rounded-lg border border-[#1E1E2E] bg-[#0A0A0F]/60 pl-9 pr-20 py-2 text-sm text-[#E0E0E0] placeholder-[#444] transition-colors focus:border-[#00FF88]/50 focus:outline-none"
                />

                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                    {isSearching && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00FF88] border-t-transparent" />
                    )}

                    {hasSearched && !isSearching && (
                        <span className="text-xs text-[#666680]">
                            {totalResults > 0 ? `${totalResults}` : "0"}
                        </span>
                    )}

                    {inputValue.length > 0 && !disabled && (
                        <button
                            onClick={handleClear}
                            className="p-0.5 text-xs text-[#666680] transition-colors hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {disabled && (
                <div className="mt-1 px-1 text-[10px] text-[#666680]">
                    {translate(language, "search_disabled_short")}
                </div>
            )}

            {showSuggestions && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#1E1E2E] bg-[#12121A]/95 shadow-xl backdrop-blur-md">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full border-b border-[#1E1E2E]/50 px-4 py-2 text-left text-sm text-[#E0E0E0] transition-colors last:border-b-0 hover:bg-[#1E1E2E]"
                        >
                            <span className="mr-2 text-[#666680]">🔍</span>
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {hasSearched && matchedKeywords.length > 0 && !isSearching && (
                <div className="absolute left-0 right-0 top-full mt-1 flex flex-wrap gap-1 px-1">
                    {matchedKeywords.slice(0, 5).map((keyword, index) => (
                        <span
                            key={index}
                            className="rounded bg-[#00FF88]/10 px-1.5 py-0.5 text-[10px] text-[#00FF88]"
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
