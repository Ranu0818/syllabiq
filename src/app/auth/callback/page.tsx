"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Prevent static pre-rendering
export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the code from URL
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Auth callback error:", error);
                    router.push("/auth/login?error=callback_failed");
                    return;
                }

                if (data.session) {
                    // Check if user has completed onboarding
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("onboarding_complete")
                        .eq("id", data.session.user.id)
                        .single();

                    if (profile && !profile.onboarding_complete) {
                        router.push("/auth/onboarding");
                    } else {
                        router.push("/");
                    }
                } else {
                    router.push("/auth/login");
                }
            } catch (err) {
                console.error("Callback processing error:", err);
                router.push("/auth/login?error=unknown");
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-10 h-10 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Signing you in...</p>
            </div>
        </div>
    );
}
