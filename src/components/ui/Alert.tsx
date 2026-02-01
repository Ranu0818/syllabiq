import { ReactNode } from "react";
import { Lightbulb, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "tip" | "warning" | "info" | "success";

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: ReactNode;
    className?: string;
}

const variantConfig: Record<AlertVariant, { icon: typeof Lightbulb; classes: string; titleClass: string }> = {
    tip: {
        icon: Lightbulb,
        classes: "exam-tip",
        titleClass: "exam-tip-title",
    },
    warning: {
        icon: AlertTriangle,
        classes: "bg-[rgba(239,68,68,0.1)] border border-red-500/30 border-l-4 border-l-red-500 rounded-lg p-4",
        titleClass: "text-red-500 font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-2",
    },
    info: {
        icon: Info,
        classes: "bg-[rgba(0,212,255,0.1)] border border-[var(--accent-cyan)]/30 border-l-4 border-l-[var(--accent-cyan)] rounded-lg p-4",
        titleClass: "text-[var(--accent-cyan)] font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-2",
    },
    success: {
        icon: CheckCircle,
        classes: "bg-[rgba(16,185,129,0.1)] border border-emerald-500/30 border-l-4 border-l-emerald-500 rounded-lg p-4",
        titleClass: "text-emerald-500 font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-2",
    },
};

export function Alert({ variant = "tip", title, children, className }: AlertProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    const defaultTitles: Record<AlertVariant, string> = {
        tip: "Exam Tip",
        warning: "Warning",
        info: "Info",
        success: "Success",
    };

    return (
        <div className={cn(config.classes, className)}>
            <div className={config.titleClass}>
                <Icon size={16} />
                {title || defaultTitles[variant]}
            </div>
            <div className="text-[var(--text-primary)] text-sm leading-relaxed">
                {children}
            </div>
        </div>
    );
}

// Shortcut for Exam Tip specifically
export function ExamTip({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <Alert variant="tip" title="Exam Tip" className={className}>
            {children}
        </Alert>
    );
}
