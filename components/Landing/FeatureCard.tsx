"use client";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: string;
    delay?: number;
}

export default function FeatureCard({ title, description, icon, delay = 0 }: FeatureCardProps) {
    return (
        <div
            className="flex flex-col gap-4 p-6 bg-[#12121A]/80 border border-[#1E1E2E] rounded-xl backdrop-blur-sm hover:border-[#00FF88]/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)] transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="w-12 h-12 rounded-lg bg-[#00FF88]/10 flex items-center justify-center text-2xl text-[#00FF88] border border-[#00FF88]/20">
                {icon}
            </div>
            <h3 className="text-xl font-heading font-bold text-[#E0E0E0]">
                {title}
            </h3>
            <p className="text-[#666680] leading-relaxed flex-grow">
                {description}
            </p>
        </div>
    );
}
