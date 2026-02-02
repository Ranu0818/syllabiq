"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile as firebaseUpdateProfile
} from "firebase/auth";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/lib/supabase"; // Keeping types for consistency

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signInWithGoogle: () => Promise<{ error: any | null }>;
    signUpEmail: (email: string, password: string, fullName: string) => Promise<{ error: any | null }>;
    signInEmail: (email: string, password: string) => Promise<{ error: any | null }>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            console.log("[Auth] Fetching profile for:", userId);
            const docRef = doc(db, "profiles", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const profileObj = docSnap.data() as UserProfile;

                // Streak Logic
                const lastUpdateStr = profileObj.updated_at || profileObj.created_at;
                const lastUpdate = lastUpdateStr ? new Date(lastUpdateStr) : new Date();
                const today = new Date();

                if (!isNaN(lastUpdate.getTime())) {
                    const isSameDay = lastUpdate.getDate() === today.getDate() &&
                        lastUpdate.getMonth() === today.getMonth() &&
                        lastUpdate.getFullYear() === today.getFullYear();

                    if (!isSameDay) {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const isConsecutive = lastUpdate.getDate() === yesterday.getDate() &&
                            lastUpdate.getMonth() === yesterday.getMonth() &&
                            lastUpdate.getFullYear() === yesterday.getFullYear();

                        const newStreak = isConsecutive ? (profileObj.streak || 0) + 1 : 1;

                        // Update DB
                        await updateDoc(docRef, {
                            streak: newStreak,
                            updated_at: today.toISOString()
                        });
                        profileObj.streak = newStreak;
                    }
                }

                setProfile(profileObj);
            } else {
                console.log("[Auth] Profile not found for existing user.");
            }
        } catch (err) {
            console.error("[Auth] Critical error in fetchProfile:", err);
        }
    }, []);

    // Create profile if not exists
    const ensureProfile = async (currentUser: User, fullName?: string) => {
        try {
            const docRef = doc(db, "profiles", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.log("[Auth] Creating new profile for:", currentUser.uid);
                const newProfile: UserProfile = {
                    id: currentUser.uid,
                    email: currentUser.email || "",
                    full_name: fullName || currentUser.displayName || null,
                    username: null,
                    avatar_url: currentUser.photoURL || null,
                    grade: null,
                    stream: null,
                    onboarding_complete: false,
                    streak: 1,
                    xp: 0,
                    data_saved_mb: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                await setDoc(docRef, newProfile);
                setProfile(newProfile);
            } else {
                setProfile(docSnap.data() as UserProfile);
            }
        } catch (err) {
            console.error("[Auth] Error in ensureProfile:", err);
        }
    };

    // Initialize auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchProfile(currentUser.uid);
            } else {
                setProfile(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [fetchProfile]);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await ensureProfile(result.user);
            return { error: null };
        } catch (error) {
            return { error };
        }
    }, []);

    // Sign in with Email
    const signInEmail = useCallback(async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { error: null };
        } catch (error) {
            return { error };
        }
    }, []);

    // Sign up with Email
    const signUpEmail = useCallback(async (email: string, password: string, fullName: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await firebaseUpdateProfile(result.user, { displayName: fullName });
            await ensureProfile(result.user, fullName);
            return { error: null };
        } catch (error) {
            return { error };
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
        } finally {
            setUser(null);
            setProfile(null);
        }
    }, []);

    // Update profile
    const updateProfile = useCallback(
        async (data: Partial<UserProfile>) => {
            if (!user) {
                return { error: new Error("No user logged in") };
            }

            try {
                const docRef = doc(db, "profiles", user.uid);
                const updateData = { ...data, updated_at: new Date().toISOString() };
                await updateDoc(docRef, updateData);

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
            await fetchProfile(user.uid);
        }
    }, [user, fetchProfile]);

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
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
