import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        "⚠️ Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
    );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Database types (extend as needed)
export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    grade: string | null;
    stream: string | null;
    created_at: string;
    updated_at: string;
    onboarding_complete: boolean;
    streak: number;
    xp: number;
    data_saved_mb: number;
}

export interface StudyPack {
    id: string;
    user_id: string;
    title: string;
    subject: string;
    grade: string;
    content_type: "youtube" | "pdf" | "text";
    source_url: string | null;
    notes: string | null;
    flashcards: Flashcard[];
    quizzes: Quiz[];
    created_at: string;
    updated_at: string;
    is_offline: boolean;
    suggested_questions?: string[];
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    mastered: boolean;
}

export interface Quiz {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}
