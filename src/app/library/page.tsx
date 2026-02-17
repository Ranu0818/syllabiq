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
                        className="space-y-5"
                    >
                        {filteredPacks.map((pack) => (
                            <Link key={pack.id} href={`/study/${pack.id}`}>
                                <Card className="cursor-pointer hover:border-[var(--accent-cyan)] transition-colors p-4 group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="text-[var(--accent-cyan)]" size={24} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg mb-1">{pack.title}</CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[var(--text-muted)] border border-white/10">
                                                        {pack.subject}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-muted)]">• Grade {pack.grade}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleDelete(e, pack.id)}
                                                className={`p-2 rounded-lg transition-all flex items-center gap-1 ${confirmDeleteId === pack.id
                                                    ? "bg-red-500 text-white text-[10px] font-bold px-3 animate-pulse"
                                                    : "text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    }`}
                                            >
                                                {confirmDeleteId === pack.id ? (
                                                    <Trash2 size={16} />
                                                ) : (
                                                    <Trash2 size={20} />
                                                )}
                                            </button>
                                            <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pl-[4.5rem]">
                                        <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />
                                                {pack.flashcards.length} Flashcards
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-gold)]" />
                                                {pack.quizzes.length} Quizzes
                                            </span>
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            Created {new Date(pack.created_at).toLocaleDateString()}
                                        </span>
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
