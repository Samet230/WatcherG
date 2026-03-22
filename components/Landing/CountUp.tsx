"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpProps {
    end: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
}

export default function CountUp({
    end,
    duration = 2000,
    suffix = "",
    prefix = "",
    className = "",
}: CountUpProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let startTime: number | null = null;

                    const step = (timestamp: number) => {
                        if (!startTime) startTime = timestamp;
                        const progress = Math.min((timestamp - startTime) / duration, 1);

                        // Ease out cubic
                        const currentCount = Math.floor(progress === 1 ? end : end * (1 - Math.pow(1 - progress, 3)));
                        setCount(currentCount);

                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        }
                    };

                    window.requestAnimationFrame(step);
                }
            },
            { threshold: 0.1 }
        );

        if (countRef.current) {
            observer.observe(countRef.current);
        }

        return () => observer.disconnect();
    }, [end, duration]);

    return (
        <div ref={countRef} className={className}>
            {prefix}{count}{suffix}
        </div>
    );
}
