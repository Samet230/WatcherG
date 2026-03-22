"use client";

import { useEffect, useState } from "react";

export default function EyeAnimation() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate normalized mouse position (-1 to 1)
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="relative w-32 h-32 md:w-48 md:h-48 mb-8">
            {/* Glow effect behind eye */}
            <div className="absolute inset-0 bg-[#00FF88] rounded-full blur-[40px] opacity-20 animate-pin-pulse"></div>

            {/* Eye outer shape */}
            <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]">
                    {/* Sclera (White part, slightly dark in our theme) */}
                    <path
                        d="M 10 50 Q 50 10 90 50 Q 50 90 10 50 Z"
                        fill="#12121A"
                        stroke="#1E1E2E"
                        strokeWidth="2"
                        className="transition-colors duration-300"
                    />

                    {/* Iris and Pupil container matching mouse movement */}
                    <g transform={`translate(${mousePos.x * 12}, ${mousePos.y * 12})`} className="transition-transform duration-75 ease-out">
                        {/* Iris */}
                        <circle cx="50" cy="50" r="20" fill="#00FF88" className="opacity-80" />

                        {/* Pupil */}
                        <circle cx="50" cy="50" r="10" fill="#0A0A0F" className="animate-pulse" />

                        {/* Light reflection */}
                        <circle cx="45" cy="45" r="4" fill="#FFFFFF" className="opacity-60" />
                    </g>
                </svg>
            </div>
        </div>
    );
}
