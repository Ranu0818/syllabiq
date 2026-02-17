"use client";

import { motion } from "framer-motion";
import { Library as LibraryIcon, BookOpen, Plus, ChevronRight, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Card, CardTitle, Button } from "@/components/ui";

import { useState, useEffect, useCallback } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudyPack } from "@/lib/supabase"; // For types
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
            await deleteDoc(doc(db, "study_packs", id));
            setStudyPacks(prev => prev.filter(p => p.id !== id));
            setConfirmDeleteId(null);
        } catch (err) {
            console.error("Error deleting pack:", err);
        }
    };

    const fetchPacks = useCallback(async () => {
        if (!user) return;

        try {
            const q = query(
                collection(db, "study_packs"),
                where("user_id", "==", user.uid)
                // orderBy removed to prevent "Index Required" error. Sorting done in-memory below.
            );

            const querySnapshot = await getDocs(q);
            const packs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as StudyPack[];

            // Sort in-memory (Newest first)
            packs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setStudyPacks(packs);
        } catch (err) {
            console.error("Error fetching study packs:", err);
        } finally {
            setIsLoadingPacks(false);
        }
    }, [user]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPacks();
        } else {
            setIsLoadingPacks(false);
        }
    }, [user, isAuthenticated, fetchPacks]);

    const [selectedCategory, setSelectedCategory] = useState("All");

    const filteredPacks = selectedCategory === "All"
        ? studyPacks
        : studyPacks.filter(pack => pack.subject === selectedCategory);

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
                            {filteredPacks.length} study packs
                        </p>
                    </div>
                </motion.div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {["All", "Biology", "Chemistry", "Physics", "Maths"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedCategory(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${selectedCategory === tab
                                ? "bg-[var(--accent-cyan)] text-[var(--primary-bg)] border-[var(--accent-cyan)] shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                                : "bg-white/5 border-white/5 text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)]"
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
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredPacks.map((pack) => (
                            <Link key={pack.id} href={`/study/${pack.id}`} className="h-full">
                                <Card className="cursor-pointer hover:border-[var(--accent-cyan)] transition-colors h-full flex flex-col justify-between p-6 hover:bg-white/5 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                                        <BookOpen size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center border border-[var(--accent-cyan)]/20">
                                                    <BookOpen className="text-[var(--accent-cyan)]" size={24} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg leading-tight mb-1 line-clamp-1" title={pack.title}>{pack.title}</CardTitle>
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[var(--text-muted)] border border-white/10">
                                                        {pack.subject}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, pack.id)}
                                                className={`p-2 rounded-lg transition-all flex items-center gap-1 ${confirmDeleteId === pack.id
                                                    ? "bg-red-500 text-white text-[10px] font-bold px-3 animate-pulse"
                                                    : "text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                    }`}
                                            >
                                                {confirmDeleteId === pack.id ? (
                                                    <Trash2 size={16} />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>

                                        <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-6 h-10">
                                            {pack.grade ? `Grade ${pack.grade}` : "General Study"} content.
                                            Includes flashcards and quizzes for revision.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                                        <div className="flex gap-4 text-xs font-medium text-[var(--text-secondary)]">
                                            <span className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />
                                                {pack.flashcards.length} Cards
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-gold)]" />
                                                {pack.quizzes.length} Quiz
                                            </span>
                                        </div>
                                        <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </motion.div>
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
