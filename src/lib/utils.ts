import { clsx, type ClassValue } from "clsx";

/**
 * Merge class names utility
 * Combines multiple class names, filtering out falsy values
 */
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Calculate estimated data saved from video processing
 * Assumes 10MB per minute of video
 */
export function calculateDataSaved(videoMinutes: number): number {
    const VIDEO_MB_PER_MINUTE = 10;
    const TEXT_KB_PER_MINUTE = 5; // Approximate text output

    const videoBytes = videoMinutes * VIDEO_MB_PER_MINUTE * 1024 * 1024;
    const textBytes = videoMinutes * TEXT_KB_PER_MINUTE * 1024;

    return videoBytes - textBytes;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Grade levels for Sri Lankan curriculum
 */
export const GRADE_LEVELS = [
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" },
    { value: "10", label: "Grade 10" },
    { value: "11", label: "O/L" },
    { value: "12", label: "Grade 12 (A/L)" },
    { value: "13", label: "Grade 13 (A/L)" },
] as const;

/**
 * Study streams for A/L students
 */
export const STUDY_STREAMS = [
    { value: "bio", label: "Biology Science" },
    { value: "maths", label: "Physical Science (Maths)" },
    { value: "arts", label: "Arts" },
    { value: "commerce", label: "Commerce" },
    { value: "tech", label: "Technology" },
] as const;

/**
 * Subject categories
 */
export const SUBJECTS = {
    science: ["Biology", "Chemistry", "Physics", "Combined Maths", "ICT"],
    arts: ["History", "Geography", "Political Science", "Sinhala", "English"],
    commerce: ["Accounting", "Business Studies", "Economics"],
    common: ["Mathematics", "Science", "English", "Sinhala", "Tamil"],
} as const;
