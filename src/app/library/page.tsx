"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Library as LibraryIcon, BookOpen, Plus, ChevronRight, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Card, CardTitle, Button } from "@/components/ui";

import { useState, useEffect } from "react";
import { supabase, StudyPack } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCreation } from "@/contexts/CreationContext";

export default function LibraryPage() {
    const { user, isAuthenticated } = useAuth();
    const { openCreator } = useCreation();
    const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
    const [isLoadingPacks, setIsLoadingPacks] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirmDeleteId !== id) {
            setConfirmDeleteId(id);
            // Reset after 3 seconds if not confirmed
            setTimeout(() => setConfirmDeleteId(null), 3000);
            return;
        }

        try {
            const { error } = await supabase
                .from("study_packs")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setStudyPacks(prev => prev.filter(p => p.id !== id));
            setConfirmDeleteId(null);
        } catch (err) {
            console.error("Error deleting pack:", err);
        }
    };

    const fetchPacks = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("study_packs")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setStudyPacks(data || []);
        } catch (err) {
            console.error("Error fetching study packs:", err);
        } finally {
            setIsLoadingPacks(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchPacks();
        } else {
            setIsLoadingPacks(false);
        }
    }, [user, isAuthenticated]);

    return (
        <AppShell onSuccess={fetchPacks}>
            <div className="container py-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                        <LibraryIcon className="text-[var(--accent-cyan)]" size={20} />
                    </div>
                    <div>
                        <h1 className="heading-2">My Library</h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            {studyPacks.length} study packs
                        </p>
                    </div>
                </motion.div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {["All", "Biology", "Chemistry", "Physics", "Maths"].map((tab, i) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${i === 0
                                ? "bg-[var(--accent-cyan)] text-[var(--primary-bg)]"
                                : "glass-card text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Study Packs Grid */}
                {isLoadingPacks ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {studyPacks.map((pack, index) => (
                            <Link key={pack.id} href={`/study/${pack.id}`}>
                                <Card className="cursor-pointer hover:border-[var(--accent-cyan)] transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                                                <BookOpen className="text-[var(--accent-cyan)]" size={18} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{pack.title}</CardTitle>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {pack.subject} • Grade {pack.grade}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleDelete(e, pack.id)}
                                                className={`p-2 rounded-lg transition-all flex items-center gap-1 ${confirmDeleteId === pack.id
                                                    ? "bg-red-500 text-white text-[10px] font-bold px-3 animate-pulse"
                                                    : "text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                                                    }`}
                                            >
                                                {confirmDeleteId === pack.id ? (
                                                    <>
                                                        <AlertCircle size={14} />
                                                        CONFIRM?
                                                    </>
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                            <ChevronRight size={18} className="text-[var(--text-muted)]" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                                            <span>{pack.flashcards.length} flashcards</span>
                                            <span>{pack.quizzes.length} quizzes</span>
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {new Date(pack.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State (when no packs) */}
                {!isLoadingPacks && studyPacks.length === 0 && (
                    <div className="text-center py-12">
                        <LibraryIcon className="mx-auto text-[var(--text-muted)] mb-4" size={48} />
                        <h3 className="heading-3 mb-2">No study packs yet</h3>
                        <p className="text-[var(--text-muted)] mb-6">
                            Create your first study pack to get started
                        </p>
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={18} />}
                            onClick={() => openCreator(fetchPacks)}
                        >
                            Create Study Pack
                        </Button>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
