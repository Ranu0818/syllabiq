"use client";

import { Zap } from "lucide-react";
import { useDataSaver } from "@/contexts/DataSaverContext";
import { cn } from "@/lib/utils";

interface DataSaverToggleProps {
    className?: string;
}

export function DataSaverToggle({ className }: DataSaverToggleProps) {
    const { isDataSaver, toggleDataSaver } = useDataSaver();

    return (
        <button
            onClick={toggleDataSaver}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                isDataSaver
                    ? "bg-[var(--secondary-gold)] text-[var(--primary-bg)]"
                    : "glass-card text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]",
                className
            )}
            aria-label={isDataSaver ? "Disable Data Saver" : "Enable Data Saver"}
        >
            <Zap size={16} />
            {isDataSaver ? "Data Saver ON" : "Data Saver"}
        </button>
    );
}
