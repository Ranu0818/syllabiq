"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, UserProfile } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signUpEmail: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
    signInEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                // Profile doesn't exist yet, create one
                if (error.code === "PGRST116") {
                    const newProfile: Partial<UserProfile> = {
                        id: userId,
                        email: user?.email || "",
                        full_name: user?.user_metadata?.full_name || null,
                        username: user?.user_metadata?.username || null,
                        avatar_url: user?.user_metadata?.avatar_url || null,
                        grade: null,
                        stream: null,
                        onboarding_complete: false,
                        streak: 0,
                        xp: 0,
                        data_saved_mb: 0,
                    };

                    const { data: created, error: createError } = await supabase
                        .from("profiles")
                        .insert(newProfile)
                        .select()
                        .single();

                    if (!createError && created) {
                        setProfile(created as UserProfile);
                    }
                }
                return;
            }

            if (data) {
                // Streak Logic: Check if we need to update
                const profile = data as UserProfile;
                const lastUpdate = new Date(profile.updated_at);
                const today = new Date();

                const isSameDay = lastUpdate.getDate() === today.getDate() &&
                    lastUpdate.getMonth() === today.getMonth() &&
                    lastUpdate.getFullYear() === today.getFullYear();

                if (!isSameDay) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const isConsecutive = lastUpdate.getDate() === yesterday.getDate() &&
                        lastUpdate.getMonth() === yesterday.getMonth() &&
                        lastUpdate.getFullYear() === yesterday.getFullYear();

                    const newStreak = isConsecutive ? (profile.streak || 0) + 1 : 1;

                    // Optimistic update
                    profile.streak = newStreak;
                    profile.updated_at = today.toISOString();

                    // Update DB quietly
                    supabase.from("profiles").update({
                        streak: newStreak,
                        updated_at: today.toISOString()
                    }).eq("id", userId).then(({ error }) => {
                        if (error) console.error("Failed to update streak:", error);
                    });
                }

                setProfile(profile);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    }, [user]);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Get current session
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    await fetchProfile(currentSession.user.id);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (event === "SIGNED_IN" && newSession?.user) {
                    await fetchProfile(newSession.user.id);
                } else if (event === "SIGNED_OUT") {
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });
        return { error };
    }, []);

    // Sign in with Email
    const signInEmail = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    }, []);

    // Sign up with Email
    const signUpEmail = useCallback(async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (!error && data.user) {
            // Profile will be created by the fetchProfile effect or onAuthStateChange
            // We can also manually trigger profile creation here if needed,
            // but for now we rely on the database trigger or our init logic.
        }

        return { error };
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } finally {
            setUser(null);
            setProfile(null);
            setSession(null);
        }
    }, []);

    // Update profile
    const updateProfile = useCallback(
        async (data: Partial<UserProfile>) => {
            if (!user) {
                return { error: new Error("No user logged in") };
            }

            try {
                const { error } = await supabase
                    .from("profiles")
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq("id", user.id);

                if (error) {
                    return { error: new Error(error.message) };
                }

                // Update local state
                setProfile((prev) => (prev ? { ...prev, ...data } : null));
                return { error: null };
            } catch (err) {
                return { error: err as Error };
            }
        },
        [user]
    );

    // Refresh profile
    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    }, [user, fetchProfile]);

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                isAuthenticated: !!user,
                signInWithGoogle,
                signUpEmail,
                signInEmail,
                signOut,
                updateProfile,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Hook to require authentication
export function useRequireAuth(redirectTo = "/auth/login") {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            window.location.href = redirectTo;
        }
    }, [isAuthenticated, isLoading, redirectTo]);

    return { isAuthenticated, isLoading };
}
