"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Prevent static pre-rendering
export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, profile } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        if (isAuthenticated) {
            // Check if user has completed onboarding
            if (profile && !profile.onboarding_complete) {
                router.push("/auth/onboarding");
            } else {
                router.push("/");
            }
        } else {
            router.push("/auth/login");
        }
    }, [isAuthenticated, isLoading, profile, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-10 h-10 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Signing you in...</p>
            </div>
        </div>
    );
}
