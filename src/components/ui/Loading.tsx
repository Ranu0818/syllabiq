import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    return (
        <svg
            className={cn("animate-spin text-[var(--accent-cyan)]", sizeClasses[size], className)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--primary-bg)]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-[var(--text-secondary)] text-sm">{message}</p>
            </div>
        </div>
    );
}

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
    return (
        <div
            className={cn("skeleton", className)}
            style={{ width, height }}
        />
    );
}

// Card skeleton for loading states
export function CardSkeleton() {
    return (
        <div className="glass-card-static p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
        </div>
    );
}
