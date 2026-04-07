"use client";

interface TranslateToggleButtonProps {
    label: string;
    isTranslated: boolean;
    isLoading: boolean;
    disabled?: boolean;
    onClick: () => void;
    compact?: boolean;
}

export default function TranslateToggleButton({
    label,
    isTranslated,
    isLoading,
    disabled = false,
    onClick,
    compact = false,
}: TranslateToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`rounded border transition-colors ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px] tracking-[0.18em]"} ${
                disabled
                    ? "cursor-not-allowed border-white/10 bg-black/20 text-[#444]"
                    : isTranslated
                        ? "border-[#00FF88]/35 bg-[#00FF88]/10 text-[#00FF88]"
                        : "border-[#4488FF]/35 bg-[#4488FF]/10 text-[#9EC5FF] hover:border-[#4488FF]/55 hover:text-white"
            }`}
        >
            {isLoading ? "..." : label}
        </button>
    );
}
