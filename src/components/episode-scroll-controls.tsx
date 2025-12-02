"use client";

import { useEffect, useState } from "react";

interface EpisodeScrollControlsProps {
    title: string;
    description?: string;
}

export function EpisodeScrollControls({ title, description }: EpisodeScrollControlsProps) {
    const [showFloating, setShowFloating] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const header = document.querySelector(".episode-header");
        const main = document.querySelector(".episode-main");

        if (!header || !main) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowFloating(!entry.isIntersecting);
            },
            { threshold: 0 }
        );

        observer.observe(header);

        const handleScroll = () => {
            if (main.scrollTop > 300) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        main.addEventListener("scroll", handleScroll);

        return () => {
            observer.disconnect();
            main.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        const main = document.querySelector(".episode-main");
        main?.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            {/* Floating Header */}
            <div
                className={`absolute top-0 left-0 md:left-[300px] right-0 z-40 transition-opacity duration-500 ease-out ${showFloating
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                    }`}
            >
                <div
                    className="backdrop-blur-md border-b shadow-sm px-6 py-4 flex flex-col gap-0.5 w-full"
                    style={{
                        backgroundColor: "rgba(253, 251, 247, 0.95)",
                        borderColor: "rgba(17, 17, 17, 0.08)"
                    }}
                >
                    <div className={`!p-[.6rem] transition-transform duration-500 ease-out transform ${showFloating ? "translate-x-0" : "translate-x-[5px]"
                        }`}>
                        <h3 className="text-[15px] font-bold text-[#111111] truncate">{title}</h3>
                        {description && (
                            <p className="text-[12px] text-[#666666] truncate">{description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg text-white transition-all duration-300 transform ${showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
                    }`}
                style={{ backgroundColor: "var(--accent-color)" }}
                aria-label="Back to top"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 15l-6-6-6 6" />
                </svg>
            </button>
        </>
    );
}
